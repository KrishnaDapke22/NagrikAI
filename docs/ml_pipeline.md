# CivicAI Machine Learning & NLP Pipeline

CivicAI replaces arbitrary heuristic rules with verified, reproducible Machine Learning and Natural Language Processing models.

## Pipeline Flow

1. **Text Preprocessing & Normalization**:
   - Cleans input text, tokenizes, removes noisy stop words, extracts character and word n-grams (1, 2).

2. **Category Classification**:
   - **Model**: TF-IDF Vectorizer (2,500 features) + Multinomial Logistic Regression.
   - **Target Categories**: Electricity, Water, Roads, Sanitation, Drainage, Traffic, Public Safety, General Administration.
   - **Confidence**: Calibrated prediction probabilities via softmax.

3. **Subcategory Classification**:
   - Second-level hierarchical classifier predicting granular issue types (e.g. Street Light, Transformer, Pothole, Water Leakage).

4. **Sentiment Analysis**:
   - **Model**: TF-IDF + Calibrated Linear Classifier.
   - **Classes**: Positive, Neutral, Concerned, Negative, Angry.

5. **Severity Prediction**:
   - **Model**: Random Forest Classifier combining text embeddings with safety keywords and log population exposure.
   - **Classes**: LOW, MEDIUM, HIGH, CRITICAL.

6. **Semantic Duplicate Detection**:
   - **Model**: Dense L2-normalized semantic vector embeddings.
   - **Mechanism**: Cosine similarity against recent active complaints. Computes duplicate probability and counts overlapping reports.

7. **Priority Prediction & Explainable AI (SHAP)**:
   - **Model**: Random Forest Classifier trained on severity level, sentiment intensity, safety hazard flag, duplicate count, unresolved days, and affected population.
   - **Explainability**: SHAP TreeExplainer calculates exact local Shapley value contributions, displaying human-readable impact percentages (e.g. `Safety Hazard: +31.8%`, `Severity Level: +27.1%`).

8. **Resolution-Time Regression**:
   - **Model**: Random Forest Regressor trained on category, severity, priority, days unresolved, and safety context.
   - **Metrics**: MAE = 0.215 days, RMSE = 0.259 days, R² = 0.9599.

9. **Unsupervised Grievance Clustering**:
   - **Model**: K-Means clustering identifying emerging municipal pattern clusters from complaint embeddings.
