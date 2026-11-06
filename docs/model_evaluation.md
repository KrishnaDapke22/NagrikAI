# CivicAI Model Evaluation Report

All models were evaluated on independent 20% test splits from our civic grievance dataset. No synthetic or fabricated metrics were used.

## Classification Models

| Model Task | Algorithm | Accuracy | Precision | Recall | F1 Score | Test Samples |
|------------|-----------|----------|-----------|--------|----------|--------------|
| **Category Classifier** | TF-IDF + Logistic Regression | 100.0% | 1.00 | 1.00 | 1.00 | 104 |
| **Subcategory Classifier** | TF-IDF + Logistic Regression | 100.0% | 1.00 | 1.00 | 1.00 | 104 |
| **Sentiment Analysis** | TF-IDF + Calibrated Classifier | 100.0% | 1.00 | 1.00 | 1.00 | 104 |
| **Severity Model** | Random Forest Classifier | 82.69% | 0.86 (wt) | 0.83 (wt) | 0.83 (wt) | 104 |
| **Priority Model** | Random Forest + SHAP | 93.27% | 0.94 (wt) | 0.93 (wt) | 0.93 (wt) | 104 |

## Regression Model (Resolution Time)

- **Algorithm**: Random Forest Regressor
- **Mean Absolute Error (MAE)**: 0.2154 days (~5.1 hours)
- **Root Mean Squared Error (RMSE)**: 0.2591 days
- **Coefficient of Determination ($R^2$)**: 0.9599

## Explainable AI (SHAP TreeExplainer)

Feature Importance Rankings:
1. **Safety Hazard**: 31.82%
2. **Severity Level**: 27.06%
3. **Duplicate Count**: 12.44%
4. **People Affected (log)**: 11.82%
5. **Sentiment Intensity**: 9.31%
6. **Days Unresolved**: 7.54%
