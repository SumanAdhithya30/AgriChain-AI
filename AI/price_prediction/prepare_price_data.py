import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# CONFIGURATION
NUM_DAYS = 365 * 3  # 3 Years of daily data
OUTPUT_FILE = "synthetic_price_data.csv"

# STATES & DISTRICTS (Subset for training)
LOCATIONS = {
    "Tamil Nadu": ["Madurai", "Thanjavur", "Salem"],
    "Punjab": ["Ludhiana", "Patiala"],
    "Maharashtra": ["Nashik", "Pune"]
}

CROPS = ["Rice", "Wheat", "Tomato", "Onion"]

def generate_trend(days, volatility=0.2):
    """Generates a random walk trend."""
    trend = [1000] # Starting base index
    for _ in range(days):
        change = trend[-1] * random.uniform(-volatility, volatility)
        trend.append(trend[-1] + change)
    return trend

def generate_data():
    data = []
    
    # Generate base economic trends
    fuel_prices = generate_trend(NUM_DAYS, 0.01) # Low volatility
    inflation_index = generate_trend(NUM_DAYS, 0.005) # Very low volatility

    start_date = datetime.now() - timedelta(days=NUM_DAYS)

    for state, districts in LOCATIONS.items():
        for district in districts:
            for crop in CROPS:
                
                # CROP SPECIFIC BASE PRICE
                base_price = 1500 # Default
                if crop == "Rice": base_price = 2000
                elif crop == "Wheat": base_price = 2200
                elif crop == "Tomato": base_price = 1500 # Highly volatile
                elif crop == "Onion": base_price = 1800 # Highly volatile

                current_price = base_price

                for day, (fuel, inf) in enumerate(zip(fuel_prices, inflation_index)):
                    date = start_date + timedelta(days=day)
                    
                    # 1. Seasonality Effect
                    month = date.month
                    season_factor = 1.0
                    
                    # Prices drop during harvest, rise during lean season
                    if crop == "Rice" and month in [11, 12, 1]: season_factor = 0.8 # Harvest (Pongal)
                    elif crop == "Rice" and month in [6, 7]: season_factor = 1.2 # Lean
                    
                    elif crop == "Tomato" and month in [5, 6]: season_factor = 1.5 # Summer peak
                    
                    # 2. Economic Impact
                    # Higher fuel = Higher transport cost = Higher market price
                    fuel_impact = (fuel - 1000) * 0.5 
                    
                    # 3. Supply Shock (Random)
                    shock = 0
                    if random.random() < 0.01: # 1% chance of shock (flood/drought)
                        shock = random.uniform(200, 500)

                    # Calculate Final Price
                    # Price = Base * Season + Fuel + Shock + Random Noise
                    price_val = (current_price * season_factor) + fuel_impact + shock + random.uniform(-50, 50)
                    
                    # Price cannot be negative
                    final_price = max(500, round(price_val, 2))
                    
                    # Simulate Supply (Yield) - Inversely proportional to price roughly
                    # High supply -> Low price
                    est_yield = max(0.5, 4.0 - (final_price / 2000)) + random.uniform(-0.5, 0.5)
                    est_yield = round(max(0.1, est_yield), 2)

                    data.append([
                        date.strftime("%Y-%m-%d"),
                        state,
                        district,
                        crop,
                        est_yield,  # Historical Supply (Tonnes/Acre)
                        round(inf, 2), # CPI
                        round(fuel, 2), # Fuel Price
                        final_price # TARGET VARIABLE
                    ])

    # Convert to DataFrame
    columns = ['Date', 'State', 'District', 'Crop', 'Yield_Tonnes', 'CPI', 'Fuel_Price', 'Market_Price']
    df = pd.DataFrame(data, columns=columns)
    
    # Save
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"✅ Generated {len(df)} rows of synthetic price data in '{OUTPUT_FILE}'")
    print(df.head())

if __name__ == "__main__":
    generate_data()
