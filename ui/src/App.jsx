import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, createContext, useContext } from "react";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Flags from "./pages/Flags";
import LoginPage from "./pages/LoginPage";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import Sidebar from "./components/Sidebar";
import GlobalHeader from "./components/GlobalHeader";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { api } from "./api";
import "./index.css";

/* ── App Content (Inner) to access Context ── */
function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className={isAuthPage ? "app-auth" : "app-shell"}>
      {!isAuthPage && <GlobalHeader />}

      <div className={isAuthPage ? "auth-body" : "app-body"}>
        {!isAuthPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        <main className={isAuthPage ? "content-full" : "content"}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/company/:ticker" element={<CompanyDetail />} />
            <Route path="/flags" element={<Flags />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/portfolio" element={<PortfolioDashboard />} />
            <Route path="/portfolio/:id" element={<PortfolioDashboard />} />
          </Routes>
        </main>
      </div>
    </div>
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
