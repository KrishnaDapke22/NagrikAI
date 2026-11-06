import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { LandingPage } from "./pages/LandingPage";
import { CitizenDashboard } from "./pages/CitizenDashboard";
import { SubmitComplaint } from "./pages/SubmitComplaint";
import { OfficerDashboard } from "./pages/OfficerDashboard";
import { ComplaintDetail } from "./pages/ComplaintDetail";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Community } from "./pages/Community";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Verifying session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "CITIZEN") return <Navigate to="/citizen" replace />;
    if (user.role === "OFFICER") return <Navigate to="/officer" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-12 text-center text-xs text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "OFFICER") return <Navigate to="/officer" replace />;
  return <Navigate to="/citizen" replace />;
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Citizen Routes */}
                <Route
                  path="/citizen"
                  element={
                    <ProtectedRoute allowedRoles={["CITIZEN", "ADMIN"]}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submit"
                  element={
                    <ProtectedRoute>
                      <SubmitComplaint />
                    </ProtectedRoute>
                  }
                />

                {/* NagrikAI Community Feed */}
                <Route
                  path="/community"
                  element={
                    <ProtectedRoute>
                      <Community />
                    </ProtectedRoute>
                  }
                />

                {/* Officer Routes */}
                <Route
                  path="/officer"
                  element={
                    <ProtectedRoute allowedRoles={["OFFICER", "ADMIN"]}>
                      <OfficerDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Complaint Detail */}
                <Route
                  path="/complaints/:id"
                  element={
                    <ProtectedRoute>
                      <ComplaintDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <MobileBottomNav />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
