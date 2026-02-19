import { useState } from "react";
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/public/PublicNavbar";
import Footer from "../components/public/Footer";
import LoginModal from "../components/auth/LoginModal";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
    const { user } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState("login");

    const openAuthModal = (mode = "login") => {
        setAuthModalMode(mode);
        setIsAuthModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 relative">
            <PublicNavbar onOpenAuthModal={openAuthModal} />
            <main className="flex-grow pt-16 md:pt-16">
                <Outlet context={{ onOpenAuthModal: openAuthModal }} />
            </main>
            <Footer />

            <LoginModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        </div>
    );
}
