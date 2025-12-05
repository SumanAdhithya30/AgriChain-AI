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

@app.route('/predict-price', methods=['POST'])
def predict_price():
    if not price_model or not price_scaler: return jsonify({'error': 'Price Model not loaded'}), 500
    try:
        data = request.get_json()
        # Inputs: Predicted_Yield (from yield model), CPI, Fuel_Price (mocked or user inputs)
        # We need a sequence of 30 days to predict. For this prototype, we will:
        # 1. Take current inputs
        # 2. Duplicate them 30 times to simulate a flat recent history (or you can pass history)
        # This is a simplification for the demo.
        
        # Default mock economic indicators if not provided
        cpi = data.get('CPI', 150.0)
        fuel = data.get('Fuel_Price', 100.0)
        pred_yield = data.get('Predicted_Yield', 2.0)
        current_price = data.get('Current_Price', 2000.0) # We need a starting point
        
        # Prepare input vector: [Yield, CPI, Fuel, Price]
        # Shape: (1, 30, 4)
        input_features = np.array([[pred_yield, cpi, fuel, current_price]] * 30)
        
        # Scale
        # Reshape to (30, 4) for scaling, then back to (1, 30, 4)
        scaled_input = price_scaler.transform(input_features)
        final_input = scaled_input.reshape(1, 30, 4)
        
        # Predict
        predicted_scaled_price = price_model.predict(final_input)
        
        # Inverse transform
        # We need to construct a dummy array aimed at inverse_transform shape
        # The scaler expects 4 columns. We only have the 4th column (Price) output.
        # Trick: Create a dummy row with 0s and the predicted price at the end
        dummy_row = np.zeros((1, 4))
        dummy_row[0, 3] = predicted_scaled_price[0, 0]
        
        inverse_prediction = price_scaler.inverse_transform(dummy_row)
        final_price = inverse_prediction[0, 3]
        
        return jsonify({
            'predicted_price': float(final_price),
            'currency': 'INR',
            'unit': 'Quintal'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("Starting Unified AI Server on Port 5001...")
    # Using 5001 to replace the old yield-only server
    app.run(debug=True, port=5001)
