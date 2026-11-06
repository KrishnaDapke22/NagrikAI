import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { translations, SUPPORTED_LANGUAGES } from "../locales";
import type { LanguageCode } from "../locales";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  getStatusLabel: (status: string) => string;
  getPriorityLabel: (priority: string) => string;
  getCategoryLabel: (category: string) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const STORAGE_KEY = "civicai_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const lower = saved.toLowerCase();
      if (lower === "en" || lower === "hi" || lower === "mr") {
        return lower;
      }
    }
  } catch (e) {
    // LocalStorage might be disabled or in private mode
  }
  return "en";
}

function resolveNestedKey(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      console.warn("Failed to persist language in localStorage", e);
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      // 1. Try current language
      const currentVal = resolveNestedKey(translations[language], path);
      if (currentVal) return currentVal;

      // 2. Fallback to English
      if (language !== "en") {
        const enVal = resolveNestedKey(translations.en, path);
        if (enVal) return enVal;
      }

      // 3. Fallback provided by caller or path itself
      return fallback !== undefined ? fallback : path;
    },
    [language]
  );

  const getStatusLabel = useCallback(
    (status: string): string => {
      if (!status) return "";
      const key = `status.${status.toUpperCase()}`;
      return t(key, status.replace(/_/g, " "));
    },
    [t]
  );

  const getPriorityLabel = useCallback(
    (priority: string): string => {
      if (!priority) return "";
      const key = `priority.${priority.toUpperCase()}`;
      return t(key, priority);
    },
    [t]
  );

  const getCategoryLabel = useCallback(
    (category: string): string => {
      if (!category) return "";
      const key = `category.${category}`;
      return t(key, category);
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      getStatusLabel,
      getPriorityLabel,
      getCategoryLabel,
      languages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t, getStatusLabel, getPriorityLabel, getCategoryLabel]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
