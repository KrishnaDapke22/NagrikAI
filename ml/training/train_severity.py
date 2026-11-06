import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

def train_severity_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "complaints_dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Loaded {len(df)} records for Severity model training.")
    print("Severity distribution:\n", df["severity"].value_counts())

    # Load trained category tfidf to convert text into embeddings/features
    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    tfidf = joblib.load(os.path.join(models_dir, "category_tfidf.joblib"))

    X_text = tfidf.transform(df["text"].astype(str)).toarray()
    
    # Feature engineering
    safety = df["safety_hazard"].values.reshape(-1, 1)
    people = np.log1p(df["people_affected"].values).reshape(-1, 1)
    
    # Combine text features + tabular features
    X = np.hstack([X_text, safety, people])
    y = df["severity"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf_sev = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf_sev.fit(X_train, y_train)

    y_pred = clf_sev.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=False)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("SEVERITY CLASSIFIER EVALUATION RESULTS")
    print("="*50)
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:\n", report)
    print("Confusion Matrix:\n", cm)

    joblib.dump(clf_sev, os.path.join(models_dir, "severity_model.joblib"))

    metrics = {
        "model": "Random Forest Classifier",
        "accuracy": round(float(acc), 4),
        "classes": list(clf_sev.classes_),
        "test_samples": len(y_test)
    }
    joblib.dump(metrics, os.path.join(models_dir, "severity_metrics.joblib"))
    print(f"\nSaved severity model to {models_dir}/")

if __name__ == "__main__":
    train_severity_model()
