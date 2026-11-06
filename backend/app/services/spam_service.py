import re
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, List
from sqlalchemy.orm import Session
from backend.app.models.complaint import Complaint

ABUSIVE_KEYWORDS = {
    # English abusive / harassment terms
    "idiot", "stupid", "bastard", "scam", "fraud", "kill", "threat", "hate", "abusive",
    # Romanized Hindi/Marathi terms
    "chutiya", "harami", "kamina", "madarchod", "bhenchod", "saala", "kutta",
}

MALICIOUS_LINK_PATTERN = re.compile(r"(https?://\S+|www\.\S+|bit\.ly/\S+|t\.co/\S+)", re.IGNORECASE)

def evaluate_spam_risk(
    db: Session,
    citizen_id: int,
    title: str,
    description: str,
    latitude: float = None,
    longitude: float = None
) -> Tuple[float, List[str], bool]:
    """
    Evaluates grievance submission for spam, fraud, abusive content, and suspicious geolocation.
    Returns: (spam_risk_score: float [0.0 - 1.0], detected_flags: list[str], is_flagged_spam: bool)
    """
    score = 0.0
    flags = []

    text_content = f"{title} {description}".lower()

    # 1. Check for malicious links or URLs
    found_urls = MALICIOUS_LINK_PATTERN.findall(text_content)
    if found_urls:
        score += 0.45
        flags.append(f"Contains {len(found_urls)} external links/URLs, which are restricted in grievances.")

    # 2. Check for abusive language or profanity
    found_abusive = [word for word in ABUSIVE_KEYWORDS if re.search(r"\b" + re.escape(word) + r"\b", text_content)]
    if found_abusive:
        score += 0.40
        flags.append(f"Inappropriate language detected ({', '.join(found_abusive[:3])}).")

    # 3. Check for suspicious / impossible GPS coordinates
    if latitude is not None and longitude is not None:
        if abs(latitude) < 0.001 and abs(longitude) < 0.001:
            score += 0.35
            flags.append("Null island GPS coordinates (0.0, 0.0) detected.")
        elif not (15.0 <= latitude <= 25.0 and 70.0 <= longitude <= 85.0):
            score += 0.25
            flags.append("Coordinates fall outside municipal jurisdiction zone.")

    # 4. Check for high-frequency mass submission (rate limiting / bot activity)
    recent_window = datetime.utcnow() - timedelta(minutes=2)
    recent_count = db.query(Complaint).filter(
        Complaint.citizen_id == citizen_id,
        Complaint.created_at >= recent_window
    ).count()

    if recent_count >= 3:
        score += 0.50
        flags.append(f"High-frequency submission detected: {recent_count} complaints logged within 2 minutes.")
    elif recent_count >= 1:
        score += 0.15

    # 5. Check for repeated identical descriptions
    identical_complaint = db.query(Complaint).filter(
        Complaint.citizen_id == citizen_id,
        Complaint.description == description.strip()
    ).first()
    if identical_complaint:
        score += 0.40
        flags.append("Exact duplicate text submission from the same citizen profile.")

    # 6. Check for gibberish / extremely short input
    words = description.strip().split()
    if len(words) < 3 and len(description.strip()) < 15:
        score += 0.20
        flags.append("Insufficient or truncated complaint text content.")

    # Clamp score
    final_score = min(1.0, round(score, 2))
    is_flagged = final_score >= 0.70

    return final_score, flags, is_flagged
