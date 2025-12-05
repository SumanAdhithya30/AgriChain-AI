import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# CONFIGURATION
DATA_FILE = "synthetic_price_data.csv"
MODEL_FILE = "price_model.pkl" # We will save scaler + model path meta here
KERAS_MODEL_FILE = "price_lstm.h5"
LOOK_BACK = 30 # Number of past days to consider for prediction

def create_sequences(dataset, look_back=30):
    X, y = [], []
    for i in range(len(dataset) - look_back):
        X.append(dataset[i:(i + look_back), :])
        y.append(dataset[i + look_back, -1]) # Target is the last column (Price)
    return np.array(X), np.array(y)

def train_price_model():
    if not os.path.exists(DATA_FILE):
        print("❌ Data file not found! Run prepare_price_data.py first.")
        return

    print("LOADING Data...")
    df = pd.read_csv(DATA_FILE)
    
    # We will train a separate model per Crop (simplification for prototype)
    # OR input Crop as a feature. To keep LSTM simple, let's train a GENERAL model 
    # that takes numeric features: Yield, CPI, Fuel, Price
    
    # Sort by date
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')

    # Features: Yield, CPI, Fuel, Market_Price (Past prices help predict future)
    feature_cols = ['Yield_Tonnes', 'CPI', 'Fuel_Price', 'Market_Price']
    dataset = df[feature_cols].values
    dataset = dataset.astype('float32')

    # Normalize Data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(dataset)

    print(f"Creating sequences (Lookback: {LOOK_BACK} days)...")
    X, y = create_sequences(scaled_data, LOOK_BACK)

    # Split Train/Test
    train_size = int(len(X) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]

    # Reshape input to be [samples, time steps, features]
    # already done by create_sequences

    print(f"Training Data Shape: {X_train.shape}")

    # Build LSTM Model
    model = Sequential()
    model.add(LSTM(50, return_sequences=True, input_shape=(LOOK_BACK, len(feature_cols))))
    model.add(Dropout(0.2))
    model.add(LSTM(50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(25))
    model.add(Dense(1)) # Output: Predicted Price (Scaled)

    model.compile(optimizer='adam', loss='mean_squared_error')

    print("Training Model...")
    model.fit(X_train, y_train, batch_size=32, epochs=5, validation_data=(X_test, y_test))

    print("✅ Model Trained!")

    # Save components
    model.save(KERAS_MODEL_FILE)
    
    # Save Scaler using joblib
    joblib.dump(scaler, "price_scaler.pkl")
    print(f"💾 Model saved to {KERAS_MODEL_FILE} & Scaler to price_scaler.pkl")

if __name__ == "__main__":
    train_price_model()
