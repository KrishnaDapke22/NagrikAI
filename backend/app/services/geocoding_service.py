import re
import random
from typing import Optional, Tuple, Dict, Any

# Common civic landmark patterns
LOCATION_PATTERNS = [
    r"(?:near|at|opposite|behind|beside|across|around|along|in front of)\s+([A-Za-z0-9\s\.\-]{3,40}?)(?=[,\.\n]|$|\b(?:is|has|and|was|causing|for)\b)",
    r"([A-Za-z0-9\s\.\-]{3,30}\s+(?:Road|Street|Avenue|Lane|Circle|Chowk|Bridge|Nagar|Colony|Flyover|Market|Hospital|College|School|Park|Station|Sector|Cross))",
]

# Simulated coordinate anchors for a city (e.g., Pune / Metro demo region: 18.5204 N, 73.8567 E)
DEMO_ANCHORS = {
    "college": (18.5293, 73.8565),
    "hospital": (18.5362, 73.8340),
    "market": (18.5158, 73.8559),
    "bridge": (18.5204, 73.8402),
    "station": (18.5284, 73.8743),
    "park": (18.5167, 73.8415),
    "nagar": (18.5679, 73.9143),
    "chowk": (18.5312, 73.8445),
    "road": (18.5220, 73.8520),
    "street": (18.5180, 73.8500),
    "wakad": (18.5987, 73.7688),
    "baner": (18.5590, 73.7868),
    "kothrud": (18.5074, 73.8077),
    "hinjewadi": (18.5913, 73.7389),
    "hadapsar": (18.5089, 73.9260),
    "shivajinagar": (18.5314, 73.8446)
}

def extract_location_from_text(text: str) -> Tuple[Optional[str], float]:
    """
    Extracts potential location text and returns (location_text, confidence).
    """
    cleaned = text.strip()
    for pattern in LOCATION_PATTERNS:
        match = re.search(pattern, cleaned, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Clean trailing words
            candidate = re.sub(r"\b(is|has|was|and|the|a|an)\b$", "", candidate, flags=re.IGNORECASE).strip()
            if len(candidate) > 2:
                return candidate, 0.88

    # Check for direct anchor words
    lower_text = cleaned.lower()
    for key in DEMO_ANCHORS.keys():
        if key in lower_text:
            return key.capitalize(), 0.75

    return None, 0.0

def geocode_location(location_name: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocodes a location name to (latitude, longitude).
    Uses anchor matching with slight jitter to generate realistic coordinates within municipal bounds.
    """
    if not location_name:
        # Default city center with small variation
        lat = 18.5204 + (random.random() - 0.5) * 0.04
        lng = 73.8567 + (random.random() - 0.5) * 0.04
        return round(lat, 5), round(lng, 5)

    loc_lower = location_name.lower()
    for key, coords in DEMO_ANCHORS.items():
        if key in loc_lower:
            jitter_lat = (random.random() - 0.5) * 0.008
            jitter_lng = (random.random() - 0.5) * 0.008
            return round(coords[0] + jitter_lat, 5), round(coords[1] + jitter_lng, 5)

    # Deterministic hash coordinates within city bounds
    hash_val = sum(ord(c) for c in location_name)
    offset_lat = ((hash_val % 100) / 1000.0) - 0.05
    offset_lng = (((hash_val * 7) % 100) / 1000.0) - 0.05
    return round(18.5204 + offset_lat, 5), round(73.8567 + offset_lng, 5)
