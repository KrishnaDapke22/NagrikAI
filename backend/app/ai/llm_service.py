import os
import json
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "local").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

class LLMRecommendationService:
    def __init__(self):
        self.provider = LLM_PROVIDER

    def generate_recommendation(
        self,
        complaint_title: str,
        complaint_desc: str,
        category: str,
        subcategory: Optional[str],
        severity: str,
        priority: str,
        location: Optional[str],
        sentiment: str,
        predicted_days: float,
        similar_count: int
    ) -> Dict[str, Any]:
        """
        Generates structured recommendation for the complaint.
        """
        # If external provider is configured and available, try it; otherwise fallback to local intelligent generator
        if self.provider == "gemini" and GEMINI_API_KEY:
            try:
                return self._call_gemini(
                    complaint_title, complaint_desc, category, subcategory, severity, priority, location, sentiment, predicted_days, similar_count
                )
            except Exception as e:
                print(f"Gemini LLM error: {e}, falling back to local domain generator.")

        if self.provider == "openai" and OPENAI_API_KEY:
            try:
                return self._call_openai(
                    complaint_title, complaint_desc, category, subcategory, severity, priority, location, sentiment, predicted_days, similar_count
                )
            except Exception as e:
                print(f"OpenAI LLM error: {e}, falling back to local domain generator.")

        return self._generate_local(
            complaint_title, complaint_desc, category, subcategory, severity, priority, location, sentiment, predicted_days, similar_count
        )

    def _generate_local(
        self,
        title: str,
        desc: str,
        category: str,
        subcategory: Optional[str],
        severity: str,
        priority: str,
        location: Optional[str],
        sentiment: str,
        predicted_days: float,
        similar_count: int
    ) -> Dict[str, Any]:
        sub = subcategory or "General"
        loc = location or "Reported Municipal Ward"

        # Domain-specific action steps and causes
        domain_playbooks = {
            "Electricity": {
                "actions": [
                    f"Dispatch field lineman crew to {loc} for on-site inspection.",
                    "Isolate electrical circuit and verify voltage across feeder line.",
                    f"Inspect {sub.lower() if sub else 'fixture'} and test for short circuit or blown fuse.",
                    "Replace burnt/damaged components with standard municipal inventory.",
                    "Conduct operational illumination and load test after repairs.",
                    "Upload photographic proof of restored lighting/power to CivicAI portal."
                ],
                "causes": [
                    "Underground cable insulation failure or moisture ingress.",
                    "Timer switch malfunction or blown junction box fuse.",
                    "Localized grid load surge or transformer trip."
                ],
                "checklist": [
                    "Line insulation test passed",
                    "New fixture/component serial number logged",
                    "Surrounding streetlights checked for balanced phase load",
                    "Safety earthing verified intact"
                ]
            },
            "Water": {
                "actions": [
                    f"Send hydraulic inspection squad to {loc} to pinpoint line failure.",
                    "Check upstream distribution valve and measure line water pressure.",
                    "Excavate localized section if underground pipe fracture is detected.",
                    "Clamp, weld, or replace defective pipe segment.",
                    "Flush pipeline and run water clarity/chlorine safety test.",
                    "Verify regular supply restoration with resident complainants."
                ],
                "causes": [
                    "High pressure surge causing brittle pipe joint burst.",
                    "Corrosion in aging municipal distribution main line.",
                    "Air lock or accidental valve closure during utility works."
                ],
                "checklist": [
                    "Water pressure returned to standard 1.5 - 2.0 bar",
                    "Turbidity and chlorine residual tests within potable standards",
                    "Trench backfilled and surface leveled safely",
                    "Complainant confirmed restoration of water supply"
                ]
            },
            "Roads": {
                "actions": [
                    f"Deploy road maintenance inspection team to {loc}.",
                    "Cordon off defective road segment with safety cones and reflective tape.",
                    "Clean debris, saw-cut edges of the depression, and apply tack coat.",
                    "Fill with hot/cold mix asphalt and compact using a vibratory road roller.",
                    "Level edges flush with surrounding pavement surface.",
                    "Reopen lane to vehicular traffic and record completion timestamp."
                ],
                "causes": [
                    "Sub-base moisture penetration following heavy rainfall.",
                    "Heavy axle vehicular overload exceeding road design load.",
                    "Inadequate asphalt compaction during previous trench restoration."
                ],
                "checklist": [
                    "Surface smoothness index verified",
                    "Patch compaction test completed without edge seepage",
                    "Reflective signage and caution barricades removed",
                    "Photographic before-and-after evidence archived"
                ]
            },
            "Sanitation": {
                "actions": [
                    f"Route municipal compaction vehicle and sanitation workers to {loc}.",
                    "Collect accumulated solid waste and clear illegal dumping spot.",
                    "Disinfect area using lime powder and germicidal spray.",
                    "Inspect community bins for damage or overflowing capacity.",
                    "Coordinate with ward inspector to adjust waste collection frequency.",
                    "Mark complaint resolved on CivicAI officer portal with geotagged photo."
                ],
                "causes": [
                    "Missed scheduled collection route due to vehicle maintenance delay.",
                    "Commercial waste dumping during night hours.",
                    "Insufficient bin capacity relative to local population density."
                ],
                "checklist": [
                    "Entire waste cleared down to ground surface",
                    "Disinfectant / lime powder applied",
                    "Community bin repaired or additional bin requested",
                    "Photo of spot cleaned uploaded to CivicAI"
                ]
            },
            "Drainage": {
                "actions": [
                    f"Deploy jetting and suction suction machine to {loc}.",
                    "Remove silt, plastic, and solid clogs from storm/sewer catchpit.",
                    "Flush downstream pipe with high-pressure water jet.",
                    "Inspect manhole frame and replace cracked cover if hazardous.",
                    "Confirm free gravity flow of effluent throughout the section.",
                    "Report completion on portal."
                ],
                "causes": [
                    "Accumulation of plastic waste and construction debris in storm drain.",
                    "Broken manhole masonry causing soil collapse into conduit.",
                    "Backflow due to downstream trunk sewer blockage."
                ],
                "checklist": [
                    "Effluent flowing smoothly without stagnation",
                    "Manhole lid seated firmly flush with road level",
                    "Surrounding silt cleared and bagged for cartage",
                    "No foul odor or residual overflow"
                ]
            },
            "Traffic": {
                "actions": [
                    f"Send traffic signal technician team to {loc}.",
                    "Inspect master signal controller cabinet and power supply.",
                    "Diagnose LED signal aspect or loop detector sensor failure.",
                    "Replace faulty control card or blown power supply unit.",
                    "Cycle through traffic phases (Red-Amber-Green) across all directions.",
                    "Liaise with traffic police on duty to restore automated flow."
                ],
                "causes": [
                    "Power surge or intermittent voltage fluctuation.",
                    "Microcontroller timer card crash or memory desynchronization.",
                    "Damaged signal head cabling due to tree branch or overhead snag."
                ],
                "checklist": [
                    "All signal heads operational across 4 phases",
                    "Pedestrian countdown timers synchronized",
                    "Controller box locked securely",
                    "Traffic constable verified smooth intersection flow"
                ]
            },
            "Public Safety": {
                "actions": [
                    f"Issue emergency response order to safety enforcement squad at {loc}.",
                    "Erect visible safety hazard perimeter and warning lights.",
                    "Mitigate immediate danger (barricade open excavation / secure loose cable).",
                    "Summon specialized repair crew or animal control unit as required.",
                    "Verify complete removal of physical hazard to pedestrians.",
                    "Record incident report with timestamp and resolution proof."
                ],
                "causes": [
                    "Unsecured public works excavation left unattended.",
                    "Severe weather damage or structural wear and tear.",
                    "Stray animal pack territorial aggression in residential vicinity."
                ],
                "checklist": [
                    "Hazard eliminated or secured with permanent barrier",
                    "Pedestrian walkway declared safe for public passage",
                    "Officer in charge signed off on safety compliance",
                    "Complainant notified of safety mitigation"
                ]
            }
        }

        playbook = domain_playbooks.get(category, {
            "actions": [
                f"Designate field officer to inspect {loc}.",
                "Ascertain factual circumstances and contact citizen if clarification needed.",
                "Execute corrective measures per municipal administrative protocol.",
                "Document action taken and submit closing report."
            ],
            "causes": [
                "Operational oversight or scheduling delay.",
                "Civic infrastructure deterioration."
            ],
            "checklist": [
                "Inspection completed",
                "Action validated by ward officer",
                "Citizen notified via portal"
            ]
        })

        summary = f"Citizen reported '{title}' ({severity} severity, {priority} priority) at {loc}. {similar_count} related reports logged. Est. resolution: {predicted_days} days."
        
        citizen_draft = (
            f"Dear Citizen, thank you for bringing this issue to our attention. Your complaint regarding "
            f"'{title}' has been prioritized by the {category} team as {priority} priority. "
            f"Our municipal response crew is assigned to {loc} with an expected resolution window of {predicted_days} business days. "
            f"You will receive automatic status notifications as our field officers progress."
        )

        return {
            "summary": summary,
            "action_steps": playbook["actions"],
            "possible_causes": playbook["causes"],
            "verification_checklist": playbook["checklist"],
            "citizen_response_draft": citizen_draft
        }

    def _call_gemini(self, *args, **kwargs) -> Dict[str, Any]:
        # Placeholder for external Gemini SDK if enabled by API key
        raise NotImplementedError("Use local fallback")

    def _call_openai(self, *args, **kwargs) -> Dict[str, Any]:
        # Placeholder for OpenAI SDK if enabled by API key
        raise NotImplementedError("Use local fallback")

llm_service = LLMRecommendationService()
