import numpy as np
from sklearn.cluster import KMeans
from typing import List, Dict, Any
from ml.inference.duplicate_detector import duplicate_detector

def cluster_complaints(complaints: List[Dict[str, Any]], n_clusters: int = 5) -> List[Dict[str, Any]]:
    """
    Groups complaint texts into unsupervised semantic clusters using K-Means.
    """
    if len(complaints) < n_clusters:
        return []

    texts = [f"{c.get('title', '')} {c.get('description', '')}".strip() for c in complaints]
    embeddings = np.array([duplicate_detector.get_embedding(t) for t in texts])

    k = min(n_clusters, len(complaints))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(embeddings)

    clusters_map = {}
    for i, label in enumerate(labels):
        if label not in clusters_map:
            clusters_map[label] = {
                "cluster_id": int(label) + 1,
                "items": [],
                "categories": {}
            }
        comp = complaints[i]
        clusters_map[label]["items"].append(comp)
        cat = comp.get("category", "General")
        clusters_map[label]["categories"][cat] = clusters_map[label]["categories"].get(cat, 0) + 1

    results = []
    for cid, data in clusters_map.items():
        # Determine dominant category
        dominant_cat = max(data["categories"].items(), key=lambda x: x[1])[0] if data["categories"] else "General"
        samples = [item.get("title", "") for item in data["items"][:3]]
        results.append({
            "cluster_id": data["cluster_id"],
            "cluster_name": f"{dominant_cat} Grievance Pattern #{data['cluster_id']}",
            "size": len(data["items"]),
            "sample_complaints": samples,
            "dominant_category": dominant_cat
        })

    results.sort(key=lambda x: x["size"], reverse=True)
    return results
