import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { AIAnalysisCard } from "../components/AIAnalysisCard";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Upload,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Compass,
  X,
  Shield,
  ShieldAlert,
  Mic,
  MicOff,
  Video,
  Music,
  FileText,
  Scan,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { YOLODetectionResult } from "../types";

// Standard 10 NagrikAI Civic Categories and Subcategories
const CATEGORY_TAXONOMY: Record<string, string[]> = {
  "Roads and Infrastructure": ["Potholes", "Damaged roads", "Broken footpaths", "Damaged bridges", "Defective dividers"],
  "Waste Management": ["Garbage accumulation", "Overflowing dustbins", "Illegal dumping", "Dead animal removal", "Biohazard waste"],
  "Water Supply": ["Water leakage", "Water shortage", "Contaminated water", "Pipeline burst", "Low water pressure"],
  "Drainage and Sanitation": ["Blocked drainage", "Overflowing sewage", "Flooding", "Open drain hazard", "Septic tank leak"],
  "Electricity and Streetlights": ["Broken streetlights", "Power-related public infrastructure issues", "Exposed electrical wires", "Damaged transformer"],
  "Public Safety": ["Damaged public structures", "Dangerous open manholes", "Unsafe public areas", "Stray animal aggression", "Fire hazard"],
  "Environment": ["Air pollution", "Noise pollution", "Tree damage", "Illegal tree cutting", "Chemical discharge"],
  "Public Transport": ["Damaged bus stops", "Public transport infrastructure problems", "Broken traffic signals", "Illegal transit parking"],
  "Parks and Public Spaces": ["Damaged playgrounds", "Park maintenance", "Public property damage", "Broken park lights"],
  "Other Civic Issues": ["General civic grievance", "Permit & licensing inquiry", "Public nuisance", "Civic facility inquiry"]
};

// Fix leaflet default marker icons in Vite
const pinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map click handler helper component
function LocationMarker({ position, setPosition, setLocationText }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      setLocationText(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
    },
  });

  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

export const SubmitComplaint: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard Step (1: Details, 2: Location, 3: Evidence & YOLO, 4: Urgency & Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Roads and Infrastructure");
  const [subcategory, setSubcategory] = useState("Potholes");
  const [affectedCount, setAffectedCount] = useState<number>(1);

  // Location State
  const [locationText, setLocationText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [position, setPosition] = useState<[number, number]>([18.5204, 73.8567]); // Default Pune Municipal Center
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Evidence & Multimodal State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("IMAGE");
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);

  // YOLO Visual Detection State
  const [isDetectingYOLO, setIsDetectingYOLO] = useState(false);
  const [yoloResult, setYoloResult] = useState<YOLODetectionResult | null>(null);

  // Privacy & Urgency State
  const [isIdentityProtected, setIsIdentityProtected] = useState(user?.protect_identity_default ?? false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // AI Diagnostic State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update subcategories when category changes
  useEffect(() => {
    const subcats = CATEGORY_TAXONOMY[category] || [];
    if (subcats.length > 0) {
      setSubcategory(subcats[0]);
    }
  }, [category]);

  // Geolocation trigger
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setLocationText(`GPS Verified: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setError("Unable to obtain precise GPS. You can pin your location directly on the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Voice speech-to-text recording
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. You can type or attach an audio recording.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isRecordingAudio) {
      recognition.start();
      setIsRecordingAudio(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setAudioTranscript(transcript);
        setIsRecordingAudio(false);
      };
      recognition.onerror = () => {
        setIsRecordingAudio(false);
      };
      recognition.onend = () => {
        setIsRecordingAudio(false);
      };
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
      setMediaType("IMAGE");
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else if (["mp4", "webm"].includes(ext || "")) {
      setMediaType("VIDEO");
      setMediaPreviewUrl(URL.createObjectURL(file));
    } else if (["mp3", "wav", "m4a", "ogg"].includes(ext || "")) {
      setMediaType("AUDIO");
      setMediaPreviewUrl(URL.createObjectURL(file));
    } else {
      setMediaType("DOCUMENT");
      setMediaPreviewUrl(null);
    }

    // Auto-upload file to server
    try {
      const uploadRes = await apiClient.uploadFile(file);
      setUploadedUrl(uploadRes.url);

      // If image, automatically trigger YOLO visual inspection
      if (uploadRes.media_type === "IMAGE" || uploadRes.url.match(/\.(jpg|jpeg|png|webp)$/i)) {
        runYOLODetection(uploadRes.url);
      } else if (uploadRes.media_type === "AUDIO") {
        runAudioTranscription(uploadRes.url);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Attachment upload failed.");
    }
  };

  // Run YOLO object detection
  const runYOLODetection = async (url: string) => {
    setIsDetectingYOLO(true);
    try {
      const yolo = await apiClient.detectYOLO(url, category, description);
      setYoloResult(yolo);
      if (yolo.recommended_category && CATEGORY_TAXONOMY[yolo.recommended_category]) {
        setCategory(yolo.recommended_category);
      }
    } catch (err) {
      console.warn("YOLO detection error:", err);
    } finally {
      setIsDetectingYOLO(false);
    }
  };

  // Run audio transcription
  const runAudioTranscription = async (url: string) => {
    try {
      const res = await apiClient.transcribeAudio(url);
      if (res.transcript) {
        setAudioTranscript(res.transcript);
        setDescription((prev) => (prev ? `${prev}\n\n[Voice Transcript]: ${res.transcript}` : res.transcript));
      }
    } catch (err) {
      console.warn("Audio transcription error:", err);
    }
  };

  // Run live AI diagnostic preview
  const handleLiveAnalyze = async () => {
    if (!description.trim()) {
      setError("Please describe the grievance to run AI diagnostics.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const analysis = await apiClient.analyzeComplaint(description, locationText);
      setAiPreview(analysis);
      if (analysis.category && CATEGORY_TAXONOMY[analysis.category]) {
        setCategory(analysis.category);
      }
      if (analysis.subcategory) {
        setSubcategory(analysis.subcategory);
      }
    } catch (err: any) {
      setError("AI diagnostic service temporarily busy. You can submit directly.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Final Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const complaintData = {
        title: title.trim(),
        description: description.trim(),
        location_text: locationText.trim() || undefined,
        latitude: position[0],
        longitude: position[1],
        landmark: landmark.trim() || undefined,
        category,
        subcategory,
        image_url: uploadedUrl || undefined,
        before_image_url: uploadedUrl || undefined,
        media_type: mediaType,
        audio_transcript: audioTranscript || undefined,
        yolo_detections: yoloResult ? JSON.stringify(yoloResult.objects) : undefined,
        is_identity_protected: isIdentityProtected,
        is_public: isPublic,
        is_emergency: isEmergency,
        affected_count: affectedCount,
      };

      const res = await apiClient.submitComplaint(complaintData);
      navigate(`/complaints/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Grievance submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <CivicSidebar />

      <div className="flex-1 space-y-6">
        <UserHeader />
        <TopSearchBar />

        {/* Wizard Header */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Intelligent Grievance Wizard
                </span>
                {isIdentityProtected && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" /> Identity Protected
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">Report a Municipal Issue</h1>
              <p className="text-xs text-stone-500 font-medium">
                Step-by-step grievance registration with computer-vision detection and verified civic routing.
              </p>
            </div>

            {/* Stepper indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCurrentStep(step)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    currentStep === step
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : currentStep > step
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                >
                  {currentStep > step ? "✓" : step}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: PROBLEM DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-sm font-bold text-stone-900">Step 1: Problem Details & Classification</h2>
                  <p className="text-xs text-stone-500">Provide clear descriptions of the civic defect.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Grievance Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Deep asphalt pothole causing traffic blockage on Wakad Bridge"
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-stone-900 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Civic Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
                    >
                      {Object.keys(CATEGORY_TAXONOMY).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Subcategory
                    </label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden cursor-pointer"
                    >
                      {(CATEGORY_TAXONOMY[category] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                      Detailed Problem Description
                    </label>
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`text-xs flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer ${
                        isRecordingAudio
                          ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-bold"
                          : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold"
                      }`}
                    >
                      {isRecordingAudio ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{isRecordingAudio ? "Listening..." : "Speak Description"}</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Describe the issue in detail: How big is the damage? How long has it been unresolved? Is it causing an immediate health or safety risk?"
                    className="w-full p-4 rounded-2xl border border-stone-200 bg-stone-50 text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden text-stone-900 leading-relaxed font-normal"
                  />
                  {audioTranscript && (
                    <p className="text-[11px] text-stone-500 mt-1 italic">
                      Transcribed from speech: "{audioTranscript}"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                    Estimated Citizens Impacted ({affectedCount} {affectedCount === 1 ? "person" : "people"})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-semibold mt-1">
                    <span>Individual (1)</span>
                    <span>Neighborhood (15-25)</span>
                    <span>Corridor (50+)</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <span>Next: Select Location</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION & GPS */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-stone-900">Step 2: Smart GPS Location & Pinpoint Map</h2>
                    <p className="text-xs text-stone-500">Detect browser coordinates or pin the spot on the interactive municipal map.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Compass className="w-4 h-4 text-blue-600" />
                    <span>Detect GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Address / Area Details
                    </label>
                    <input
                      type="text"
                      value={locationText}
                      onChange={(e) => setLocationText(e.target.value)}
                      placeholder="e.g. Hinjawadi Phase 1, near High Street"
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Nearest Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite Government Hospital / Metro Pillar #12"
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-stone-50 text-xs text-stone-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {gpsAccuracy && (
                  <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High accuracy GPS locked (radius: ~{gpsAccuracy}m)
                  </p>
                )}

                {/* Leaflet Interactive Map Picker */}
                <div className="rounded-2xl overflow-hidden border border-stone-200 h-64 sm:h-72 relative shadow-inner">
                  <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={setPosition} setLocationText={setLocationText} />
                  </MapContainer>
                  <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-stone-700 shadow-xs border border-stone-200">
                    Click anywhere on the map to place/adjust pin
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Attach Multimodal Evidence</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EVIDENCE & YOLO AI */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-sm font-bold text-stone-900">Step 3: Multimodal Evidence & YOLO AI Inspection</h2>
                  <p className="text-xs text-stone-500">
                    Attach photos, videos, or audio. NagrikAI will automatically scan for civic defects using YOLO.
                  </p>
                </div>

                {/* File Upload Zone */}
                <div className="border-2 border-dashed border-stone-200 rounded-3xl p-6 text-center hover:border-blue-400 bg-stone-50 transition-colors">
                  <input
                    type="file"
                    id="multimodal-upload"
                    onChange={handleFileUpload}
                    accept="image/*,video/mp4,video/webm,audio/*,application/pdf"
                    className="hidden"
                  />
                  <label htmlFor="multimodal-upload" className="cursor-pointer space-y-2 block">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        {mediaFile ? mediaFile.name : "Click or drag to attach photo, video, audio or document"}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Supports JPG, PNG, WEBP, MP4, MP3, WAV, PDF up to 25MB
                      </p>
                    </div>
                  </label>
                </div>

                {/* Preview of attached file */}
                {mediaPreviewUrl && (
                  <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-2">
                        {mediaType === "IMAGE" && <Layers className="w-4 h-4 text-blue-600" />}
                        {mediaType === "VIDEO" && <Video className="w-4 h-4 text-amber-600" />}
                        {mediaType === "AUDIO" && <Music className="w-4 h-4 text-emerald-600" />}
                        {mediaType === "DOCUMENT" && <FileText className="w-4 h-4 text-purple-600" />}
                        Attached {mediaType} Evidence Preview
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreviewUrl(null);
                          setUploadedUrl(null);
                          setYoloResult(null);
                        }}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {mediaType === "IMAGE" && (
                      <div className="relative rounded-xl overflow-hidden max-h-72 flex justify-center bg-black/5">
                        <img
                          src={yoloResult?.annotated_image_url || mediaPreviewUrl}
                          alt="Evidence"
                          className="max-h-72 object-contain rounded-xl"
                        />
                      </div>
                    )}

                    {mediaType === "VIDEO" && (
                      <video src={mediaPreviewUrl} controls className="max-h-64 mx-auto rounded-xl" />
                    )}

                    {mediaType === "AUDIO" && (
                      <audio src={mediaPreviewUrl} controls className="w-full" />
                    )}
                  </div>
                )}

                {/* YOLO Detection Card */}
                {isDetectingYOLO && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 animate-pulse">
                    <Scan className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-blue-950">Running YOLO Civic Issue Detection...</p>
                      <p className="text-[10px] text-blue-700">Identifying potholes, debris, waterlogging & bounding boxes</p>
                    </div>
                  </div>
                )}

                {yoloResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                        <Scan className="w-4 h-4 text-emerald-600" /> YOLO Civic Detection Verified
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {Math.round(yoloResult.confidence * 100)}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium">{yoloResult.summary}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {yoloResult.objects.map((obj, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-stone-800 shadow-xs"
                        >
                          {obj.display_name} ({Math.round(obj.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Next: Urgency, Privacy & Review</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: URGENCY, PRIVACY & REVIEW */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <h2 className="text-sm font-bold text-stone-900">Step 4: Urgency, Citizen Privacy & AI Review</h2>
                  <p className="text-xs text-stone-500">Configure safety priority and protect personal identity before submission.</p>
                </div>

                {/* Privacy-First Citizen Identity Protection Toggle */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isIdentityProtected}
                      onChange={(e) => setIsIdentityProtected(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Protect My Identity (Anonymous to Authorities)
                      </span>
                      <p className="text-[11px] text-stone-600 font-normal leading-relaxed">
                        When enabled, municipal field officers and public feeds will only see your verified status without your real name, email, or phone number. Only authorized administrators with audit logging can view this record.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Life-Safety Emergency Toggle */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEmergency}
                      onChange={(e) => setIsEmergency(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Immediate Life-Safety / Structural Hazard (Fast-Track SLA)
                      </span>
                      <p className="text-[11px] text-stone-600 font-normal leading-relaxed">
                        Flags this complaint for urgent emergency response dispatch within 6-12 hours (e.g. open manholes, active sparks, dangerous water surge).
                      </p>
                    </div>
                  </label>
                </div>

                {/* Publish to NagrikAI Community */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Publish to NagrikAI Community Feed (Allow other citizens to support & comment)
                    </span>
                  </label>
                </div>

                {/* Run Live Diagnostic Review */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleLiveAnalyze}
                    disabled={isAnalyzing}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isAnalyzing ? "Evaluating Models..." : "Preview AI Diagnostics & SLA"}</span>
                  </button>
                </div>

                {aiPreview && (
                  <div className="pt-2">
                    <AIAnalysisCard analysis={aiPreview} />
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Submitting to Municipal Pipeline..." : "Submit Grievance Dossier"}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
