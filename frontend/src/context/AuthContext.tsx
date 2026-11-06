import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types";
import { apiClient } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updatePrivacy: (protectIdentity: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("nagrikai_token") || localStorage.getItem("civicai_token")
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("nagrikai_token") || localStorage.getItem("civicai_token");
      if (storedToken) {
        try {
          const me = await apiClient.getMe();
          setUser(me);
          setToken(storedToken);
          localStorage.setItem("nagrikai_token", storedToken);
        } catch (e) {
          console.warn("Stored token invalid or expired");
          localStorage.removeItem("nagrikai_token");
          localStorage.removeItem("civicai_token");
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, pass);
      localStorage.setItem("nagrikai_token", res.access_token);
      localStorage.setItem("civicai_token", res.access_token); // fallback
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("nagrikai_token");
    localStorage.removeItem("civicai_token");
    localStorage.removeItem("civic_user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const me = await apiClient.getMe();
        setUser(me);
      } catch (e) {
        logout();
      }
    }
  };

  const updatePrivacy = async (protectIdentity: boolean) => {
    const updated = await apiClient.updatePrivacyPreferences(protectIdentity);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser, updatePrivacy }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
