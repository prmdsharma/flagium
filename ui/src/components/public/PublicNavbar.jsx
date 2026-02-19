import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PublicNavbar({ onOpenAuthModal }) {
    const { user } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { path: "/about", label: "About" },
        { path: "/methodology", label: "Methodology" },
    ];

    return (
        <nav className="w-full bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-blue-600 transition-colors">
                        F
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-900">Flagium AI</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors ${isActive(link.path) ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user && (
                        <Link
                            to="/dashboard"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Desktop Auth Actions */}
                <div className="hidden md:flex items-center gap-4">
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

            {/* Mobile Navigation Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
                    {navLinks.map(link => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block text-base font-medium transition-colors ${isActive(link.path) ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user && (
                        <Link
                            to="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className="block text-base font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Dashboard
                        </Link>
                    )}
                    <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                        {!user ? (
                            <>
                                <button
                                    onClick={() => {
                                        onOpenAuthModal("login");
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full h-11 border border-gray-200 text-slate-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={() => {
                                        onOpenAuthModal("register");
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full h-11 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Create Account
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="w-full h-11 bg-slate-900 text-white font-medium rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
                            >
                                Go to Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
