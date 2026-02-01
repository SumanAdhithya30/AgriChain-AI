from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

# ===========================
# 1. YIELD MODEL
# ===========================
YIELD_MODEL_PATH = 'yield_model_real.pkl' # Assuming it's in the same dir or handled by relative path
# Note: For simplicity in this unified server, we will try to load from the ../yield_prediction folder 
# or expect them to be copied here. Let's fix paths.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YIELD_DIR = os.path.join(BASE_DIR, '../yield_prediction')
YIELD_MODEL_FILE = os.path.join(YIELD_DIR, 'yield_model_real.pkl')

if os.path.exists(YIELD_MODEL_FILE):
    yield_model = joblib.load(YIELD_MODEL_FILE)
    print(f"✅ Yield Model loaded from {YIELD_MODEL_FILE}")
else:
    print(f"❌ Yield Model not found at {YIELD_MODEL_FILE}")
    yield_model = None

# ===========================
# 2. PRICE MODEL
# ===========================
PRICE_MODEL_FILE = os.path.join(BASE_DIR, 'price_lstm.h5')
PRICE_SCALER_FILE = os.path.join(BASE_DIR, 'price_scaler.pkl')

if os.path.exists(PRICE_MODEL_FILE) and os.path.exists(PRICE_SCALER_FILE):
    price_model = load_model(PRICE_MODEL_FILE)
    price_scaler = joblib.load(PRICE_SCALER_FILE)
    print(f"✅ Price Model loaded from {PRICE_MODEL_FILE}")
else:
    print(f"❌ Price Model/Scaler not found")
    price_model = None
    price_scaler = None

# ===========================
# ROUTES
# ===========================

@app.route('/predict', methods=['POST'])
def predict_yield():
    if not yield_model: return jsonify({'error': 'Yield Model not loaded'}), 500
    try:
        data = request.get_json()
        input_df = pd.DataFrame([data])
        prediction = yield_model.predict(input_df)
        return jsonify({'predicted_yield': float(prediction[0])})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


# ===========================
# 3. FEATURE STORE (HISTORY)
# ===========================
HISTORY_FILE = os.path.join(BASE_DIR, 'synthetic_price_data.csv')
if os.path.exists(HISTORY_FILE):
    print(f"✅ Loading History Data from {HISTORY_FILE}...")
    history_df = pd.read_csv(HISTORY_FILE)
    history_df['Date'] = pd.to_datetime(history_df['Date'])
    print(f"   Note: Loaded {len(history_df)} records.")
else:
    print(f"❌ History Data not found at {HISTORY_FILE}")
    history_df = pd.DataFrame()

@app.route('/predict-price', methods=['POST'])
def predict_price():
    if not price_model or not price_scaler: return jsonify({'error': 'Price Model not loaded'}), 500
    try:
        data = request.get_json()
        
        # User inputs or defaults
        crop = data.get('Crop', 'Rice')
        state = data.get('State', 'Tamil Nadu')
        district = data.get('District', 'Madurai')
        
        # 1. Fetch Historical Data (Last 30 days)
        # We filter by location and crop
        mask = (history_df['State'] == state) & \
               (history_df['District'] == district) & \
               (history_df['Crop'] == crop)
        
        filtered_df = history_df[mask].sort_values('Date')
        
        if filtered_df.empty:
            # Fallback if no history found: Use the old mock strategy
            print(f"⚠️ No history for {crop} in {district}. Using mock data.")
            cpi = data.get('CPI', 150.0)
            fuel = data.get('Fuel_Price', 100.0)
            pred_yield = data.get('Predicted_Yield', 2.0)
            current_price = data.get('Current_Price', 2000.0)
            input_features = np.array([[pred_yield, cpi, fuel, current_price]] * 30)
        else:
            # Use actual last 30 records
            # Columns needed: Yield_Tonnes, CPI, Fuel_Price, Market_Price
            # Verify column names in CSV: Yield_Tonnes, CPI, Fuel_Price, Market_Price
            required_cols = ['Yield_Tonnes', 'CPI', 'Fuel_Price', 'Market_Price']
            
            recent_data = filtered_df.tail(30)[required_cols].values
            
            # If we have less than 30 days, we pad with the first available day
            if len(recent_data) < 30:
                print(f"⚠️ Insufficient history ({len(recent_data)} days). Padding data.")
                padding = np.tile(recent_data[0], (30 - len(recent_data), 1))
                input_features = np.vstack([padding, recent_data])
            else:
                input_features = recent_data
        
        # 2. Scale
        # Shape: (30, 4) -> Scaled -> Reshape to (1, 30, 4) for LSTM
        scaled_input = price_scaler.transform(input_features)
        final_input = scaled_input.reshape(1, 30, 4)
        
        # 3. Predict
        predicted_scaled_price = price_model.predict(final_input)
        
        # 4. Inverse Transform
        # Construct dummy row for scaler inverse
        dummy_row = np.zeros((1, 4))
        dummy_row[0, 3] = predicted_scaled_price[0, 0]
        
        inverse_prediction = price_scaler.inverse_transform(dummy_row)
        final_price = inverse_prediction[0, 3]
        
        return jsonify({
            'predicted_price': float(final_price),
            'currency': 'INR',
            'unit': 'Quintal',
            'based_on': f"30-day history for {crop} in {district}"
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("Starting Unified AI Server on Port 5001...")
    # Using 5001 to replace the old yield-only server
    app.run(debug=True, port=5001)
