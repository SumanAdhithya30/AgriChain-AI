import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
import joblib
import os

# ==========================================
# CONFIGURATION
# ==========================================
# 1. Download the dataset from Kaggle: 
#    https://www.kaggle.com/datasets/srinivas1/agricuture-crops-production-in-india
#    (Or any similar dataset with columns: State, District, Crop, Season, Area, Production, Rainfall, etc.)
# 2. Rename it to 'real_crop_yield_data.csv' and place it in this folder.
DATASET_PATH = "real_crop_yield_data.csv"

def train_real_model():
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: Dataset '{DATASET_PATH}' not found!")
        print("Please download a real dataset (e.g., from Kaggle) and place it here.")
        return

    print(f"Loading dataset from {DATASET_PATH}...")
    df = pd.read_csv(DATASET_PATH)

    # ==========================================
    # DATA CLEANING & MAPPING
    # ==========================================
    # NOTE: You might need to change these column names to match your specific CSV file
    # Common column names in Kaggle datasets: 
    # 'State_Name', 'District_Name', 'Crop_Year', 'Season', 'Crop', 'Area', 'Production'
    
    # Let's try to standardize column names
    df.columns = [c.strip() for c in df.columns] # Remove spaces
    
    # Map your CSV columns to these standard names if they differ
    # Example mapping based on common datasets:
    column_mapping = {
        'State_Name': 'State',
        'District_Name': 'District',
        'Crop_Year': 'Year',
        'Season': 'Season',
        'Crop': 'Crop',
        'Area': 'Area',
        'Production': 'Production'
        # Add 'Rainfall': 'Rainfall_mm' if your dataset has it
    }
    df.rename(columns=column_mapping, inplace=True)

    # Calculate Yield if not present (Yield = Production / Area)
    if 'Yield_Tonnes' not in df.columns:
        if 'Production' in df.columns and 'Area' in df.columns:
            # Drop rows where Area is 0 to avoid division by zero
            df = df[df['Area'] > 0]
            df['Yield_Tonnes'] = df['Production'] / df['Area']
        else:
            print("❌ Error: Dataset must have 'Production' and 'Area' columns to calculate Yield.")
            return

    # Filter out unrealistic outliers (optional, but good for real data)
    df = df[df['Yield_Tonnes'] < 50] # Assumption: Yield > 50 tonnes/acre is likely an error for most crops

    # ==========================================
    # FEATURE SELECTION
    # ==========================================
    # We will use these features to predict Yield
    # Note: If your dataset doesn't have Rainfall/Temp, we might need to drop them 
    # or merge with a weather dataset. For now, we'll use what's available.
    
    features = ['State', 'District', 'Crop', 'Season', 'Area']
    target = 'Yield_Tonnes'

    # Check if we have weather data (some datasets merge it)
    if 'Rainfall' in df.columns:
        features.append('Rainfall')
    if 'Temperature' in df.columns:
        features.append('Temperature')

    # Keep only relevant columns
    df = df[features + [target]].dropna()

    # Print Year Range if available
    if 'Year' in df.columns:
        min_year = df['Year'].min()
        max_year = df['Year'].max()
        print(f"📅 Dataset covers years: {min_year} to {max_year}")
    
    print(f"Training on {len(df)} rows with features: {features}")

    X = df[features]
    y = df[target]

    # ==========================================
    # PREPROCESSING
    # ==========================================
    # Identify categorical and numerical columns
    categorical_features = [col for col in features if df[col].dtype == 'object']
    numerical_features = [col for col in features if df[col].dtype != 'object']

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', SimpleImputer(strategy='median'), numerical_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])

    # ==========================================
    # MODEL PIPELINE
    # ==========================================
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', xgb.XGBRegressor(
            objective='reg:squarederror',
            n_estimators=200,
            learning_rate=0.05,
            max_depth=7,
            n_jobs=-1
        ))
    ])

    # ==========================================
    # TRAINING
    # ==========================================
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training XGBoost model (this might take a while for large datasets)...")
    model.fit(X_train, y_train)

    # ==========================================
    # EVALUATION
    # ==========================================
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"✅ Model Trained Successfully!")
    print(f"Mean Squared Error: {mse:.4f}")
    print(f"R2 Score (Accuracy): {r2:.4f}")

    # ==========================================
    # SAVE
    # ==========================================
    joblib.dump(model, 'yield_model_real.pkl')
    print("💾 Model saved to 'yield_model_real.pkl'")

if __name__ == "__main__":
    train_real_model()
