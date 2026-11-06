import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

def train_sentiment_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "complaints_dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Loaded {len(df)} records for Sentiment training.")
    print("Sentiment distribution:\n", df["sentiment"].value_counts())

    X = df["text"].astype(str)
    y = df["sentiment"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    tfidf = TfidfVectorizer(max_features=2500, ngram_range=(1, 2), stop_words="english")
    X_train_vec = tfidf.fit_transform(X_train)
    X_test_vec = tfidf.transform(X_test)

    clf_sent = LogisticRegression(max_iter=1000, C=2.0, random_state=42)
    clf_sent.fit(X_train_vec, y_train)

    y_pred = clf_sent.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=False)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("SENTIMENT CLASSIFIER EVALUATION RESULTS")
    print("="*50)
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:\n", report)
    print("Confusion Matrix:\n", cm)

    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(tfidf, os.path.join(models_dir, "sentiment_tfidf.joblib"))
    joblib.dump(clf_sent, os.path.join(models_dir, "sentiment_classifier.joblib"))

    metrics = {
        "model": "TF-IDF + Logistic Regression",
        "accuracy": round(float(acc), 4),
        "classes": list(clf_sent.classes_),
        "test_samples": len(y_test)
    }
    joblib.dump(metrics, os.path.join(models_dir, "sentiment_metrics.joblib"))
    print(f"\nSaved sentiment models to {models_dir}/")

if __name__ == "__main__":
    train_sentiment_model()
