import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const TopSearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("civic-top-search");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if it's a numeric ID or formatted ID like NAGRIK-2026-00001
    const matchNum = query.trim().replace(/^[^\d]*/, "");
    const parsedId = parseInt(matchNum, 10);
    if (!isNaN(parsedId) && parsedId > 0) {
      navigate(`/complaints/${parsedId}`);
      setQuery("");
      return;
    }

    // Otherwise navigate to search on dashboard
    navigate(`/citizen?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex-1 max-w-xl">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
        <input
          id="civic-top-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.search_placeholder", "Search complaints, track ID, or explore...")}
          className="w-full pl-10 pr-16 py-2.5 bg-white rounded-2xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 transition-all shadow-command-sm font-medium"
        />
        <div className="absolute right-2.5 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-stone-100 text-[10px] font-mono font-bold text-stone-500 border border-stone-200">
            Ctrl K
          </kbd>
        </div>
      </div>
    </form>
  );
};
