import csv
import os
import random

# Seed for reproducibility
random.seed(42)

CATEGORIES = {
    "Electricity": {
        "subcategories": ["Street Light", "Power Outage", "Transformer", "Damaged Pole", "Wiring", "Low Voltage"],
        "templates": [
            ("Street light near {loc} has been off for {days} days and it is becoming unsafe at night.", "Street Light", "Concerned", "HIGH", 1),
            ("No electricity in {loc} since yesterday evening, frequent power outages occurring.", "Power Outage", "Negative", "HIGH", 0),
            ("Sparks coming out of the transformer near {loc}, danger of fire explosion!", "Transformer", "Angry", "CRITICAL", 1),
            ("Electric pole near {loc} is tilted and hanging over pedestrian sidewalk dangerously.", "Damaged Pole", "Concerned", "CRITICAL", 1),
            ("Loose electric wires dangling from pole near {loc} children are playing nearby.", "Wiring", "Angry", "CRITICAL", 1),
            ("Voltage fluctuation in {loc} is damaging home appliances like refrigerators and ACs.", "Low Voltage", "Negative", "MEDIUM", 0),
            ("High mast light at {loc} junction is not functioning causing total darkness.", "Street Light", "Concerned", "HIGH", 1),
            ("Repeated power cut every afternoon in {loc} for the past week.", "Power Outage", "Negative", "MEDIUM", 0),
            ("Streetlight pole rusted completely at the base near {loc}, might fall in wind.", "Damaged Pole", "Concerned", "HIGH", 1),
            ("Open electric meter box on the pavement near {loc} posing shock hazard.", "Wiring", "Angry", "CRITICAL", 1),
        ]
    },
    "Water": {
        "subcategories": ["No Water Supply", "Leakage", "Contamination", "Low Pressure", "Pipeline Broken"],
        "templates": [
            ("No water supply in {loc} for the last 3 days, residents are struggling.", "No Water Supply", "Angry", "HIGH", 0),
            ("Huge underground water pipe burst near {loc}, thousands of liters wasted.", "Leakage", "Concerned", "HIGH", 0),
            ("Tap water smells like sewage and looks muddy near {loc}, health hazard!", "Contamination", "Angry", "CRITICAL", 1),
            ("Extremely low water pressure in {loc}, water cannot reach first floor tanks.", "Low Pressure", "Negative", "MEDIUM", 0),
            ("Main drinking water pipeline cracked during road work near {loc}.", "Pipeline Broken", "Concerned", "HIGH", 0),
            ("Drinking water is yellowish and contaminated with dirt in {loc} area.", "Contamination", "Angry", "CRITICAL", 1),
            ("Drinking water valve leaking constantly near {loc} creating muddy puddle.", "Leakage", "Neutral", "LOW", 0),
            ("Water supply cut off without any prior notice to residents near {loc}.", "No Water Supply", "Negative", "MEDIUM", 0),
            ("Sewage line mixing into drinking water supply near {loc}, please test water urgently.", "Contamination", "Angry", "CRITICAL", 1),
            ("Water tanker not arriving at scheduled time in {loc}.", "No Water Supply", "Negative", "LOW", 0),
        ]
    },
    "Roads": {
        "subcategories": ["Pothole", "Road Damage", "Road Blockage", "Manhole Cover", "Speed Breaker"],
        "templates": [
            ("Deep pothole near {loc} is causing severe bike accidents and vehicle damage.", "Pothole", "Concerned", "HIGH", 1),
            ("Entire road stretch near {loc} has broken asphalt and stones scattered everywhere.", "Road Damage", "Negative", "MEDIUM", 0),
            ("Fallen tree branch blocking two lanes of traffic near {loc}.", "Road Blockage", "Concerned", "HIGH", 1),
            ("Missing manhole cover on the road near {loc} is an open death trap for motorists.", "Manhole Cover", "Angry", "CRITICAL", 1),
            ("Illegal unmarked speed breaker near {loc} causes heavy scraping and injuries.", "Speed Breaker", "Negative", "MEDIUM", 0),
            ("Huge crater on road after recent rainfall near {loc} causing traffic jam.", "Pothole", "Concerned", "HIGH", 1),
            ("Road resurfacing left incomplete near {loc}, gravel flying onto pedestrians.", "Road Damage", "Negative", "MEDIUM", 0),
            ("Open trench dug by telecom company left unfilled on {loc} road for 2 weeks.", "Road Damage", "Angry", "HIGH", 1),
            ("Potholes near {loc} school are dangerous for children crossing.", "Pothole", "Concerned", "HIGH", 1),
            ("Road caved in near {loc} bridge approach, barrier needed immediately.", "Road Damage", "Angry", "CRITICAL", 1),
        ]
    },
    "Sanitation": {
        "subcategories": ["Garbage Accumulation", "Overflowing Bin", "Dead Animal", "Open Dumping", "Sweeping"],
        "templates": [
            ("Garbage not picked up for 4 days near {loc}, terrible stench spreading everywhere.", "Garbage Accumulation", "Angry", "HIGH", 0),
            ("Community dustbin overflowing with waste near {loc} and stray cattle feeding on plastic.", "Overflowing Bin", "Negative", "MEDIUM", 0),
            ("Dead dog lying on the road corner near {loc}, please remove immediately for hygiene.", "Dead Animal", "Concerned", "HIGH", 1),
            ("Illegal open dumping of commercial construction waste near {loc} park.", "Open Dumping", "Negative", "MEDIUM", 0),
            ("Street sweeping not done for over a week near {loc} residential lane.", "Sweeping", "Negative", "LOW", 0),
            ("Rotting food waste dumped outside market near {loc} attracting flies and mosquitoes.", "Garbage Accumulation", "Angry", "HIGH", 1),
            ("Sanitation workers burnt trash near {loc} releasing toxic plastic fumes.", "Open Dumping", "Angry", "HIGH", 1),
            ("Garbage bin broken and overturned near {loc} bus stop.", "Overflowing Bin", "Neutral", "LOW", 0),
            ("Accumulated garbage blocking pedestrian walkway near {loc}.", "Garbage Accumulation", "Negative", "MEDIUM", 0),
            ("Dead animal decomposing in roadside gutter near {loc} unbearable foul smell.", "Dead Animal", "Angry", "CRITICAL", 1),
        ]
    },
    "Drainage": {
        "subcategories": ["Drainage Overflow", "Blocked Gutter", "Stormwater Flooding", "Sewage Stagnation"],
        "templates": [
            ("Sewage water overflowing from drain onto main street near {loc}.", "Drainage Overflow", "Angry", "HIGH", 1),
            ("Stormwater drain completely choked with plastic bottles near {loc}.", "Blocked Gutter", "Concerned", "MEDIUM", 0),
            ("Waterlogging and flooding on road near {loc} after moderate rain, knee-deep water.", "Stormwater Flooding", "Angry", "HIGH", 1),
            ("Black stagnant sewage water standing in open ditch near {loc} breeding mosquitoes.", "Sewage Stagnation", "Negative", "MEDIUM", 1),
            ("Underground sewer line choked and backflowing into ground floor residences near {loc}.", "Drainage Overflow", "Angry", "CRITICAL", 1),
            ("Drain grate missing near {loc}, people could step into the gutter at night.", "Blocked Gutter", "Concerned", "HIGH", 1),
            ("Rainwater entering shops near {loc} because roadside culvert is blocked.", "Stormwater Flooding", "Angry", "HIGH", 0),
            ("Foul sewer smell coming from uncleaned drainage channel near {loc}.", "Sewage Stagnation", "Negative", "LOW", 0),
            ("Drain cleaning vehicle dumped sludge on roadside near {loc} and left without clearing.", "Sewage Stagnation", "Negative", "MEDIUM", 0),
            ("Open stormwater nullah overflowing into neighborhood near {loc}.", "Drainage Overflow", "Angry", "CRITICAL", 1),
        ]
    },
    "Traffic": {
        "subcategories": ["Signal Malfunction", "Illegal Parking", "Traffic Congestion", "Signage", "Encroachment"],
        "templates": [
            ("Traffic signal light stuck on red in all 4 directions near {loc} chowk.", "Signal Malfunction", "Angry", "HIGH", 1),
            ("Commercial trucks parked illegally on both sides of {loc} narrowing the road.", "Illegal Parking", "Negative", "MEDIUM", 0),
            ("Severe traffic jam at {loc} junction due to faulty timer on traffic signal.", "Traffic Congestion", "Negative", "MEDIUM", 0),
            ("Pedestrian crossing sign damaged and turned upside down near {loc}.", "Signage", "Neutral", "LOW", 0),
            ("Roadside vendors encroaching onto roadway near {loc} station causing bottlenecks.", "Encroachment", "Negative", "MEDIUM", 0),
            ("Blinkers not functioning at blind curve near {loc} risk of high-speed collision.", "Signal Malfunction", "Concerned", "HIGH", 1),
            ("Auto-rickshaws blocking bus bay near {loc} creating traffic deadlock.", "Illegal Parking", "Negative", "LOW", 0),
            ("No one-way signage near {loc}, vehicles driving wrong way creating danger.", "Signage", "Concerned", "HIGH", 1),
            ("Traffic light pole hit by car and tilted precariously near {loc}.", "Signal Malfunction", "Concerned", "HIGH", 1),
            ("Extreme gridlock near {loc} flyover during peak office rush hour.", "Traffic Congestion", "Negative", "MEDIUM", 0),
        ]
    },
    "Public Safety": {
        "subcategories": ["Stray Animals", "Unsafe Structure", "Fallen Tree", "Open Trench", "Hazard"],
        "templates": [
            ("Pack of aggressive stray dogs chasing two-wheelers and biting pedestrians near {loc}.", "Stray Animals", "Angry", "CRITICAL", 1),
            ("Dilapidated balcony of abandoned building near {loc} is crumbling onto sidewalk.", "Unsafe Structure", "Concerned", "CRITICAL", 1),
            ("Large banyan tree branch cracked and leaning dangerously over {loc} school.", "Fallen Tree", "Concerned", "CRITICAL", 1),
            ("Deep uncovered excavation pit without barricades or warning lamps near {loc}.", "Open Trench", "Angry", "CRITICAL", 1),
            ("Children playground equipment broken with sharp rusted metal edges in {loc} park.", "Hazard", "Concerned", "HIGH", 1),
            ("Stray dog menace outside hospital near {loc} patients and attendants scared.", "Stray Animals", "Concerned", "HIGH", 1),
            ("Old boundary wall leaning toward road near {loc}, risk of collapse.", "Unsafe Structure", "Concerned", "HIGH", 1),
            ("Dry tree caught fire near {loc} power cables.", "Hazard", "Angry", "CRITICAL", 1),
            ("Rabid animal spotted roaming near {loc} market square.", "Stray Animals", "Angry", "CRITICAL", 1),
            ("Open construction scaffolding collapsing onto street near {loc}.", "Unsafe Structure", "Angry", "CRITICAL", 1),
        ]
    },
    "General Administration": {
        "subcategories": ["Noise Pollution", "Public Nuisance", "Park Maintenance", "Civic Facility"],
        "templates": [
            ("Loud commercial loudspeakers playing past midnight near {loc} residential area.", "Noise Pollution", "Angry", "MEDIUM", 0),
            ("Public park walking track damaged and benches broken near {loc}.", "Park Maintenance", "Neutral", "LOW", 0),
            ("Public toilet locked and out of service near {loc} market.", "Civic Facility", "Negative", "MEDIUM", 0),
            ("Illegal billboard erected without permission blocking view near {loc}.", "Public Nuisance", "Neutral", "LOW", 0),
            ("Construction work operating heavy drilling machines at 2 AM near {loc} hospital.", "Noise Pollution", "Angry", "HIGH", 1),
            ("Drinking water fountain in municipal park near {loc} is broken and dry.", "Civic Facility", "Neutral", "LOW", 0),
            ("Open smoking and anti-social gathering in abandoned booth near {loc}.", "Public Nuisance", "Concerned", "MEDIUM", 0),
            ("Community hall booking system not working at {loc} ward office.", "Civic Facility", "Neutral", "LOW", 0),
            ("Overgrown bushes encroaching sidewalk near {loc} public library.", "Park Maintenance", "Neutral", "LOW", 0),
            ("High decibel industrial generator running in quiet residential zone of {loc}.", "Noise Pollution", "Angry", "HIGH", 0),
        ]
    }
}

LOCATIONS = [
    "Wakad Bridge", "College Road", "City Hospital", "Central Market", "Shivajinagar Station",
    "Model Colony Park", "Baner Chowk", "Kothrud Depot", "Hinjewadi Phase 1", "Hadapsar Flyover",
    "FC Road", "JM Road", "Aundh Circle", "Camp MG Road", "Viman Nagar Square", "Swargate Bus Stand",
    "Karve Nagar", "Senapati Bapat Road", "Deccan Gymkhana", "Koregaon Park Lane 5"
]

def generate_dataset(output_path: str, count: int = 500):
    rows = []
    
    # Priority mapping logic
    def compute_priority(severity, safety_hazard, people_affected, duplicate_count, days_unresolved):
        score = 0
        if severity == "CRITICAL": score += 40
        elif severity == "HIGH": score += 25
        elif severity == "MEDIUM": score += 15
        else: score += 5

        if safety_hazard == 1: score += 25
        score += min(people_affected // 10, 15)
        score += min(duplicate_count * 3, 15)
        score += min(days_unresolved * 2, 10)

        if score >= 65: return "CRITICAL"
        if score >= 45: return "HIGH"
        if score >= 25: return "MEDIUM"
        return "LOW"

    # Resolution days mapping logic (regression target)
    def compute_resolution_days(category, severity, priority, days_unresolved):
        base_days = {
            "Electricity": 1.5,
            "Water": 2.0,
            "Roads": 4.5,
            "Sanitation": 1.2,
            "Drainage": 2.5,
            "Traffic": 1.8,
            "Public Safety": 1.0,
            "General Administration": 3.5
        }.get(category, 2.5)

        mult = 1.0
        if priority == "CRITICAL": mult = 0.6  # Emergency fast-track
        elif priority == "HIGH": mult = 0.9
        elif priority == "MEDIUM": mult = 1.2
        else: mult = 1.5

        noise = random.uniform(-0.4, 0.4)
        pred = max(0.5, round(base_days * mult + noise, 1))
        return pred

    sample_id = 1
    while len(rows) < count:
        for cat, data in CATEGORIES.items():
            for text_tmpl, subcat, sentiment, severity, safety in data["templates"]:
                loc = random.choice(LOCATIONS)
                days = random.randint(1, 14)
                text = text_tmpl.format(loc=loc, days=days)
                
                # Add natural variations
                if random.random() < 0.2:
                    text = "URGENT: " + text
                elif random.random() < 0.15:
                    text = "Please resolve: " + text.lower()
                elif random.random() < 0.1:
                    text = text + " Kindly look into this promptly."

                people_affected = random.choice([5, 12, 25, 50, 100, 250, 500])
                duplicate_count = random.choice([0, 0, 1, 2, 3, 5, 8, 12])
                priority = compute_priority(severity, safety, people_affected, duplicate_count, days)
                res_days = compute_resolution_days(cat, severity, priority, days)

                rows.append({
                    "id": sample_id,
                    "text": text,
                    "category": cat,
                    "subcategory": subcat,
                    "sentiment": sentiment,
                    "severity": severity,
                    "location": loc,
                    "safety_hazard": safety,
                    "people_affected": people_affected,
                    "duplicate_count": duplicate_count,
                    "days_unresolved": days,
                    "priority": priority,
                    "actual_resolution_days": res_days
                })
                sample_id += 1
                if len(rows) >= count:
                    break
            if len(rows) >= count:
                break

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} complaint dataset records at {output_path}")

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "complaints_dataset.csv")
    generate_dataset(out, count=520)
