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
                    <img src="/favicon.png" alt="Flagium AI" className="w-8 h-8 rounded-lg" />
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
                <div className="hidden md:flex items-center gap-4 relative">
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
                        <div className="relative group">
                            <button className="flex items-center gap-2 h-9 pl-3 pr-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-slate-900/10 outline-none">
                                <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="max-w-[100px] truncate">{user.full_name}</span>
                                <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                    <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                                <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    Dashboard
                                </Link>
                                <Link to="/portfolios" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    Portfolios
                                </Link>
                                <Link to="/companies" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    Market Monitor
                                </Link>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("flagium_token");
                                        window.location.href = "/";
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium text-left"
                                >
                                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
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
                            <>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full h-11 bg-slate-50 text-slate-700 font-medium rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/portfolios"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full h-11 bg-slate-50 text-slate-700 font-medium rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
                                >
                                    Portfolios
                                </Link>
                                <Link
                                    to="/companies"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full h-11 bg-slate-50 text-slate-700 font-medium rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-200"
                                >
                                    Market Monitor
                                </Link>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("flagium_token");
                                        window.location.href = "/";
                                    }}
                                    className="w-full h-11 bg-red-50 text-red-600 font-medium rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100"
                                >
                                    Sign Out
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
