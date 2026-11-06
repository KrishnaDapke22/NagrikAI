import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_resolution_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "complaints_dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Loaded {len(df)} records for Resolution-Time regression training.")

    cat_map = {
        "Electricity": 1, "Water": 2, "Roads": 3, "Sanitation": 4,
        "Drainage": 5, "Traffic": 6, "Public Safety": 7, "General Administration": 8
    }
    sev_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    pri_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

    X = np.column_stack([
        df["category"].map(cat_map).fillna(8).values,
        df["severity"].map(sev_map).fillna(2).values,
        df["priority"].map(pri_map).fillna(2).values,
        df["days_unresolved"].values,
        df["safety_hazard"].values,
        np.log1p(df["people_affected"].values)
    ])
    y = df["actual_resolution_days"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    reg = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    reg.fit(X_train, y_train)

    y_pred = reg.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("\n" + "="*50)
    print("RESOLUTION TIME REGRESSOR EVALUATION RESULTS")
    print("="*50)
    print(f"Mean Absolute Error (MAE): {mae:.4f} days")
    print(f"Root Mean Squared Error (RMSE): {rmse:.4f} days")
    print(f"R-squared Score (R²): {r2:.4f}")

    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(reg, os.path.join(models_dir, "resolution_model.joblib"))

    metrics = {
        "model": "Random Forest Regressor",
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2_score": round(float(r2), 4),
        "test_samples": len(y_test)
    }
    joblib.dump(metrics, os.path.join(models_dir, "resolution_metrics.joblib"))
    print(f"\nSaved resolution time model to {models_dir}/")

if __name__ == "__main__":
    train_resolution_model()
