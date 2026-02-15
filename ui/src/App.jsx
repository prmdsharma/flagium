import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Flags from "./pages/Flags";
import LoginPage from "./pages/LoginPage";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import ReportsPage from "./pages/ReportsPage";
import LandingPage from "./pages/public/LandingPage";
import MethodologyPage from "./pages/public/MethodologyPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import PrivacyPage from "./pages/public/PrivacyPage";
import TermsPage from "./pages/public/TermsPage";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { api } from "./api";
import "./index.css";

/* ── App Content ── */
function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        {/* If user is logged in, redirect home to dashboard is common pattern, 
            but for a public site, maybe they WANT to see the landing page.
            Let's redirect for now as per plan. */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* Protected App Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/company/:ticker" element={<CompanyDetail />} />
        <Route path="/flags" element={<Flags />} />
        <Route path="/portfolio" element={<PortfolioDashboard />} />
        <Route path="/portfolio/:id" element={<PortfolioDashboard />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

/* ── App ── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

