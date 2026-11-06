import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

def train_category_models():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "data", "complaints_dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Loaded {len(df)} records for Category & Subcategory training.")
    print("Class distribution:\n", df["category"].value_counts())

    # Text Preprocessing & TF-IDF
    X = df["text"].astype(str)
    y_cat = df["category"]
    y_subcat = df["subcategory"]

    X_train, X_test, y_train, y_test, sub_train, sub_test = train_test_split(
        X, y_cat, y_subcat, test_size=0.2, random_state=42, stratify=y_cat
    )

    tfidf = TfidfVectorizer(max_features=2500, ngram_range=(1, 2), stop_words="english")
    X_train_vec = tfidf.fit_transform(X_train)
    X_test_vec = tfidf.transform(X_test)

    # Category Classifier
    clf_cat = LogisticRegression(max_iter=1000, C=2.0, random_state=42)
    clf_cat.fit(X_train_vec, y_train)

    y_pred = clf_cat.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=False)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "="*50)
    print("CATEGORY CLASSIFIER EVALUATION RESULTS")
    print("="*50)
    print(f"Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:\n", report)
    print("Confusion Matrix:\n", cm)

    # Subcategory Classifier (conditioned on text)
    clf_sub = LogisticRegression(max_iter=1000, C=2.0, random_state=42)
    clf_sub.fit(X_train_vec, sub_train)
    sub_pred = clf_sub.predict(X_test_vec)
    sub_acc = accuracy_score(sub_test, sub_pred)
    print(f"\nSubcategory Accuracy: {sub_acc:.4f} ({sub_acc*100:.2f}%)")

    # Save models
    models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(tfidf, os.path.join(models_dir, "category_tfidf.joblib"))
    joblib.dump(clf_cat, os.path.join(models_dir, "category_classifier.joblib"))
    joblib.dump(clf_sub, os.path.join(models_dir, "subcategory_classifier.joblib"))

    # Also save evaluation metrics to a json file for the admin metrics dashboard
    metrics = {
        "model": "TF-IDF + Logistic Regression",
        "category_accuracy": round(float(acc), 4),
        "subcategory_accuracy": round(float(sub_acc), 4),
        "classes": list(clf_cat.classes_),
        "test_samples": len(y_test)
    }
    joblib.dump(metrics, os.path.join(models_dir, "category_metrics.joblib"))

    print(f"\nSuccessfully saved category models to {models_dir}/")

if __name__ == "__main__":
    train_category_models()
