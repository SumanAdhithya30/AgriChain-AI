import joblib
import pandas as pd

# 1. Load the saved pipeline
model = joblib.load('yield_model_real.pkl')

# 2. Create a "Fake" User Input (simulating a farmer's request)
# Example: A farmer in Madurai planting Rice on Clay soil
user_input = pd.DataFrame({
    'District': ['Madurai'],
    'Crop': ['Rice'],
    'Soil_Type': ['Clay'],
    'Rainfall_mm': [850.0],     # Values pulled from weather API
    'Temperature_C': [30.0],    # Values pulled from weather API
    'Fertilizer_kg': [150.0]    # User input
})

# 3. Predict
predicted_yield = model.predict(user_input)

print(f"🔮 Predicted Yield: {predicted_yield[0]:.2f} Tonnes/Acre")