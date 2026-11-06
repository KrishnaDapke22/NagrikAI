import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { StatusBadge } from "./StatusBadge";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { MapPin, Layers } from "lucide-react";

interface MarkerData {
  id: number;
  title: string;
  category?: string;
  subcategory?: string;
  priority: string;
  severity?: string;
  status: string;
  latitude: number;
  longitude: number;
  location_text?: string;
  department?: string;
  duplicate_count?: number;
}

interface InteractiveMapProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showFilters?: boolean;
  onMarkerClick?: (complaintId: number) => void;
}

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center[0], center[1], zoom, map]);
  return null;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  center,
  zoom = 13,
  height = "420px",
  showFilters = false,
}) => {
  const { t, getCategoryLabel } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const effectiveCenter: [number, number] =
    center ||
    (markers.length > 0 && markers[0].latitude && markers[0].longitude
      ? [markers[0].latitude, markers[0].longitude]
      : [18.5204, 73.8567]);

  const categories = ["All", "Electricity", "Roads", "Water", "Sanitation", "Traffic"];

  const filteredMarkers = selectedCategory === "All"
    ? markers
    : markers.filter((m) => (m.category || "").toLowerCase() === selectedCategory.toLowerCase());

  const getPriorityColor = (priority: string) => {
    switch ((priority || "").toUpperCase()) {
      case "CRITICAL":
        return "#DC2626"; // Crimson
      case "HIGH":
        return "#EA580C"; // Sunset Orange
      case "MEDIUM":
        return "#D97706"; // Warm Amber
      case "LOW":
        return "#059669"; // Emerald
      default:
        return "#4338CA";
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-stone-200 bg-white shadow-command-sm relative flex flex-col" style={{ height }}>
      {showFilters && (
        <div className="p-3.5 border-b border-stone-200 bg-white/95 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Ward GIS Filter
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-900 text-white shadow-xs"
                    : "bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {cat === "All" ? t("category.all_categories", "All") : getCategoryLabel(cat) || cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex-1 w-full h-full">
        <MapContainer
          key={`${effectiveCenter[0]}-${effectiveCenter[1]}`}
          center={effectiveCenter}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <MapRecenter center={effectiveCenter} zoom={zoom} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {filteredMarkers.map((m) => {
            if (!m.latitude || !m.longitude) return null;
            const color = getPriorityColor(m.priority);

            return (
              <CircleMarker
                key={m.id}
                center={[m.latitude, m.longitude]}
                radius={8}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.9,
                  color: "#ffffff",
                  weight: 2.5,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-2 p-3 min-w-[210px] font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                      <span className="font-mono font-bold text-indigo-700">CIV-2026-{String(m.id).padStart(5, "0")}</span>
                      <StatusBadge type="priority" value={m.priority} />
                    </div>
                    <p className="font-bold text-stone-900 line-clamp-2 leading-tight">{m.title}</p>
                    <div className="text-stone-500 space-y-1 text-[11px] pt-1">
                      <div>
                        <span className="font-semibold text-stone-800">Category:</span> {m.category || "General"}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">Status:</span> {m.status}
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">Department:</span> {m.department || "Municipal Operations"}
                      </div>
                      {m.location_text && (
                        <div className="truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{m.location_text}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <Link
                        to={`/complaints/${m.id}`}
                        className="block text-center text-xs font-bold bg-indigo-900 hover:bg-indigo-950 text-white py-1.5 px-3 rounded-xl transition-all shadow-xs"
                      >
                        View Full Dossier &rarr;
                      </Link>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-stone-200 shadow-command text-[11px] z-[1000] flex items-center gap-3">
          <span className="font-bold text-stone-800">Priority:</span>
          <span className="flex items-center gap-1 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Critical
          </span>
          <span className="flex items-center gap-1 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" /> High
          </span>
          <span className="flex items-center gap-1 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" /> Medium
          </span>
          <span className="flex items-center gap-1 text-stone-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Low
          </span>
        </div>
      </div>
    </div>
  );
};
