#!/usr/bin/env python3
"""Setup Kaggle API credentials"""
import json
import os
from pathlib import Path

KAGGLE_DIR = Path.home() / ".kaggle"
KAGGLE_JSON = KAGGLE_DIR / "kaggle.json"

# Your provided API key
API_KEY = "KGAT_0f2ce53d8d4f5af7652cab3a11c77e9e"

def main():
    print("🔐 Kaggle API Credentials Setup")
    print("=" * 40)
    print()
    
    # Create directory
    KAGGLE_DIR.mkdir(exist_ok=True)
    
    # Check if already exists
    if KAGGLE_JSON.exists():
        print(f"⚠️  Credentials already exist at {KAGGLE_JSON}")
        response = input("Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Keeping existing credentials.")
            return
    
    # Get username
    print(f"API Key: {API_KEY[:10]}...")
    print()
    username = input("Enter your Kaggle username: ").strip()
    
    if not username:
        print("❌ Username is required!")
        return
    
    # Create credentials file
    credentials = {
        "username": username,
        "key": API_KEY
    }
    
    with open(KAGGLE_JSON, 'w') as f:
        json.dump(credentials, f)
    
    # Set permissions
    os.chmod(KAGGLE_JSON, 0o600)
    
    print()
    print(f"✅ Credentials saved to {KAGGLE_JSON}")
    print(f"   Username: {username}")
    print()
    
    # Test connection
    print("Testing connection...")
    import subprocess
    try:
        result = subprocess.run(
            ["kaggle", "datasets", "list", "--max-size", "1"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            print("✅ Connection successful!")
        else:
            print(f"⚠️  Connection test returned: {result.stderr[:100]}")
    except Exception as e:
        print(f"⚠️  Could not test connection: {e}")
    
    print()
    print("You can now run:")
    print("  python3 scripts/download_datasets.py")

if __name__ == "__main__":
    main()

