# CivicAI Database Schema & Relational Design

CivicAI utilizes SQLAlchemy 2.0 ORM with dialect support for both PostgreSQL and SQLite.

## Entity Relationship Summary

- **`users`**:
  - `id`: Integer Primary Key
  - `name`: String(150)
  - `email`: String(255) Unique Indexed
  - `password_hash`: String(255)
  - `role`: Enum (`CITIZEN`, `OFFICER`, `ADMIN`)
  - `department_id`: Foreign Key (`departments.id`, Nullable)
  - `created_at`, `updated_at`: Timestamps

- **`departments`**:
  - `id`: Integer Primary Key
  - `name`: String(100) Unique
  - `description`: Text
  - `contact`: String(100)
  - `created_at`: Timestamp

- **`complaints`**:
  - `id`: Integer Primary Key
  - `citizen_id`: Foreign Key (`users.id`)
  - `title`: String(255)
  - `description`: Text
  - `category`: String(100) Indexed
  - `subcategory`: String(100)
  - `language`: String(50)
  - `sentiment`: String(50)
  - `severity`: String(50) (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `priority`: String(50) (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - `status`: String(50) (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `REOPENED`)
  - `department_id`: Foreign Key (`departments.id`)
  - `location_text`: String(255)
  - `latitude`, `longitude`: Float (Geocoded GPS)
  - `image_url`: String(500)
  - `duplicate_count`: Integer
  - `predicted_resolution_days`: Float (Regression output)
  - `created_at`, `updated_at`, `resolved_at`: Timestamps

- **`ai_analyses`**:
  - `id`: Integer Primary Key
  - `complaint_id`: Foreign Key (`complaints.id`) Unique
  - `category_confidence`, `subcategory_confidence`: Float
  - `sentiment_confidence`, `severity_confidence`: Float
  - `priority_confidence`, `duplicate_probability`: Float
  - `location_confidence`: Float
  - `model_version`: String(100)
  - `explanation_json`: Text (SHAP feature attribution weights)
  - `recommendation_json`: Text (Action steps, checklist, root causes, citizen response)

- **`similar_complaints`**:
  - `id`: Integer Primary Key
  - `complaint_id`: Foreign Key (`complaints.id`)
  - `similar_complaint_id`: Foreign Key (`complaints.id`)
  - `similarity_score`: Float

- **`resolutions`**:
  - `id`: Integer Primary Key
  - `complaint_id`: Foreign Key (`complaints.id`)
  - `officer_id`: Foreign Key (`users.id`)
  - `action_taken`: Text
  - `remarks`: Text
  - `evidence_url`: String(500)
  - `actual_resolution_days`: Float
  - `resolved_at`: Timestamp

- **`feedbacks`**:
  - `id`: Integer Primary Key
  - `complaint_id`: Foreign Key (`complaints.id`) Unique
  - `citizen_id`: Foreign Key (`users.id`)
  - `rating`: Integer (1-5)
  - `comment`: Text
  - `is_satisfied`: Boolean

- **`audit_logs`**:
  - `id`: Integer Primary Key
  - `user_id`: Foreign Key (`users.id`)
  - `complaint_id`: Foreign Key (`complaints.id`)
  - `action`: String(100)
  - `field_name`: String(100)
  - `old_value`, `new_value`: Text
  - `created_at`: Timestamp
