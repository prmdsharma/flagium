import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

export default function PortfolioDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Create / Setup State
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");

    // Add Stock State
    const [showAddStock, setShowAddStock] = useState(false);
    const [tickerInput, setTickerInput] = useState("");

    // Autocomplete State
    const [allCompanies, setAllCompanies] = useState([]);
    const [filteredCompanies, setFilteredCompanies] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    useEffect(() => {
        // Load companies for autocomplete once
        api.getCompanies()
            .then(res => setAllCompanies(res.companies || []))
            .catch(err => console.error("Failed to load companies", err));
    }, []);

    // Load Data when ID changes
    useEffect(() => {
        if (id) {
            loadDetail(id);
        } else {
            // Check if user has portfolios
            api.getPortfolios().then(res => {
                if (Array.isArray(res) && res.length > 0) {
                    navigate(`/portfolio/${res[0].id}`, { replace: true });
                } else {
                    setData(null);
                }
            }).catch(() => setData(null));
        }
    }, [id, navigate]);

    const loadDetail = async (portfolioId) => {
        setLoading(true);
        try {
            const d = await api.getPortfolioDetail(portfolioId);
            setData(d);
        } catch (e) {
            console.error("Failed to load portfolio detail", e);
            // Optionally redirect to root or show error
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        if (tickerInput.length < 1) {
            setFilteredCompanies([]);
            setShowDropdown(false);
            return;
        }

        const needle = tickerInput.toLowerCase();
        const matches = allCompanies.filter(c =>
            c.ticker.toLowerCase().includes(needle) ||
            c.name.toLowerCase().includes(needle)
        ).slice(0, 8); // Top 8 matches

        setFilteredCompanies(matches);
        setShowDropdown(matches.length > 0);
    }, [tickerInput, allCompanies]);

    const selectCompany = (ticker) => {
        setTickerInput(ticker);
        setShowDropdown(false);
    };

    const handleCreate = async () => {
        if (!newName) return;
        try {
            await api.createPortfolio(newName);
            setNewName("");
            setShowCreate(false);
            // Force reload to refresh sidebar
            window.location.reload();
        } catch (e) {
            alert("Failed to create portfolio: " + e.message);
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        if (!tickerInput) return;
        try {
            await api.addPortfolioItem(id, tickerInput.toUpperCase());
            setTickerInput("");
            setShowAddStock(false);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Failed to add stock: " + err.message);
        }
    };

    const handleRemoveStock = async (ticker) => {
        if (!window.confirm(`Are you sure you want to remove ${ticker} from this portfolio?`)) return;
        try {
            await api.removePortfolioItem(id, ticker);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Failed to remove stock: " + err.message);
        }
    };

    const handleDeletePortfolio = async () => {
        if (!window.confirm("Are you sure you want to DELETE this portfolio permanently? This action cannot be undone.")) return;
        try {
            await api.deletePortfolio(id);
            navigate('/');
            // Force reload to update sidebar
            setTimeout(() => window.location.reload(), 100);
        } catch (err) {
            alert("Failed to delete portfolio: " + err.message);
        }
    };

    // ── RENDER ──

    // 1. Loading
    if (loading) return <div className="loading">Loading Risk Terminal...</div>;

    // 2. No Selection (Library / Zero State)
    if (!id || !data) {
        return (
            <div className="portfolio-empty-state">
                <div className="login-card" style={{ textAlign: 'center', width: 450 }}>
                    <h1 style={{ fontSize: 24, marginBottom: 10 }}>Portfolio Intelligence</h1>
                    <p style={{ marginBottom: 30, color: 'var(--text-secondary)' }}>
                        Select a portfolio from the sidebar or initialize a new one.
                    </p>

                    <div className="form-group">
                        <label>Create New Portfolio</label>
                        <input
                            className="mono-input"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. High Growth Tech"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button className="login-btn" onClick={handleCreate} style={{ width: '100%' }}>
                        Initialize Portfolio
                    </button>
                </div>
            </div>
        );
    }

    // 3. Detail View
    return (
        <div className="portfolio-dashboard animate-enter">
            {/* [A] PAGE HEADER (Identity & Actions) */}
            <div className="page-header-container" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'end', padding: '0 8px' }}>
                <div className="header-left">
                    <h1 className="page-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{data.name}</h1>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {data.holdings.length} Holdings • Q3 FY25 Strategy
                    </div>
                </div>
                <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-sm-text text-red"
                        onClick={handleDeletePortfolio}
                        style={{ color: '#EF4444', border: '1px solid #FECACA', background: '#FEF2F2' }}
                    >
                        Delete Portfolio
                    </button>
                    <button className="btn-sm-solid" onClick={() => setShowAddStock(true)}>+ Add Stock</button>
                </div>
            </div>

            {/* [B] RISK INTELLIGENCE CARD (Pure Data) */}
            <div className="exec-section" style={{ marginBottom: '48px' }}>
                <div className="exec-card exec-hero" style={{ padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* LEFT: Risk Score Anchor */}
                    <div className="hero-left" style={{ flex: 1 }}>
                        <div className="hero-score-wrapper">
                            <span className="hero-score-val">{data.risk_score}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="hero-score-label" style={{ color: data.risk_score < 30 ? '#10B981' : data.risk_score < 70 ? '#F59E0B' : '#EF4444', marginBottom: 0 }}>
                                    {data.risk_score < 30 ? 'Low Risk' : data.risk_score < 70 ? 'Moderate Risk' : 'High Risk'}
                                </span>
                                <span className="hero-sub-metric" style={{ fontSize: '13px' }}>
                                    Escalation Probability: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>28%</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Metrics (No Actions) */}
                    <div className="hero-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '48px' }}>
                        <div className="stat-row">
                            <span className="metric-label">QoQ Change</span>
                            <span className={`stat-val ${data.risk_delta > 0 ? 'red' : 'green'}`}>
                                {data.risk_delta > 0 ? "+" : ""}{data.risk_delta}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="metric-label">Risk Momentum</span>
                            <span className="stat-val" style={{ color: '#F59E0B' }}>Moderate Acceleration</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* [C] Escalation Alerts (Now Clickable) */}
            <div className="exec-section">
                <h3 className="section-title">Escalation Events</h3>
                <div className="exec-feed">
                    {data.escalations.length === 0 ? <div className="text-muted">No active alerts</div> :
                        data.escalations.map((a, idx) => (
                            <div
                                key={idx}
                                className={`exec-alert ${a.severity.toLowerCase()} hover-lift`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/company/${a.ticker}`)}
                            >
                                <div className="alert-ticker">{a.ticker}</div>
                                <div className="alert-issue">{a.flag || a.issue}</div>
                                <div className="alert-meta">{a.date}</div>
                            </div>
                        ))
                    }
                </div>
            </div>

            {/* [C.1] Risk Trajectory (Separate Section - Fixed) */}
            <div className="exec-section" style={{ marginBottom: '48px' }}>
                <div className="pf-grid-12">
                    <div className="col-12">
                        <h3 className="section-title">Risk Trajectory</h3>
                        <div className="exec-card hover-lift" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Acceleration Detected</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    Portfolio risk has increased for 2 consecutive quarters.
                                </div>
                            </div>
                            {/* FIX: Added display layout to container for spark-bars */}
                            <div className="hero-chart-container" style={{ width: '60%', height: '64px', marginBottom: 0, display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                                <div className="spark-bar" style={{ height: '30%' }}></div>
                                <div className="spark-bar" style={{ height: '40%' }}></div>
                                <div className="spark-bar" style={{ height: '35%' }}></div>
                                <div className="spark-bar" style={{ height: '50%' }}></div>
                                <div className="spark-bar" style={{ height: '60%' }}></div>
                                <div className="spark-bar" style={{ height: '45%' }}></div>
                                <div className="spark-bar" style={{ height: '55%' }}></div>
                                <div className="spark-bar" style={{ height: '70%' }}></div>
                                <div className="spark-bar active" style={{ height: '85%', width: '16px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* [C] Risk Heatmap (Full Width) */}
            <div className="exec-section">
                <h3 className="section-title">Risk Heatmap</h3>
                {data.holdings.length === 0 ? (
                    <div className="zero-state-card">
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <h3>Start Monitoring Your Portfolio</h3>
                        <p>Add your first stock to get real-time risk intelligence.</p>
                        <button className="zero-btn-lg" onClick={() => setShowAddStock(true)}>+ Add First Stock</button>
                    </div>
                ) : (
                    <div className="exec-card hover-lift heatmap-scroll-container">
                        <table className="exec-table">
                            <thead>
                                <tr>
                                    <th>COMPANY</th>
                                    <th>RISK SCORE</th>
                                    <th>SIGNALS</th>
                                    <th style={{ textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.holdings.sort((a, b) => b.risk_score - a.risk_score).map(h => (
                                    <tr key={h.ticker} style={{ cursor: 'pointer' }} onClick={() => navigate(`/company/${h.ticker}`)}>
                                        <td className="row-company">
                                            <span className="row-ticker">{h.ticker}</span>
                                            <span className="row-name">{h.name}</span>
                                        </td>
                                        <td className="row-score">
                                            <span className="score-big">{h.risk_score}</span>
                                            <span className={`score-delta ${h.risk_delta > 0 ? 'text-red' : 'text-green'}`}>
                                                {h.risk_delta > 0 ? "+" : ""}{h.risk_delta} QoQ
                                            </span>
                                        </td>
                                        <td className="row-meta">
                                            <div style={{ fontWeight: 500 }}>{h.active_flags} Active Signals</div>
                                            <div>Primary: {h.primary_driver}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                            <button
                                                className="btn-icon-danger"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveStock(h.ticker); }}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* [D] Domain Exposure (Full Width - Phase 3.13) */}
            <div className="exec-section">
                <div className="pf-grid-12">
                    <div className="col-12">
                        <h3 className="section-title">Domain Exposure</h3>
                        <div className="exec-card hover-lift" style={{ padding: '24px' }}>
                            {data.concentration.length === 0 ? <div className="text-muted">No data</div> :
                                // Render as a grid of exposures for full width utilization
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 48px' }}>
                                    {data.concentration.map(c => (
                                        <div key={c.driver} className="exec-exposure-row" style={{ marginBottom: 0 }}>
                                            <div className="exec-exposure-label">
                                                <span>{c.driver}</span>
                                                <span>{c.percent}%</span>
                                            </div>
                                            <div className="exec-bar-bg">
                                                <div className="exec-bar-fill" style={{ width: `${c.percent}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Stock Modal */}
            {showAddStock && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Stock to Portfolio</h3>
                        <form onSubmit={handleAddStock} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    autoFocus
                                    className="mono-input"
                                    placeholder="Ticker (e.g. RELIANCE) or Name"
                                    value={tickerInput}
                                    onChange={e => setTickerInput(e.target.value)}
                                    style={{ width: '100%', margin: '20px 0' }}
                                />
                                {showDropdown && (
                                    <div className="autocomplete-dropdown">
                                        {filteredCompanies.map(c => (
                                            <div
                                                key={c.id}
                                                className="autocomplete-item"
                                                onClick={() => selectCompany(c.ticker)}
                                            >
                                                <span className="autocomplete-ticker">{c.ticker}</span>
                                                <span className="autocomplete-name">{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-sm-text" onClick={() => setShowAddStock(false)}>Cancel</button>
                                <button type="submit" className="btn-sm-solid">Add Company</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
