from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YIELD_MODEL_FILE  = os.path.join(BASE_DIR, 'yield_prediction', 'yield_model_real.pkl')
PRICE_MODEL_FILE  = os.path.join(BASE_DIR, 'price_prediction', 'price_lstm.h5')
PRICE_SCALER_FILE = os.path.join(BASE_DIR, 'price_prediction', 'price_scaler.pkl')
HISTORY_FILE      = os.path.join(BASE_DIR, 'price_prediction', 'synthetic_price_data.csv')

# ── Yield model ──────────────────────────────────────────────────────────────
if os.path.exists(YIELD_MODEL_FILE):
    yield_model = joblib.load(YIELD_MODEL_FILE)
    print(f"✅ Yield model loaded")
else:
    yield_model = None
    print(f"❌ Yield model not found at {YIELD_MODEL_FILE}")

# ── Price model ───────────────────────────────────────────────────────────────
if os.path.exists(PRICE_MODEL_FILE) and os.path.exists(PRICE_SCALER_FILE):
    price_model  = load_model(PRICE_MODEL_FILE)
    price_scaler = joblib.load(PRICE_SCALER_FILE)
    print(f"✅ Price model loaded")
else:
    price_model = price_scaler = None
    print(f"❌ Price model not found at {PRICE_MODEL_FILE}")

# ── Historical price data ─────────────────────────────────────────────────────
if os.path.exists(HISTORY_FILE):
    history_df = pd.read_csv(HISTORY_FILE)
    history_df['Date'] = pd.to_datetime(history_df['Date'])
    print(f"✅ Price history loaded ({len(history_df)} records)")
else:
    history_df = pd.DataFrame()
    print(f"❌ Price history not found at {HISTORY_FILE}")


@app.route('/predict', methods=['POST'])
def predict_yield():
    if not yield_model:
        return jsonify({'error': 'Yield model not loaded'}), 500
    try:
        data = request.get_json()
        prediction = yield_model.predict(pd.DataFrame([data]))
        return jsonify({'predicted_yield': float(prediction[0])})
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/predict-price', methods=['POST'])
def predict_price():
    if not price_model or not price_scaler:
        return jsonify({'error': 'Price model not loaded'}), 500
    try:
        data   = request.get_json()
        crop   = data.get('Crop', 'Rice')
        state  = data.get('State', 'Tamil Nadu')
        district = data.get('District', 'Madurai')

        mask = (
            (history_df['State']    == state) &
            (history_df['District'] == district) &
            (history_df['Crop']     == crop)
        )
        filtered = history_df[mask].sort_values('Date')

        if filtered.empty:
            cpi   = data.get('CPI', 150.0)
            fuel  = data.get('Fuel_Price', 100.0)
            py    = data.get('Predicted_Yield', 2.0)
            price = data.get('Current_Price', 2000.0)
            input_features = np.array([[py, cpi, fuel, price]] * 30)
        else:
            cols = ['Yield_Tonnes', 'CPI', 'Fuel_Price', 'Market_Price']
            recent = filtered.tail(30)[cols].values
            if len(recent) < 30:
                padding = np.tile(recent[0], (30 - len(recent), 1))
                input_features = np.vstack([padding, recent])
            else:
                input_features = recent

        scaled = price_scaler.transform(input_features).reshape(1, 30, 4)
        pred_scaled = price_model.predict(scaled)

        dummy = np.zeros((1, 4))
        dummy[0, 3] = pred_scaled[0, 0]
        final_price = price_scaler.inverse_transform(dummy)[0, 3]

        return jsonify({
            'predicted_price': float(final_price),
            'currency': 'INR',
            'unit': 'Quintal',
            'based_on': f"30-day history for {crop} in {district}"
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    print("\n🌾 AgriChain AI Server")
    print("   Yield prediction  →  POST /predict")
    print("   Price prediction  →  POST /predict-price")
    print("   Running on        →  http://localhost:5001\n")
    app.run(debug=True, port=5001)
