import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

import ConfirmModal from "../components/common/ConfirmModal";

export default function PortfolioDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Refs
    const autocompleteRef = useRef(null);

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

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        confirmText: "Confirm",
        isDanger: false
    });

    // Handle Click Outside & Escape
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

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
        setShowDropdown(true); // Always show dropdown if we have input
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

    const handleRemoveStock = (ticker) => {
        setConfirmModal({
            isOpen: true,
            title: `Remove ${ticker}?`,
            message: "This stock will be removed from your portfolio tracking.",
            confirmText: "Remove Stock",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.removePortfolioItem(id, ticker);
                    loadDetail(id); // Refresh
                } catch (err) {
                    alert("Failed to remove stock: " + err.message);
                }
            }
        });
    };

    const handleDeletePortfolio = () => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Portfolio?",
            message: "This action cannot be undone. All holdings and history will be permanently deleted.",
            confirmText: "Delete Permanently",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.deletePortfolio(id);
                    navigate('/');
                    // Force reload to update sidebar
                    setTimeout(() => window.location.reload(), 100);
                } catch (err) {
                    alert("Failed to delete portfolio: " + err.message);
                }
            }
        });
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

            {/* Modals */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />


            {/* Add Stock Modal - Refactored to match design system */}
            {showAddStock && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-enter">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-700 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Stock to Portfolio</h3>
                            <button
                                onClick={() => setShowAddStock(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddStock} className="flex flex-col gap-4">
                            <div className="relative" ref={autocompleteRef}>
                                <input
                                    autoFocus
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                                    placeholder="Ticker (e.g. RELIANCE)"
                                    value={tickerInput}
                                    onChange={e => setTickerInput(e.target.value)}
                                    onFocus={() => { if (tickerInput.length >= 1) setShowDropdown(true); }}
                                />
                                {showDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                    onClick={() => selectCompany(c.ticker)}
                                                >
                                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{c.ticker}</span>
                                                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{c.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center italic">
                                                No companies found matching "{tickerInput}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    onClick={() => setShowAddStock(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                                >
                                    Add Company
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
