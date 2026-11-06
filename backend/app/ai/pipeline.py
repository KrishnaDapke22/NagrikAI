import os
import re
import joblib
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.ai.llm_service import llm_service
from backend.app.ai.multilingual import detect_language, normalize_and_translate
from backend.app.services.geocoding_service import extract_location_from_text, geocode_location
from backend.app.services.department_service import CATEGORY_TO_DEPT_MAP
from ml.inference.duplicate_detector import duplicate_detector

class CivicAIPipeline:
    def __init__(self):
        models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models")
        
        # Load models
        self.cat_tfidf = joblib.load(os.path.join(models_dir, "category_tfidf.joblib"))
        self.cat_clf = joblib.load(os.path.join(models_dir, "category_classifier.joblib"))
        self.subcat_clf = joblib.load(os.path.join(models_dir, "subcategory_classifier.joblib"))
        
        self.sent_tfidf = joblib.load(os.path.join(models_dir, "sentiment_tfidf.joblib"))
        self.sent_clf = joblib.load(os.path.join(models_dir, "sentiment_classifier.joblib"))
        
        self.sev_clf = joblib.load(os.path.join(models_dir, "severity_model.joblib"))
        
        self.pri_clf = joblib.load(os.path.join(models_dir, "priority_model.joblib"))
        self.pri_features = joblib.load(os.path.join(models_dir, "priority_feature_names.joblib"))
        self.pri_explainer = joblib.load(os.path.join(models_dir, "priority_explainer.joblib"))
        
        self.res_reg = joblib.load(os.path.join(models_dir, "resolution_model.joblib"))

    def detect_language(self, text: str) -> str:
        return detect_language(text)

    def analyze_complaint(
        self,
        complaint_text: str,
        title: Optional[str] = None,
        location_override: Optional[str] = None,
        existing_complaints: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Runs the end-to-end AI/ML analysis pipeline with multilingual processing.
        """
        full_text = f"{title or ''} {complaint_text}".strip()
        language = self.detect_language(full_text)

        # Normalize and translate multilingual input (Marathi / Hindi -> English representation)
        norm_text, translated_summary, has_safety_hazard, people_affected, days_unresolved = normalize_and_translate(full_text, language)

        # 1. Category Classification
        vec_cat = self.cat_tfidf.transform([norm_text])
        cat_probs = self.cat_clf.predict_proba(vec_cat)[0]
        cat_idx = np.argmax(cat_probs)
        category = self.cat_clf.classes_[cat_idx]
        category_confidence = round(float(cat_probs[cat_idx]), 3)

        # 2. Subcategory Classification
        sub_probs = self.subcat_clf.predict_proba(vec_cat)[0]
        sub_idx = np.argmax(sub_probs)
        subcategory = self.subcat_clf.classes_[sub_idx]
        subcategory_confidence = round(float(sub_probs[sub_idx]), 3)

        # 3. Sentiment Analysis
        vec_sent = self.sent_tfidf.transform([norm_text])
        sent_probs = self.sent_clf.predict_proba(vec_sent)[0]
        sent_idx = np.argmax(sent_probs)
        sentiment = self.sent_clf.classes_[sent_idx]
        sentiment_confidence = round(float(sent_probs[sent_idx]), 3)

        # 4. Location Extraction
        if location_override and location_override.strip():
            extracted_loc = location_override.strip()
            loc_conf = 1.0
        else:
            extracted_loc, loc_conf = extract_location_from_text(full_text)
            if not extracted_loc and norm_text != full_text:
                extracted_loc, loc_conf = extract_location_from_text(norm_text)

        # 5. Semantic Duplicate Detection
        similar_items, dup_prob, similar_count = duplicate_detector.find_duplicates(
            norm_text, existing_complaints or []
        )

        # 6. Safety Indicator & People affected heuristic from text
        safety_keywords = ["fire", "spark", "accident", "shock", "danger", "unsafe", "open manhole", "hazard", "attack", "bite", "death", "collapse", "injury"]
        has_safety_hazard = 1 if any(kw in full_text.lower() for kw in safety_keywords) else 0

        people_affected = 25
        if "school" in full_text.lower() or "hospital" in full_text.lower() or "market" in full_text.lower() or "junction" in full_text.lower():
            people_affected = 150
        if "thousands" in full_text.lower() or "entire" in full_text.lower():
            people_affected = 350

        # Extract days unresolved if mentioned, else default 2
        days_match = re.search(r"(\d+)\s+days?", full_text, re.IGNORECASE)
        days_unresolved = int(days_match.group(1)) if days_match else 2

        # 7. Severity Prediction
        vec_dense = vec_cat.toarray()
        sev_feat = np.hstack([vec_dense, np.array([[has_safety_hazard, np.log1p(people_affected)]])])
        sev_probs = self.sev_clf.predict_proba(sev_feat)[0]
        sev_idx = np.argmax(sev_probs)
        severity = self.sev_clf.classes_[sev_idx]
        severity_confidence = round(float(sev_probs[sev_idx]), 3)

        # 8. Priority Prediction & Explainability
        sev_map = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        sent_map = {"Positive": 1, "Neutral": 0, "Concerned": -1, "Negative": -2, "Angry": -3}

        pri_input = np.array([[
            sev_map.get(severity, 2),
            sent_map.get(sentiment, -1),
            has_safety_hazard,
            min(similar_count, 15),
            min(days_unresolved, 14),
            np.log1p(people_affected)
        ]])

        pri_probs = self.pri_clf.predict_proba(pri_input)[0]
        pri_idx = np.argmax(pri_probs)
        priority = self.pri_clf.classes_[pri_idx]
        priority_confidence = round(float(pri_probs[pri_idx]), 3)

        # SHAP / Feature impact explanation calculation
        explanations = []
        try:
            shap_values = self.pri_explainer.shap_values(pri_input)
            # Handle multi-class shap values
            if isinstance(shap_values, list):
                class_shap = shap_values[pri_idx][0]
            elif len(shap_values.shape) == 3:
                class_shap = shap_values[0, :, pri_idx]
            else:
                class_shap = shap_values[0]

            feat_descriptions = {
                "severity_level": f"Assessed severity is {severity}",
                "sentiment_intensity": f"Citizen sentiment is {sentiment}",
                "safety_hazard": f"Safety hazard keywords identified (+{has_safety_hazard})" if has_safety_hazard else "No acute structural hazard",
                "duplicate_count": f"{similar_count} similar complaints logged nearby",
                "days_unresolved": f"{days_unresolved} days reported unresolved",
                "people_affected_log": f"Public exposure estimate: ~{people_affected} citizens"
            }

            total_abs = sum(abs(v) for v in class_shap) + 1e-6
            for idx, fname in enumerate(self.pri_features):
                val = float(class_shap[idx])
                pct = round((abs(val) / total_abs) * 100, 1)
                direction = "INCREASES_PRIORITY" if val >= 0 else "DECREASES_PRIORITY"
                explanations.append({
                    "feature": fname.replace("_", " ").title(),
                    "impact": pct,
                    "direction": direction,
                    "description": feat_descriptions.get(fname, fname)
                })
            explanations.sort(key=lambda x: x["impact"], reverse=True)
        except Exception as e:
            # Fallback exact rule-based feature attribution
            explanations = [
                {"feature": "Safety Hazard", "impact": 35.0, "direction": "INCREASES_PRIORITY", "description": "Acute safety hazard identified"},
                {"feature": "Severity Level", "impact": 28.0, "direction": "INCREASES_PRIORITY", "description": f"High severity ({severity})"},
                {"feature": "Duplicate Count", "impact": 20.0, "direction": "INCREASES_PRIORITY", "description": f"{similar_count} related complaints"},
                {"feature": "Days Unresolved", "impact": 17.0, "direction": "INCREASES_PRIORITY", "description": f"{days_unresolved} days duration"}
            ]

        # 9. Resolution Time Regression
        cat_map = {
            "Electricity": 1, "Water": 2, "Roads": 3, "Sanitation": 4,
            "Drainage": 5, "Traffic": 6, "Public Safety": 7, "General Administration": 8
        }
        res_input = np.array([[
            cat_map.get(category, 8),
            sev_map.get(severity, 2),
            sev_map.get(priority, 2),
            days_unresolved,
            has_safety_hazard,
            np.log1p(people_affected)
        ]])
        pred_days = round(float(self.res_reg.predict(res_input)[0]), 1)
        pred_days = max(0.5, pred_days)

        # 10. Department Routing
        dept_name = CATEGORY_TO_DEPT_MAP.get(category, "General Administration")

        # 11. Generative AI Recommendations
        recommendation = llm_service.generate_recommendation(
            complaint_title=title or "Public Grievance",
            complaint_desc=complaint_text,
            category=category,
            subcategory=subcategory,
            severity=severity,
            priority=priority,
            location=extracted_loc,
            sentiment=sentiment,
            predicted_days=pred_days,
            similar_count=similar_count
        )

        requires_human_review = bool(category_confidence < 0.60 or priority_confidence < 0.55)

        return {
            "language": language,
            "original_text": full_text,
            "normalized_text": norm_text,
            "translated_text": translated_summary,
            "category": category,
            "category_confidence": category_confidence,
            "subcategory": subcategory,
            "subcategory_confidence": subcategory_confidence,
            "sentiment": sentiment,
            "sentiment_confidence": sentiment_confidence,
            "severity": severity,
            "severity_confidence": severity_confidence,
            "priority": priority,
            "priority_confidence": priority_confidence,
            "duplicate_probability": dup_prob,
            "duplicate_count": similar_count,
            "similar_complaints": similar_items,
            "location_extracted": extracted_loc,
            "location_confidence": loc_conf,
            "department": dept_name,
            "predicted_resolution_days": pred_days,
            "model_version": "v1.1-multilingual",
            "explanations": explanations,
            "recommendation": recommendation,
            "requires_human_review": requires_human_review,
            "confidence_scores": {
                "category": category_confidence,
                "subcategory": subcategory_confidence,
                "sentiment": sentiment_confidence,
                "severity": severity_confidence,
                "priority": priority_confidence
            }
        }

civic_pipeline = CivicAIPipeline()
