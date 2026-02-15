import { Outlet, Navigate } from "react-router-dom";
import GlobalHeader from "../components/GlobalHeader";
import AppFooter from "../components/common/AppFooter";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
    const { user } = useAuth();

    // Protect the route
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col">
            {/* GlobalHeader (Fixed 64px height) */}
            <GlobalHeader />

            {/* Main Content (Offset by Header height) */}
            <main className="flex-1 px-8 pb-8 pt-24">
                <div className="max-w-[1280px] mx-auto w-full">
                    <Outlet />
                </div>
            </main>
            <AppFooter />
        </div>
    );
}
