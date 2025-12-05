import requests
import json

base_url = 'http://localhost:5001'

# Test Yield Prediction (expecting /predict to work now)
yield_data = {
    "State": "Tamil Nadu",
    "District": "Madurai",
    "Crop": "Rice",
    "Season": "Kharif",
    "Area": 10.0,
    "Rainfall": 1000.0
}

print("Testing /predict (Yield)...")
try:
    response = requests.post(f"{base_url}/predict", json=yield_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Yield Test Failed: {e}")

# Test Price Prediction
price_data = {
    "Predicted_Yield": 3.5,
    "CPI": 155.0,
    "Fuel_Price": 98.0,
    "Current_Price": 1800.0
}

print("\nTesting /predict-price (Price)...")
try:
    response = requests.post(f"{base_url}/predict-price", json=price_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Price Test Failed: {e}")
