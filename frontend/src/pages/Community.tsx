import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import type { Complaint, CommunityCommentItem } from "../types";
import { CivicSidebar } from "../components/CivicSidebar";
import { TopSearchBar } from "../components/TopSearchBar";
import { UserHeader } from "../components/UserHeader";
import { StatusBadge } from "../components/StatusBadge";
import {
  Users,
  Search,
  Filter,
  ThumbsUp,
  MessageSquare,
  MapPin,
  Calendar,
  Grid,
  Shield,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const Community: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedZone, setSelectedZone] = useState("ALL");

  // Track expanded comments per complaint
  const [expandedComments, setExpandedComments] = useState<{ [id: number]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [id: number]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<{ [id: number]: boolean }>({});
  const [localComments, setLocalComments] = useState<{ [id: number]: CommunityCommentItem[] }>({});
  const [supportedMap, setSupportedMap] = useState<{ [id: number]: boolean }>({});
  const [supportCounts, setSupportCounts] = useState<{ [id: number]: number }>({});

  const categories = [
    "ALL",
    "Roads and Infrastructure",
    "Waste Management",
    "Water Supply",
    "Drainage and Sanitation",
    "Electricity and Streetlights",
    "Public Safety",
    "Environment",
  ];

  const zones = ["ALL", "North Zone", "South Zone", "East Zone", "West Zone"];

  useEffect(() => {
    fetchFeed();
  }, [selectedCategory, selectedZone]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== "ALL") params.category = selectedCategory;
      if (selectedZone !== "ALL") params.zone_name = selectedZone;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await apiClient.getCommunityFeed(params);
      setComplaints(data);

      // Preload counts
      const counts: { [id: number]: number } = {};
      const commMap: { [id: number]: CommunityCommentItem[] } = {};
      data.forEach((c) => {
        counts[c.id] = c.affected_count || c.supports_count || 1;
        commMap[c.id] = c.comments || [];
      });
      setSupportCounts(counts);
      setLocalComments(commMap);
    } catch (err) {
      console.error("Failed to load community feed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed();
  };

  const handleSupport = async (complaintId: number) => {
    try {
      const res = await apiClient.supportComplaint(complaintId);
      setSupportedMap((prev) => ({ ...prev, [complaintId]: res.supported }));
      setSupportCounts((prev) => ({ ...prev, [complaintId]: res.affected_count }));
    } catch (err) {
      alert("Unable to register support.");
    }
  };

  const toggleComments = (complaintId: number) => {
    setExpandedComments((prev) => ({ ...prev, [complaintId]: !prev[complaintId] }));
  };

  const handleAddComment = async (complaintId: number) => {
    const text = commentInputs[complaintId]?.trim();
    if (!text) return;

    setSubmittingComment((prev) => ({ ...prev, [complaintId]: true }));
    try {
      const newComm = await apiClient.addComment(complaintId, text);
      setLocalComments((prev) => ({
        ...prev,
        [complaintId]: [...(prev[complaintId] || []), newComm],
      }));
      setCommentInputs((prev) => ({ ...prev, [complaintId]: "" }));
    } catch (err) {
      alert("Failed to submit comment.");
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Zone 1: Sidebar */}
      <CivicSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          <TopSearchBar />
          <UserHeader />
        </header>

        <main className="p-4 sm:p-8 max-w-[1200px] w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                NagrikAI Citizen Community Feed
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Civic Pulse & Community Backing
              </h1>
              <p className="text-sm text-slate-300 font-medium">
                Support fellow citizens experiencing infrastructure faults, track municipal responses, and back local ward priorities with high-assurance verification.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search civic issues, locations, road names, or keywords..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Grid className="w-3.5 h-3.5" /> Zone:
              </span>
              {zones.map((zn) => (
                <button
                  key={zn}
                  onClick={() => setSelectedZone(zn)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedZone === zn
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {zn === "ALL" ? "All Zones" : zn}
                </button>
              ))}
            </div>
          </div>

          {/* Feed List */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Loading civic community reports...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Community Grievances Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No civic issues match your current filters. Clear the search or explore other zones.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((c) => {
                const count = supportCounts[c.id] || c.affected_count || 1;
                const isSupp = supportedMap[c.id];
                const commList = localComments[c.id] || [];
                const isExpanded = expandedComments[c.id];

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Top Row: User + Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {c.is_identity_protected ? "🛡️" : (c.citizen_name?.[0] || "C")}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              {c.is_identity_protected
                                ? "Verified Citizen"
                                : c.citizen_name || "Verified Citizen"}
                            </span>
                            {c.is_identity_protected ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                <Shield className="w-3 h-3 text-emerald-600" />
                                Identity Protected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                Verified Citizen
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(c.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-mono">NAGRIK-2026-{String(c.id).padStart(5, "0")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge type="priority" value={c.priority} />
                        <StatusBadge type="status" value={c.status} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="text-base sm:text-lg font-black text-slate-900 hover:text-blue-600 transition-colors inline-block"
                      >
                        {c.title}
                      </Link>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal line-clamp-3">
                        {c.description}
                      </p>
                    </div>

                    {/* Image Attachment Preview */}
                    {(c.image_url || c.before_image_url) && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100">
                        <img
                          src={c.image_url || c.before_image_url}
                          alt="Citizen Proof"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Meta Info Row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      {c.location_text && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span className="truncate max-w-xs">{c.location_text}</span>
                        </div>
                      )}
                      {c.zone_name && (
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Grid className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.zone_name}</span>
                          {c.grid_cell_id && <span className="font-mono font-normal">({c.grid_cell_id})</span>}
                        </div>
                      )}
                    </div>

                    {/* Action Bar: Support & Comments Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleSupport(c.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSupp
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{isSupp ? "Supported" : "I am also affected"} ({count})</span>
                        </button>

                        <button
                          onClick={() => toggleComments(c.id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Comments ({commList.length})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <Link
                        to={`/complaints/${c.id}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>Full Dossier</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Expandable Comments Drawer */}
                    {isExpanded && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 pt-3 animate-fadeIn">
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {commList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No comments yet. Join the civic discussion.</p>
                          ) : (
                            commList.map((comm) => (
                              <div
                                key={comm.id}
                                className={`p-3 rounded-xl border text-xs space-y-1 ${
                                  comm.is_official_response
                                    ? "bg-blue-100/70 border-blue-300 text-blue-950 font-medium"
                                    : "bg-white border-slate-200 text-slate-800"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{comm.user_name}</span>
                                    {comm.is_official_response && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold">
                                        Authority Response
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(comm.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="leading-relaxed">{comm.comment}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment Input */}
                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <input
                            type="text"
                            value={commentInputs[c.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                            placeholder="Add your civic update or comment..."
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          />
                          <button
                            onClick={() => handleAddComment(c.id)}
                            disabled={submittingComment[c.id] || !commentInputs[c.id]?.trim()}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Post</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
