# CivicAI System Architecture

CivicAI is an enterprise-grade, AI-driven public grievance analysis, routing, and resolution recommendation system built to transform civic administration.

## Architectural High-Level Diagram

```
[ Citizens / Web UI ] <---> [ Vite + React 18 + TS + Tailwind ]
                                         |
                                (REST / JSON / JWT)
                                         |
                               [ FastAPI Core API ]
                                   /    |     \
                +-----------------+     |      +-----------------+
                |                       |                        |
       [ Role Authorization ]    [ Postgres / SQLite ]    [ Audit Logger ]
                |                       |                        |
                +-----------------------+------------------------+
                                         |
                            [ AI / ML Pipeline Engine ]
    +------------------------------------+------------------------------------+
    | Language Detection (Unicode/NER)   | Subcategory Classifier             |
    | Category Classifier (TF-IDF + LR)  | Sentiment Analysis (N-Gram TF-IDF) |
    | Severity Predictor (Random Forest) | Semantic Similarity (Dense Embed)  |
    | Priority Model (Tree Ensemble)     | Resolution Time Regressor (RF)     |
    | Explainable AI (SHAP TreeExplainer)| Generative AI Decision Playbooks   |
    +------------------------------------+------------------------------------+
```

## Layer Descriptions

1. **Presentation Layer**:
   - Built with React 18, Vite, TypeScript, and Tailwind CSS.
   - Separate, role-guarded portals for Citizens, Field Officers, and Municipal Administrators.
   - Interactive spatial visualization with Leaflet and analytical reporting via Recharts.

2. **Application & Service Layer**:
   - High-throughput asynchronous FastAPI backend.
   - JSON Web Token (JWT) bearer authentication with bcrypt salted password encryption.
   - Role-based access control (RBAC) separating Citizen, Officer, and Admin privileges.
   - Transactional database interaction via SQLAlchemy 2.0 ORM.

3. **Machine Learning & NLP Intelligence Layer**:
   - Fully decoupled training and inference pipeline using scikit-learn, XGBoost, and SHAP.
   - No black-box monolithic wrappers: structured ML handles classification, regression, and clustering, while Generative AI synthesizes context-aware Standard Operating Procedures (SOPs).
