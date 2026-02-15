import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function GlobalHeader() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="global-header">
            {/* Left: Branding or Breadcrumbs */}
            <div className="gh-left">
                {!user ? <span className="gh-brand-text">Flagium</span> : <span className="gh-breadcrumb">Portfolio / Dashboard</span>}
            </div>

            {/* Center: Welcome Message */}
            <div className="gh-center">
                {user ? (
                    <span className="welcome-msg">Welcome back, {user.full_name?.split(' ')[0] || "User"} 👋</span>
                ) : (
                    <span className="welcome-msg">Welcome to Flagium Intelligence</span>
                )}
            </div>

            {/* Right: Global Controls */}
            <div className="gh-right">
                <button className="icon-btn" title="Notifications">
                    🔔
                </button>
                <button className="icon-btn" title="Settings">
                    ⚙
                </button>
                <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    {theme === 'dark' ? "☀️" : "🌙"}
                </button>

                <div className="user-menu-wrapper">
                    <button className="avatar-btn" onClick={() => setShowUserMenu(!showUserMenu)} title={user ? "User Menu" : "Login"}>
                        {user ? "👤" : "🔑"}
                    </button>

                    {showUserMenu && (
                        <>
                            <div className="menu-backdrop" onClick={() => setShowUserMenu(false)} />
                            <div className="user-dropdown">
                                {user ? (
                                    <>
                                        <div className="ud-header">
                                            <div className="ud-name">{user.full_name}</div>
                                            <div className="ud-email">{user.email}</div>
                                        </div>
                                        <div className="ud-divider" />
                                        <div className="ud-item">Profile</div>
                                        <div className="ud-item">Account Settings</div>
                                        <div className="ud-item">Billing</div>
                                        <div className="ud-divider" />
                                        <div className="ud-item text-red" onClick={handleLogout}>Logout</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="ud-item" onClick={() => navigate("/login")}>Login</div>
                                        <div className="ud-item" onClick={() => navigate("/login")}>Register</div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
