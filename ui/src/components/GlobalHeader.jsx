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

    // Mock Notifications (Replace with API/Context later)
    useEffect(() => {
        if (!user) return;

        const mockNotifications = [
            {
                id: 1,
                title: "Critical Risk Alert",
                message: "TATASTEEL crossed 'Default Probability' threshold.",
                timeAgo: "2 hours ago",
                severity: "CRITICAL",
                read: false,
                link: "/company/TATASTEEL",
                company: "TATASTEEL"
            },
            {
                id: 2,
                title: "New Deterioration",
                message: "RELIANCE showing early signs of 'Governance' flag.",
                timeAgo: "5 hours ago",
                severity: "HIGH",
                read: false,
                link: "/company/RELIANCE",
                company: "RELIANCE"
            },
            {
                id: 3,
                title: "Portfolio Update",
                message: "Your 'High Growth Tech' portfolio risk score increased by +1.2.",
                timeAgo: "1 day ago",
                severity: "MEDIUM",
                read: true,
                link: "/portfolio",
                company: null
            }
        ];

        // Load read state from localStorage
        const readIds = JSON.parse(localStorage.getItem("flagium_read_notifications") || "[]");
        const updatedNotifs = mockNotifications.map(n => ({
            ...n,
            read: n.read || readIds.includes(n.id)
        }));

        setNotifications(updatedNotifs);
        setUnreadCount(updatedNotifs.filter(n => !n.read).length);

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

    return (
        <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 left-0 right-0 z-40 transition-colors duration-200">
            <div className="max-w-[1280px] mx-auto px-8 h-16 flex items-center justify-between">

                {/* Left: Brand + Navigation */}
                <div className="flex items-center gap-12">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-colors">
                            F
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Flagium</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Market Risk Monitor (Beta)
                        </Link>

                        {/* Portfolios Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPortfolioMenu(!showPortfolioMenu)}
                                className={`text-sm font-medium transition-colors flex items-center gap-1 ${location.pathname.startsWith('/portfolio') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                Portfolios
                                <span className="text-[10px]">▼</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showPortfolioMenu && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowPortfolioMenu(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                        {portfolios.map(p => (
                                            <Link
                                                key={p.id}
                                                to={`/portfolio/${p.id}`}
                                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                                                onClick={() => setShowPortfolioMenu(false)}
                                            >
                                                {p.name}
                                            </Link>
                                        ))}
                                        <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                                        <Link
                                            to="/portfolio"
                                            className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                                            onClick={() => setShowPortfolioMenu(false)}
                                        >
                                            + Create New
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        <Link
                            to="/companies"
                            className={`text-sm font-medium transition-colors ${isActive('/companies') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Companies
                        </Link>
                        <Link
                            to="/flags"
                            className={`text-sm font-medium transition-colors ${isActive('/flags') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Flag Library
                        </Link>

                        {/* Admin Reports Link - Moved to End */}
                        {user?.role === 'admin' && (
                            <Link
                                to="/reports"
                                className={`text-sm font-medium transition-colors ${location.pathname === '/reports' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                Reports
                            </Link>
                        )}
                    </nav>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
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

                    <div className="relative ml-2">
                        <button className="avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)} title={user ? "User Menu" : "Login"}>
                            {user ? "👤" : "🔑"}
                        </button>

                        {showUserMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
        </header >
    );
}
