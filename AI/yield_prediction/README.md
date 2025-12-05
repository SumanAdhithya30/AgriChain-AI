# Yield Prediction Engine (Real Data)

This engine uses XGBoost to predict crop yields based on historical data from the Government of India (1997-2021).

## Setup

1. **Install dependencies**:
   ```bash
   pip install flask flask-cors pandas scikit-learn xgboost
   ```

2. **Prepare the Data**:
   - Download the **"India Agriculture Crop Production"** dataset from Kaggle: [Link](https://www.kaggle.com/datasets/thedevastator/india-agriculture-crop-production)
   - Rename the CSV file to `real_crop_yield_data.csv`.
   - Place it in this folder (`AI/yield_prediction/`).

3. **Train the Model**:
   ```bash
   python train_real_model.py
   ```
   This will process the data and save the model as `yield_model_real.pkl`.

4. **Run the Server**:
   ```bash
   python server.py
   ```
   The server runs on `http://localhost:5001`.

## API

### POST /predict

Request body:
```json
{
    "District": "Madurai",
    "Crop": "Rice",
    "Season": "Kharif", 
    "Area": 1000.0,
    "Rainfall": 850.0,
    "Temperature": 30.0
}
```
*(Note: Inputs depend on the columns available in your specific dataset. The `train_real_model.py` script automatically selects relevant features.)*

Response:
```json
{
    "predicted_yield": 3.5
}
```
