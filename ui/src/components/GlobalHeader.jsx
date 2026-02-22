import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./notifications/NotificationBell";
import NotificationDropdown from "./notifications/NotificationDropdown";

export default function GlobalHeader() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showPortfolioMenu, setShowPortfolioMenu] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobilePortfolioOpen, setIsMobilePortfolioOpen] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [portfolios, setPortfolios] = useState([]);

    // Fetch Portfolios
    useEffect(() => {
        if (user) {
            import("../api").then(({ api }) => {
                api.getPortfolios().then(setPortfolios).catch(console.error);
            });
        }
    }, [user]);

    // Real Notifications
    useEffect(() => {
        if (!user) return;

        import("../api").then(({ api }) => {
            api.getFlags({ user_only: true })
                .then(data => {
                    const realNotifications = data.flags.map(f => ({
                        id: `${f.ticker}-${f.flag_code}-${f.fiscal_year}-${f.fiscal_quarter}`,
                        title: f.severity === 'HIGH' ? "High Risk Alert" : "Risk Signal",
                        message: f.message,
                        timeAgo: f.created_at ? new Date(f.created_at).toLocaleDateString() : "Recently",
                        severity: f.severity,
                        read: false,
                        link: `/company/${f.ticker}`,
                        company: f.ticker
                    }));

                    // Load read state from localStorage
                    const readIds = JSON.parse(localStorage.getItem("flagium_read_notifications") || "[]");
                    const updatedNotifs = realNotifications.map(n => ({
                        ...n,
                        read: readIds.includes(n.id)
                    }));

                    setNotifications(updatedNotifs);
                    setUnreadCount(updatedNotifs.filter(n => !n.read).length);
                })
                .catch(console.error);
        });
    }, [user]);

    const handleMarkAllRead = () => {
        const allIds = notifications.map(n => n.id);
        localStorage.setItem("flagium_read_notifications", JSON.stringify(allIds));

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
        if (showUserMenu) setShowUserMenu(false);
        if (showPortfolioMenu) setShowPortfolioMenu(false);
    }

    const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    const navLinks = [
        { name: "Dashboard", path: "/dashboard", type: "link" },
        { name: "Portfolios", path: "/portfolio", type: "dropdown" },
        { name: "Market Risk Monitor (Beta)", path: "/market-monitor", type: "link" },
        { name: "Companies", path: "/companies", type: "link" },
        { name: "Flag Library", path: "/flags", type: "link" },
    ];

    if (user?.role === 'admin') {
        navLinks.push({ name: "Reports", path: "/reports", type: "link" });
    }

    return (
        <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-40 transition-colors duration-200">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">

                {/* Left: Brand + Desktop Navigation */}
                <div className="flex items-center gap-4 md:gap-12">
                    {/* Hamburger (Mobile) */}
                    <button
                        className="p-2 -ml-2 text-slate-600 dark:text-slate-400 md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img src="/favicon.png" alt="Flagium AI" className="w-8 h-8 rounded-lg" />
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden sm:inline-block">Flagium AI</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            link.type === "dropdown" ? (
                                <div key={link.name} className="relative">
                                    <button
                                        onClick={() => setShowPortfolioMenu(!showPortfolioMenu)}
                                        className={`text-sm font-medium transition-colors flex items-center gap-1 ${location.pathname.startsWith('/portfolio') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        {link.name}
                                        <span className="text-[10px]">▼</span>
                                    </button>

                                    {showPortfolioMenu && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setShowPortfolioMenu(false)} />
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-40">
                                                {portfolios.length > 0 ? (
                                                    portfolios.map(p => (
                                                        <Link
                                                            key={p.id}
                                                            to={`/portfolio/${p.id}`}
                                                            className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                                                            onClick={() => setShowPortfolioMenu(false)}
                                                        >
                                                            {p.name}
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">No portfolios yet</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-sm font-medium transition-colors ${isActive(link.path) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Notifications */}
                    <div className="relative">
                        <NotificationBell
                            count={unreadCount}
                            onClick={handleNotificationClick}
                            isOpen={showNotifications}
                        />
                        <NotificationDropdown
                            isOpen={showNotifications}
                            onClose={() => setShowNotifications(false)}
                            notifications={notifications}
                            onMarkAllRead={handleMarkAllRead}
                        />
                    </div>


                    <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {theme === 'dark' ? "☀️" : "🌙"}
                    </button>

                    <div className="relative ml-1">
                        <button className="avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)} title={user ? "User Menu" : "Login"}>
                            {user ? "👤" : "🔑"}
                        </button>

                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.full_name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                                            </div>
                                            <div className="py-1">
                                                <div
                                                    className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                                    onClick={() => { navigate("/profile"); setShowUserMenu(false); }}
                                                >
                                                    Profile
                                                </div>

                                            </div>
                                            <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                                                <div className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer" onClick={handleLogout}>Logout</div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-1">
                                            <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer" onClick={() => navigate("/login")}>Login</div>
                                            <div className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer" onClick={() => navigate("/login")}>Register</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Sidebar/Overlay */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed top-16 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="flex-grow overflow-y-auto py-6 px-4">
                            <nav className="flex flex-col gap-1">
                                {navLinks.map((link) => (
                                    link.type === "dropdown" ? (
                                        <div key={link.name} className="flex flex-col">
                                            <button
                                                onClick={() => setIsMobilePortfolioOpen(!isMobilePortfolioOpen)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/portfolio') ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-5 h-5 flex items-center justify-center">📁</span>
                                                    {link.name}
                                                </div>
                                                <span className={`transform transition-transform ${isMobilePortfolioOpen ? 'rotate-180' : ''}`}>▼</span>
                                            </button>

                                            {isMobilePortfolioOpen && (
                                                <div className="ml-8 mt-1 flex flex-col gap-1 border-l border-slate-100 dark:border-slate-800 pl-4">
                                                    {portfolios.length > 0 ? (
                                                        portfolios.map(p => (
                                                            <Link
                                                                key={p.id}
                                                                to={`/portfolio/${p.id}`}
                                                                className={`block px-4 py-2 text-sm rounded-md transition-colors ${location.pathname === `/portfolio/${p.id}` ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                {p.name}
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 italic">No portfolios yet</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            key={link.name}
                                            to={link.path}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <span className="w-5 h-5 flex items-center justify-center">
                                                {link.name === 'Dashboard' && '📊'}
                                                {link.name === 'Market Risk Monitor (Beta)' && '🌎'}
                                                {link.name === 'Companies' && '🏢'}
                                                {link.name === 'Flag Library' && '📚'}
                                                {link.name === 'Reports' && '📝'}
                                            </span>
                                            {link.name}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </div>

                        {/* Mobile Footer Area (Static bottom items) */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            {user && (
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
                                            👤
                                        </div>
                                        <div className="text-xs">
                                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{user.full_name}</div>
                                            <div className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-md"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}

                            <div className="text-[10px] text-slate-400 dark:text-slate-600 text-center uppercase tracking-widest font-bold">
                                Flagium AI • v1.0.0
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header >
    );
}
