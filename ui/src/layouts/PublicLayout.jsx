import { useState } from "react";
import { Outlet } from "react-router-dom";
import GlobalHeader from "../components/GlobalHeader";
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
        <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200 flex flex-col font-sans text-slate-900 relative">
            {user ? (
                <GlobalHeader />
            ) : (
                <PublicNavbar onOpenAuthModal={openAuthModal} />
            )}

            <main className={`flex-grow ${user ? 'pt-24 px-8' : 'pt-16'}`}>
                {user ? (
                    <div className="max-w-[1280px] mx-auto w-full">
                        <Outlet context={{ onOpenAuthModal: openAuthModal }} />
                    </div>
                ) : (
                    <Outlet context={{ onOpenAuthModal: openAuthModal }} />
                )}
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
