import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Bell, ChevronDown, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { apiClient } from "../api/client";
import type { NotificationItem } from "../types";

export const UserHeader: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeLangConfig = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll every 30 seconds for live notification updates
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await apiClient.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (e) {
      // Graceful fallback if offline
    }
  };

  const handleMarkRead = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await apiClient.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.complaint_id) {
      setNotifOpen(false);
      navigate(`/complaints/${notif.complaint_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex items-center gap-3 shrink-0">
      {/* Language Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-2xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-command-sm cursor-pointer"
          title="Switch Language / भाषा बदलें / भाषा बदला"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>{activeLangConfig.short}</span>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {langOpen && (
          <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-command-lg border border-stone-200 py-1.5 z-50 text-xs font-medium">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setLangOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer ${
                  language === l.code ? "text-indigo-600 font-bold bg-indigo-50/60" : "text-stone-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                    {l.short}
                  </span>
                  <span>{l.nativeName}</span>
                </div>
                {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notifications Beacon & Flyout */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2.5 bg-white rounded-2xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-command-sm cursor-pointer"
          title={t("nav.notifications", "Notifications")}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-amber-600 rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-command-lg border border-stone-200 z-50 overflow-hidden text-xs">
            <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">{t("nav.notifications", "Notifications")}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> {t("nav.mark_all_read", "Mark all read")}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-stone-400">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">{t("nav.no_notifications", "No notifications yet")}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n)}
                    className={`p-3.5 hover:bg-stone-50 transition-colors cursor-pointer flex flex-col gap-1 ${
                      !n.is_read ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold ${!n.is_read ? "text-indigo-900" : "text-stone-800"}`}>
                        {n.title}
                      </span>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>}
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {n.complaint_id && (
                        <span className="text-indigo-600 font-bold flex items-center gap-0.5">
                          {t("nav.view_dossier", "View Case")} <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar Pill */}
      {user ? (
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-2xl border border-stone-200 shadow-command-sm">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">{user.name}</p>
            <p className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase leading-tight">{user.role}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-3.5 py-2 text-xs font-bold text-stone-700 hover:text-indigo-600 transition-colors"
          >
            {t("nav.sign_in", "Sign In")}
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            {t("nav.register", "Register")}
          </Link>
        </div>
      )}
    </div>
  );
};
