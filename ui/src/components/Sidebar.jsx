import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import logoIcon from "../assets/logo-icon.png";

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [portfolios, setPortfolios] = useState([]);
    const [isPortfolioOpen, setIsPortfolioOpen] = useState(true); // Default open

    useEffect(() => {
        // Fetch portfolios for the sidebar list
        api.getPortfolios().then((data) => {
            setPortfolios(data);
        }).catch(err => console.error("Failed to load portfolios for sidebar", err));
    }, []);

    // Auto-expand if on a portfolio route
    useEffect(() => {
        if (location.pathname.startsWith('/portfolio')) {
            setIsPortfolioOpen(true);
        }
    }, [location.pathname]);

    const handleCreateNew = () => {
        navigate('/portfolio');
        onClose && onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="sidebar-brand">
                <img src={logoIcon} alt="Flagium" className="brand-logo" />
                <span>Flagium</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end onClick={onClose}>
                    <span className="icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/companies" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
                    <span className="icon">🏢</span> Companies
                </NavLink>

                {/* Portfolio Accordion */}
                <div className="nav-group">
                    <div className="nav-accordion-trigger" onClick={() => setIsPortfolioOpen(!isPortfolioOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="icon">💼</span> Portfolio
                        </div>
                        <span className={`chevron ${isPortfolioOpen ? 'open' : ''}`}>›</span>
                    </div>

                    {isPortfolioOpen && (
                        <div className="nav-accordion-content">
                            {portfolios.map(p => (
                                <NavLink
                                    key={p.id}
                                    to={`/portfolio/${p.id}`}
                                    className={({ isActive }) => `nav-link sub-link ${isActive ? "active" : ""}`}
                                    onClick={onClose}
                                >
                                    {/* NO ICON HERE per requirement */}
                                    {p.name}
                                </NavLink>
                            ))}
                            <div className="nav-link sub-link create-btn" onClick={handleCreateNew}>
                                {/* NO ICON HERE per requirement, just text */}
                                + Create New
                            </div>
                        </div>
                    )}
                </div>

                <NavLink to="/flags" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={onClose}>
                    <span className="icon">📋</span> Flag Library
                </NavLink>
            </nav>
            {/* Removed Logout and Theme Toggle */}
        </aside>
    );
}
