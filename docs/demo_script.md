# CivicAI End-to-End Demo Script & Presentation Guide

## Demo Walkthrough Scenario (Section 47)

### Step 1: Citizen Submission
1. Open web application at `http://localhost:3000`.
2. Click **One-Click Demo Personas -> Citizen** and log in (`citizen@civicai.gov` / `citizen123`).
3. Click **Submit Grievance**.
4. Enter title: `Street light outage near college campus`.
5. Enter description: `The street light near my college has been off for 5 days and it is becoming unsafe at night.`
6. Click **Run AI Live Diagnostic**:
   - Observe live ML classification: Category -> `Electricity`, Subcategory -> `Street Light`, Sentiment -> `Concerned`, Severity -> `HIGH`, Priority -> `HIGH`.
7. Click **Submit Grievance**.
8. Notice automated routing to **Electrical Department**, estimated resolution: **1.2 days**, and initial status: **OPEN**.

### Step 2: Officer Inspection & Human-in-the-Loop Override
1. Log out and click **One-Click Demo Personas -> Officer** (`officer@civicai.gov` / `officer123`).
2. Open the grievance in the officer work queue.
3. Review the **AI Multi-Model Diagnostics**, **SHAP Explainability Chart** ("Why High Priority?"), and **Generative AI SOP Playbook**.
4. Click **Human-in-the-Loop Override**:
   - Upgrade Priority from `HIGH` to `CRITICAL` with reason: `Near university women's hostel, immediate safety risk.`
   - Confirm change and notice instant update in the audit trail.
5. Click **Start Investigation** (Status -> `IN_PROGRESS`).

### Step 3: Resolution & Verification
1. Click **Mark Resolved**:
   - Enter Action Taken: `Replaced burnt sodium-vapor ballast and repaired insulated neutral conductor.`
   - Enter Remarks: `Illumination tested across 4 adjacent poles.`
2. Submit resolution. Status updates to **RESOLVED**.

### Step 4: Citizen Quality Feedback
1. Log in back as **Citizen**.
2. Open the complaint; see resolution details and officer action report.
3. Submit 5-star rating and comment: `Fixed on the same day, thank you!`.

### Step 5: Executive Analytics & Map Intelligence
1. Log in as **Admin** (`admin@civicai.gov` / `admin123`).
2. View **Admin Analytics**:
   - Live KPI cards.
   - Category distribution and Department workload metrics.
   - **Geospatial Map**: Interactive priority-colored pins.
   - **AI-Generated Clusters**: Unsupervised pattern discovery.
   - **Model Performance Center**: Real test accuracy, MAE, and $R^2$.
   - **Audit Trail**: Full history of officer override and status transition events.
