import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import shap

def train_priority_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "complaints_dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Loaded {len(df)} records for Priority model training.")
    print("Priority distribution:\n", df["priority"].value_counts())

    # Map categorical features to numeric scales
    severity_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    sentiment_map = {"Positive": 1, "Neutral": 0, "Concerned": -1, "Negative": -2, "Angry": -3}
    
    # Feature engineering matrix
    feat_names = [
        "severity_level",
        "sentiment_intensity",
        "safety_hazard",
        "duplicate_count",
        "days_unresolved",
        "people_affected_log"
    ]

    X = np.column_stack([
        df["severity"].map(severity_map).fillna(2).values,
        df["sentiment"].map(sentiment_map).fillna(-1).values,
        df["safety_hazard"].values,
        df["duplicate_count"].values,
        df["days_unresolved"].values,
        np.log1p(df["people_affected"].values)
    ])
    y = df["priority"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf_pri = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf_pri.fit(X_train, y_train)

    y_pred = clf_pri.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=False)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("PRIORITY CLASSIFIER EVALUATION RESULTS")
    print("="*50)
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:\n", report)
    print("Confusion Matrix:\n", cm)

    # Feature importances
    importances = dict(zip(feat_names, clf_pri.feature_importances_))
    print("\nFeature Importances:\n", importances)

    # Fit TreeExplainer
    explainer = shap.TreeExplainer(clf_pri)

    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(clf_pri, os.path.join(models_dir, "priority_model.joblib"))
    joblib.dump(feat_names, os.path.join(models_dir, "priority_feature_names.joblib"))
    joblib.dump(explainer, os.path.join(models_dir, "priority_explainer.joblib"))

    metrics = {
        "model": "Random Forest + SHAP TreeExplainer",
        "accuracy": round(float(acc), 4),
        "classes": list(clf_pri.classes_),
        "feature_importances": {k: round(float(v), 4) for k, v in importances.items()},
        "test_samples": len(y_test)
    }
    joblib.dump(metrics, os.path.join(models_dir, "priority_metrics.joblib"))
    print(f"\nSaved priority model & SHAP explainer to {models_dir}/")

if __name__ == "__main__":
    train_priority_model()
