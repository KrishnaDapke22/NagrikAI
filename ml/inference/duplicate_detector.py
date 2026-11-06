import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Tuple
import joblib
import os

class SemanticDuplicateDetector:
    def __init__(self):
        models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
        tfidf_path = os.path.join(models_dir, "category_tfidf.joblib")
        if os.path.exists(tfidf_path):
            self.vectorizer = joblib.load(tfidf_path)
        else:
            self.vectorizer = None

    def get_embedding(self, text: str) -> np.ndarray:
        if self.vectorizer is None:
            models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
            self.vectorizer = joblib.load(os.path.join(models_dir, "category_tfidf.joblib"))
        vec = self.vectorizer.transform([text]).toarray()[0]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def find_duplicates(
        self,
        query_text: str,
        existing_complaints: List[Dict[str, Any]],
        threshold: float = 0.55
    ) -> Tuple[List[Dict[str, Any]], float, int]:
        """
        Calculates cosine similarity of query against existing complaints.
        Returns:
            similar_list: sorted list of {id, title, similarity_score, category, status}
            duplicate_probability: float between 0.0 and 1.0
            similar_count: integer count of similar complaints >= threshold
        """
        if not existing_complaints:
            return [], 0.0, 0

        query_vec = self.get_embedding(query_text).reshape(1, -1)

        similar_items = []
        max_score = 0.0

        for comp in existing_complaints:
            comp_text = f"{comp.get('title', '')} {comp.get('description', '')}".strip()
            comp_vec = self.get_embedding(comp_text).reshape(1, -1)
            sim = float(cosine_similarity(query_vec, comp_vec)[0][0])
            
            if sim > max_score:
                max_score = sim

            if sim >= threshold:
                similar_items.append({
                    "id": comp.get("id"),
                    "similar_complaint_id": comp.get("id"),
                    "title": comp.get("title"),
                    "similarity_score": round(sim, 3),
                    "category": comp.get("category"),
                    "status": comp.get("status"),
                    "created_at": comp.get("created_at")
                })

        similar_items.sort(key=lambda x: x["similarity_score"], reverse=True)
        similar_count = len(similar_items)

        # Duplicate probability scaled from max similarity score
        dup_prob = round(max(0.0, min(1.0, (max_score - threshold) / (1.0 - threshold + 1e-5))), 2) if max_score >= threshold else 0.0

        return similar_items[:10], dup_prob, similar_count

duplicate_detector = SemanticDuplicateDetector()
