"""Dataset Fetcher - Automatically fetches datasets from Kaggle when needed"""
import asyncio
import subprocess
import os
from pathlib import Path
from typing import List, Dict, Optional
import json


class DatasetFetcher:
    """
    Automatically fetches datasets from Kaggle when they're missing
    """
    
    # Dataset definitions with their Kaggle identifiers
    DATASETS = {
        "airbnb_nyc": {
            "primary": "dominoweir/inside-airbnb-nyc",
            "alternative": "ahmedmagdee/inside-airbnb",
            "type": "dataset",
            "expected_files": ["listings.csv", "airbnb_nyc.csv"],
            "processor_type": "airbnb"
        },
        "hotel_booking": {
            "source": "mojtaba142/hotel-booking",
            "type": "dataset",
            "expected_files": ["hotel_booking.csv"],
            "processor_type": "hotel_booking"
        },
        "flight_price": {
            "source": "shubhambathwal/flight-price-prediction",
            "type": "dataset",
            "expected_files": ["flight_prices.csv", "flight_price_prediction.csv"],
            "processor_type": "flight_price"
        },
        "flightprices": {
            "source": "dilwong/flightprices",
            "type": "dataset",
            "expected_files": ["flightprices.csv"],
            "processor_type": "flightprices"
        },
        "global_airports": {
            "source": "samvelkoch/global-airports-iata-icao-timezone-geo",
            "type": "dataset",
            "expected_files": ["global_airports.csv", "airports.csv"],
            "processor_type": None  # Loaded by AirportMapper
        },
        "expedia_hotel": {
            "source": "expedia-hotel-recommendations",
            "type": "competition",
            "expected_files": ["train.csv"],
            "processor_type": "expedia_hotel",
            "requires_rules_acceptance": True
        },
        "airlines_routes": {
            "source": "elmoallistair/airlines-airport-and-routes",
            "type": "dataset",
            "expected_files": ["routes.csv", "airlines.csv"],
            "processor_type": "airlines_routes"
        }
    }
    
    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize dataset fetcher
        
        Args:
            data_dir: Directory to store datasets (default: data/raw)
        """
        if data_dir:
            self.data_dir = Path(data_dir)
        else:
            self.data_dir = Path(__file__).parent.parent.parent / "data" / "raw"
        
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.kaggle_available = self._check_kaggle_cli()
    
    def _check_kaggle_cli(self) -> bool:
        """Check if Kaggle CLI is available"""
        try:
            result = subprocess.run(
                ["kaggle", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def _check_dataset_exists(self, dataset_name: str) -> bool:
        """Check if dataset files already exist"""
        dataset_info = self.DATASETS.get(dataset_name)
        if not dataset_info:
            return False
        
        for expected_file in dataset_info["expected_files"]:
            file_path = self.data_dir / expected_file
            if file_path.exists():
                return True
        
        return False
    
    async def fetch_dataset(self, dataset_name: str) -> Dict[str, any]:
        """
        Fetch a dataset from Kaggle
        
        Args:
            dataset_name: Name of dataset to fetch
            
        Returns:
            Dictionary with fetch status and results
        """
        if dataset_name not in self.DATASETS:
            return {
                "success": False,
                "error": f"Unknown dataset: {dataset_name}",
                "dataset": dataset_name
            }
        
        # Check if already exists
        if self._check_dataset_exists(dataset_name):
            return {
                "success": True,
                "skipped": True,
                "message": f"Dataset {dataset_name} already exists",
                "dataset": dataset_name
            }
        
        # Check if Kaggle CLI is available
        if not self.kaggle_available:
            return {
                "success": False,
                "error": "Kaggle CLI not available. Install with: pip install kaggle",
                "dataset": dataset_name,
                "manual_download": self._get_manual_download_url(dataset_name)
            }
        
        dataset_info = self.DATASETS[dataset_name]
        
        try:
            if dataset_info["type"] == "competition":
                # Competition datasets require different command
                cmd = [
                    "kaggle", "competitions", "download",
                    "-c", dataset_info["source"],
                    "-p", str(self.data_dir),
                    "--unzip"
                ]
            else:
                # Regular dataset
                cmd = [
                    "kaggle", "datasets", "download",
                    "-d", dataset_info["source"],
                    "-p", str(self.data_dir),
                    "--unzip"
                ]
            
            print(f"[DatasetFetcher] Fetching {dataset_name}...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                # Try alternative source if primary failed (for airbnb)
                if dataset_name == "airbnb_nyc" and "primary" in dataset_info:
                    # Already tried primary, try alternative if needed
                    pass
                
                return {
                    "success": True,
                    "message": f"Successfully fetched {dataset_name}",
                    "dataset": dataset_name,
                    "files": list(self.data_dir.glob("*.csv"))
                }
            else:
                # Try alternative for airbnb
                if dataset_name == "airbnb_nyc" and "alternative" in dataset_info:
                    print(f"[DatasetFetcher] Primary source failed, trying alternative...")
                    alt_cmd = [
                        "kaggle", "datasets", "download",
                        "-d", dataset_info["alternative"],
                        "-p", str(self.data_dir),
                        "--unzip"
                    ]
                    alt_result = subprocess.run(
                        alt_cmd,
                        capture_output=True,
                        text=True,
                        timeout=300
                    )
                    if alt_result.returncode == 0:
                        return {
                            "success": True,
                            "message": f"Successfully fetched {dataset_name} from alternative source",
                            "dataset": dataset_name
                        }
                
                return {
                    "success": False,
                    "error": result.stderr or "Unknown error",
                    "dataset": dataset_name,
                    "manual_download": self._get_manual_download_url(dataset_name)
                }
        
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Download timeout",
                "dataset": dataset_name
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "dataset": dataset_name
            }
    
    def _get_manual_download_url(self, dataset_name: str) -> Optional[str]:
        """Get manual download URL for a dataset"""
        dataset_info = self.DATASETS.get(dataset_name)
        if not dataset_info:
            return None
        
        if dataset_info["type"] == "competition":
            return f"https://www.kaggle.com/competitions/{dataset_info['source']}"
        else:
            source = dataset_info.get("source") or dataset_info.get("primary", "")
            return f"https://www.kaggle.com/datasets/{source}"
    
    async def fetch_all_missing_datasets(self) -> Dict[str, any]:
        """
        Fetch all missing datasets
        
        Returns:
            Dictionary with results for each dataset
        """
        results = {}
        
        for dataset_name in self.DATASETS.keys():
            if not self._check_dataset_exists(dataset_name):
                print(f"[DatasetFetcher] Fetching missing dataset: {dataset_name}")
                result = await self.fetch_dataset(dataset_name)
                results[dataset_name] = result
            else:
                results[dataset_name] = {
                    "success": True,
                    "skipped": True,
                    "message": "Already exists",
                    "dataset": dataset_name
                }
        
        return results
    
    def get_available_datasets(self) -> List[str]:
        """Get list of datasets that are available locally"""
        available = []
        for dataset_name in self.DATASETS.keys():
            if self._check_dataset_exists(dataset_name):
                available.append(dataset_name)
        return available
    
    def get_missing_datasets(self) -> List[str]:
        """Get list of datasets that are missing"""
        missing = []
        for dataset_name in self.DATASETS.keys():
            if not self._check_dataset_exists(dataset_name):
                missing.append(dataset_name)
        return missing

