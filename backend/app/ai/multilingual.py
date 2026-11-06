import re
import unicodedata
from typing import Tuple, Dict, Any, List

MARATHI_INDICATORS = {
    "आहे", "नाही", "झाले", "झाला", "झाली", "रस्ता", "रस्त्यावर", "पाणी", "पाण्याची",
    "कचरा", "लाईट", "गटार", "गटाराचे", "वॉर्ड", "नागरिक", "चौक", "मध्ये", "वर",
    "आम्हाला", "लवकर", "पडला", "पडले", "तुंबले", "फुटली", "फुटला", "दुरुस्ती",
    "करा", "कृपया", "विद्युत", "पथदिवा", "दुर्गंधी", "धोकादायक", "रुग्णालय"
}

HINDI_INDICATORS = {
    "है", "नहीं", "हुआ", "हुई", "हुए", "सड़क", "सड़कें", "पानी", "कूड़ा", "कचरा",
    "बिजली", "नाली", "नालियां", "वार्ड", "खराब", "कृपया", "में", "पर", "हमें",
    "जल्दी", "गिरा", "टूटा", "टूटी", "बदबू", "गंदगी", "स्ट्रीट", "अस्पताल",
    "खतरनाक", "दुर्घटना", "शिकायत", "समस्या", "जल", "नल"
}

DEVANAGARI_CIVIC_LEXICON = {
    # Water Supply
    "पाणी": "water supply", "पाण्याची": "water supply", "पानी": "water supply", "जल": "water supply",
    "नळ": "tap water", "नल": "tap water", "पाईप": "pipeline", "पाइप": "pipeline",
    "पाईपलाईन": "pipeline", "पाइपलाइन": "pipeline", "गळती": "leakage burst", "लीकेज": "leakage",
    "दूषित": "contaminated dirty water", "गंदा": "contaminated dirty water",

    # Roads & Potholes
    "खड्डा": "pothole road damage crater asphalt", "खड्डे": "potholes road damage craters asphalt", "गड्ढा": "pothole road damage crater asphalt",
    "गड्ढे": "potholes road damage craters asphalt", "रस्ता": "road asphalt street", "रस्त्यावर": "road street pothole",
    "सड़क": "road asphalt street", "फुटपाथ": "footpath walkway", "डांबरीकरण": "asphalt road repair",
    "स्पीड ब्रेकर": "speed breaker",

    # Electricity & Streetlights
    "वीज": "electricity power outage", "बिजली": "electricity power outage", "विद्युत": "electricity power",
    "लाईट": "streetlight lighting", "लाइट": "streetlight lighting", "स्ट्रीट लाइट": "streetlight lighting",
    "पथदिवा": "streetlight lamp", "अंधार": "darkness streetlights off", "अंधेरा": "darkness streetlights off",
    "डीपी": "distribution panel transformer", "शॉक": "electric shock risk", "करंट": "electric current hazard",
    "तार": "wire dangling", "केबल": "cable wire",

    # Sanitation & Garbage
    "कचरा": "garbage waste accumulation", "कूड़ा": "garbage waste accumulation",
    "दुर्गंधी": "foul smell odor", "बदबू": "foul smell odor", "कचराकुंडी": "garbage bin dump",
    "डस्टबिन": "dustbin container", "सफाई": "cleaning sanitation", "झाडू": "sweeping cleaning",

    # Drainage & Sewage
    "गटार": "drainage sewage blockage", "नाली": "drainage sewage blockage",
    "सांडपाणी": "sewage wastewater overflow", "तुंबले": "choked blocked overflowing",
    "जाम": "clogged jammed", "उघडी": "open manhole hazard", "खुला": "open manhole hazard",
    "मॅनहोल": "manhole chamber", "मैनहोल": "manhole chamber",

    # Traffic & Obstructions
    "ट्रॅफिक": "traffic jam congestion", "वाहतूक": "traffic jam", "सिग्नल": "traffic signal broken",
    "अडथळा": "road obstruction barrier",

    # Public Safety & Hazards
    "धोका": "risk safety problem", "धोकादायक": "unsafe risk", "खतरा": "risk safety problem",
    "खतरनाक": "unsafe risk", "अपघात": "accident traffic collision", "दुर्घटना": "accident mishap",
    "आग": "fire hazard", "कुत्रे": "stray dogs aggression", "कुत्ते": "stray dogs menace",

    # Public Amenities
    "उद्यान": "public park garden", "पार्क": "public park garden", "झाड": "fallen tree branch",
    "पेड़": "fallen tree branch"
}

DEVANAGARI_SAFETY_KEYWORDS = [
    "धोका", "खतरा", "अपघात", "दुर्घटना", "आग", "शॉक", "करंट", "उघडी", "खुला",
    "तुटलेली तार", "टूटा हुआ तार", "विजेची तार", "गंभीर", "मॅनहोल", "मैनहोल"
]

DEVANAGARI_CROWD_KEYWORDS = [
    "शाळा", "स्कूल", "रुग्णालय", "दवाखाना", "अस्पताल", "बाजार", "मार्केट",
    "चौक", "स्टेशन", "हजारो", "हजारों", "सर्व", "सारे", "नागरिक", "कॉलनी"
]

def detect_language(text: str) -> str:
    """
    Identifies language from text: English, Marathi, or Hindi.
    """
    if not text or not text.strip():
        return "English"

    # Check for Devanagari Unicode block (\u0900 - \u097F)
    devanagari_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    total_chars = len([c for c in text if not c.isspace()])
    
    if total_chars == 0 or (devanagari_chars / total_chars) < 0.15:
        return "English"

    words = set(re.findall(r'[\u0900-\u097F]+', text))
    marathi_count = len(words.intersection(MARATHI_INDICATORS))
    hindi_count = len(words.intersection(HINDI_INDICATORS))

    if marathi_count > hindi_count:
        return "Marathi"
    elif hindi_count > marathi_count:
        return "Hindi"
    else:
        # Default Devanagari preference in Maharashtra municipal jurisdiction is Marathi
        return "Marathi" if marathi_count > 0 else "Hindi"

def normalize_and_translate(text: str, language: str) -> Tuple[str, str, bool, int, int]:
    """
    Normalizes civic complaint text and produces an English semantic representation
    suitable for TF-IDF classification and similarity analysis.

    Returns:
        (normalized_english_text, translated_summary, has_safety_hazard, people_affected, days_unresolved)
    """
    if language == "English":
        # Extract safety and crowd heuristics from English text
        safety_keywords = ["fire", "spark", "accident", "shock", "danger", "unsafe", "open manhole", "hazard", "attack", "bite", "death", "collapse", "injury", "broken pole", "live wire"]
        has_safety = 1 if any(kw in text.lower() for kw in safety_keywords) else 0

        people_affected = 25
        low = text.lower()
        if any(w in low for w in ["school", "hospital", "market", "junction", "station", "chowk"]):
            people_affected = 150
        if any(w in low for w in ["thousands", "entire", "all residents", "whole area", "colony"]):
            people_affected = 350

        days_match = re.search(r"(\d+)\s+days?", low)
        days = int(days_match.group(1)) if days_match else 2

        return text, text, has_safety, people_affected, days

    # Multilingual processing for Marathi and Hindi
    normalized_terms: List[str] = []
    has_safety = 0
    people_affected = 25
    days = 2

    # Check Devanagari safety keywords (for severity/priority flags)
    for sk in DEVANAGARI_SAFETY_KEYWORDS:
        if sk in text:
            has_safety = 1
            break

    # Check Devanagari crowd keywords
    for ck in DEVANAGARI_CROWD_KEYWORDS:
        if ck in text:
            people_affected = 150
            if ck in ["हजारो", "हजारों", "सर्व", "सारे"]:
                people_affected = 350
            break

    # Check Devanagari days
    day_match = re.search(r"(\d+)\s*(?:दिवस|दिन|days|महिने|महीने|आठवडे|हफ्ते)", text)
    if day_match:
        days = int(day_match.group(1))
        if "महि" in day_match.group(0):
            days = days * 30
        elif "आठव" in day_match.group(0) or "हफ्त" in day_match.group(0):
            days = days * 7

    # Map civic lexicon terms to English tokens
    words = re.findall(r'[\u0900-\u097F]+', text)
    for w in words:
        if w in DEVANAGARI_CIVIC_LEXICON:
            normalized_terms.append(DEVANAGARI_CIVIC_LEXICON[w])

    # If terms were matched, synthesize a normalized English sentence for the classifier
    if normalized_terms:
        english_representation = f"{' '.join(normalized_terms)}"
    else:
        # Fallback transliteration / phonetic tokens
        english_representation = f"municipal public infrastructure civic complaint {language.lower()}"

    summary = f"[{language} Grievance] {text[:140]}..." if len(text) > 140 else f"[{language} Grievance] {text}"

    return english_representation, summary, has_safety, people_affected, days
