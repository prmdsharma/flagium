import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar({ onOpenAuthModal }) {
    const { user } = useAuth();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    return (
        <nav className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-blue-600 transition-colors">
                        F
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Flagium</span>
                </Link>

                {/* Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        to="/about"
                        className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        About
                    </Link>
                    <Link
                        to="/methodology"
                        className={`text-sm font-medium transition-colors ${isActive('/methodology') ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Methodology
                    </Link>
                    {user && (
                        <Link
                            to="/dashboard"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Auth Actions */}
                <div className="flex items-center gap-4">
                    {!user ? (
                        <>
                            <button
                                onClick={() => onOpenAuthModal("login")}
                                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => onOpenAuthModal("register")}
                                className="h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg flex items-center hover:bg-slate-800 transition-colors"
                            >
                                Create Account
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/dashboard"
                            className="h-9 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg flex items-center hover:bg-slate-800 transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
