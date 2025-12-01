"""Price Simulator - Simulates time series prices with mean-reverting behavior and promo dips"""
import random
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np


class PriceSimulator:
    """
    Simulates time series prices for flights with:
    - Mean-reverting price behavior
    - Random promo dips (-10% to -25%)
    - Seats_left scarcity factor
    """
    
    def __init__(self, base_price: float, volatility: float = 0.1):
        """
        Initialize price simulator
        
        Args:
            base_price: Base/mean price to revert to
            volatility: Price volatility (default 0.1 = 10%)
        """
        self.base_price = base_price
        self.volatility = volatility
        self.current_price = base_price
    
    def simulate_price(
        self,
        days_ahead: int = 30,
        promo_probability: float = 0.15,
        seats_left: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Simulate price over time with mean-reverting behavior and promo dips
        
        Args:
            days_ahead: Number of days to simulate
            promo_probability: Probability of promo dip (default 15%)
            seats_left: Available seats (affects scarcity pricing)
        
        Returns:
            Dictionary with simulated price data
        """
        prices = []
        dates = []
        promo_active = False
        promo_discount = 0.0
        
        for day in range(days_ahead):
            date = datetime.now() + timedelta(days=day)
            
            # Mean-reverting behavior: price tends to return to base_price
            # Use simple mean-reversion formula: price = base + (current - base) * decay
            decay_factor = 0.95  # 5% reversion per day
            mean_reversion = self.base_price + (self.current_price - self.base_price) * decay_factor
            
            # Random walk component
            random_change = random.gauss(0, self.base_price * self.volatility * 0.1)
            
            # Check for promo dip (-10% to -25%)
            if not promo_active and random.random() < promo_probability:
                promo_active = True
                promo_discount = random.uniform(0.10, 0.25)  # 10% to 25% discount
                promo_duration = random.randint(1, 3)  # 1-3 days
                promo_end_day = day + promo_duration
            
            # Apply promo discount if active
            if promo_active:
                promo_price = mean_reversion * (1 - promo_discount)
                price = promo_price + random_change
                if day >= promo_end_day:
                    promo_active = False
            else:
                price = mean_reversion + random_change
            
            # Scarcity factor: if seats_left < 10, increase price
            if seats_left is not None and seats_left < 10:
                scarcity_multiplier = 1.0 + (10 - seats_left) * 0.02  # 2% per seat below 10
                price = price * scarcity_multiplier
            
            # Ensure price doesn't go below 10% of base
            price = max(self.base_price * 0.1, price)
            
            prices.append(round(price, 2))
            dates.append(date.isoformat())
            self.current_price = price
        
        # Calculate 30-day average
        avg_30d_price = sum(prices) / len(prices) if prices else self.base_price
        
        # Current price (today's price)
        current_price = prices[0] if prices else self.base_price
        
        # Check if current price is ≥15% below 30-day average
        price_diff_pct = ((avg_30d_price - current_price) / avg_30d_price) * 100 if avg_30d_price > 0 else 0
        is_deal = price_diff_pct >= 15
        
        return {
            "base_price": self.base_price,
            "current_price": round(current_price, 2),
            "avg_30d_price": round(avg_30d_price, 2),
            "price_diff_pct": round(price_diff_pct, 2),
            "is_deal": is_deal,
            "seats_left": seats_left,
            "promo_active": promo_active,
            "promo_discount": round(promo_discount * 100, 1) if promo_active else 0,
            "price_history": list(zip(dates, prices))
        }
    
    @staticmethod
    def simulate_flight_price(
        base_price: float,
        origin: str,
        destination: str,
        airline: str,
        seats_left: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Simulate flight price with time series behavior
        
        Args:
            base_price: Base price from dataset
            origin: Origin airport
            destination: Destination airport
            airline: Airline name
            seats_left: Available seats
        
        Returns:
            Simulated price data with deal flags
        """
        simulator = PriceSimulator(base_price, volatility=0.12)
        result = simulator.simulate_price(
            days_ahead=30,
            promo_probability=0.15,  # 15% chance of promo
            seats_left=seats_left
        )
        
        # Add route information
        result["origin"] = origin
        result["destination"] = destination
        result["airline"] = airline
        
        return result

