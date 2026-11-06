# CivicAI REST API Reference

The backend exposes 17 interactive endpoints documented automatically via FastAPI OpenAPI / Swagger UI at `/docs`.

## Endpoint Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new citizen or officer account.
- `POST /api/auth/login`: Authenticate and receive JWT access token.
- `GET /api/auth/me`: Get current authenticated user profile.

### AI Intelligence (`/api/ai`)
- `POST /api/ai/analyze`: Real-time multi-model complaint analysis.
  - **Body**: `{"complaint": "string", "location": "string"}`
  - **Returns**: Full multi-model diagnostics, SHAP explanations, and GenAI recommendations.

### Complaints (`/api/complaints`)
- `POST /api/complaints`: Submit new grievance, auto-run AI pipeline, link duplicates, and route to department.
- `GET /api/complaints`: List complaints with status, priority, category, and search filters.
- `GET /api/complaints/{id}`: Detailed complaint view with AI diagnostics, duplicate links, and resolution audit.
- `POST /api/complaints/{id}/feedback`: Submit 1-5 star citizen satisfaction rating and comments.

### Officer Workflows (`/api/officer`)
- `GET /api/officer/complaints`: Filtered queue for authorized officers.
- `POST /api/officer/complaints/{id}/status`: Transition complaint status (`IN_PROGRESS`, `REOPENED`, etc.).
- `POST /api/officer/complaints/{id}/override`: Human-in-the-loop override for category, priority, and department with audit logging.
- `POST /api/officer/complaints/{id}/resolve`: Record action taken, remarks, and resolution evidence.

### Administration & Analytics (`/api/admin`)
- `GET /api/admin/analytics`: Executive KPIs, category/priority distributions, trends, and clusters.
- `GET /api/admin/map`: Geocoded coordinates with priority markers for map rendering.
- `GET /api/admin/audit-logs`: Municipal audit trail of status changes and officer overrides.

### Departments & Uploads
- `GET /api/departments`: Municipal department directory.
- `POST /api/uploads`: Secure multipart file and image upload.
