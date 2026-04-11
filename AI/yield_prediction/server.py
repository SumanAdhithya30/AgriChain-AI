from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
MODEL_PATH = 'yield_model_real.pkl'

if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print(f"✅ Loaded REAL model from {MODEL_PATH}")
else:
    print(f"❌ Error: Model '{MODEL_PATH}' not found!")
    print("Please run 'python train_real_model.py' to train the model first.")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.get_json()
        
        # Expected keys: District, Crop, Soil_Type, Rainfall_mm, Temperature_C, Fertilizer_kg
        
        # Create a DataFrame from the input
        input_df = pd.DataFrame([data])
        
        # Predict
        prediction = model.predict(input_df)
        
        return jsonify({
            'predicted_yield': float(prediction[0])
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print("Starting Flask server on port 5002...", flush=True)
    print("NOTE: Use price_prediction/server.py (port 5001) for the unified server.", flush=True)
    app.run(debug=True, port=5002)
