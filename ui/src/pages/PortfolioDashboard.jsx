import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Tooltip from "../components/common/Tooltip";

import ConfirmModal from "../components/common/ConfirmModal";

export default function PortfolioDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const isCreatingNew = queryParams.get('new') === 'true';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Phase 2: Clarity States
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

    // Refs
    const autocompleteRef = useRef(null);
    const moreMenuRef = useRef(null);
    const fileInputRef = useRef(null);

    // More Menu State
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Rename State
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const renameInputRef = useRef(null);

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
    const [uploadResult, setUploadResult] = useState(null);

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
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowDropdown(false);
                setShowMoreMenu(false);
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
        } else if (isCreatingNew) {
            setData(null);
            setError(null);
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
    }, [id, navigate, isCreatingNew]);

    // Check for Zerodha Redirect
    useEffect(() => {
        const requestToken = queryParams.get('request_token');
        if (requestToken && id) {
            handleZerodhaSync(requestToken);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [id, location]);

    const handleZerodhaSync = async (token) => {
        setLoading(true);
        try {
            const res = await api.syncZerodhaPortfolio(id, token);
            setUploadResult(res);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Broker sync failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadDetail = async (portfolioId) => {
        setLoading(true);
        setError(null);
        try {
            const d = await api.getPortfolioDetail(portfolioId);
            setData(d);
        } catch (e) {
            console.error("Failed to load portfolio detail", e);
            setError(e.message);
            setData(null);
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
        ).sort((a, b) => {
            const aTicker = a.ticker.toLowerCase();
            const bTicker = b.ticker.toLowerCase();
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            // 1. Exact ticker match
            if (aTicker === needle) return -1;
            if (bTicker === needle) return 1;

            // 2. Ticker startsWith match
            const aTickerStarts = aTicker.startsWith(needle);
            const bTickerStarts = bTicker.startsWith(needle);
            if (aTickerStarts && !bTickerStarts) return -1;
            if (!aTickerStarts && bTickerStarts) return 1;
            if (aTickerStarts && bTickerStarts) {
                return aTicker.localeCompare(bTicker); // Alphabetical tie-break
            }

            // 3. Name startsWith match
            const aNameStarts = aName.startsWith(needle);
            const bNameStarts = bName.startsWith(needle);
            if (aNameStarts && !bNameStarts) return -1;
            if (!aNameStarts && bNameStarts) return 1;
            if (aNameStarts && bNameStarts) {
                return aName.localeCompare(bName); // Alphabetical tie-break
            }

            // 4. Fallback to localeCompare
            return aTicker.localeCompare(bTicker);
        }).slice(0, 12); // Increased limit for better visibility

        setFilteredCompanies(matches);
        setShowDropdown(true); // Always show dropdown if we have input
    }, [tickerInput, allCompanies]);

    const selectCompany = async (ticker) => {
        setTickerInput(ticker);
        setShowDropdown(false);

        // Auto-add the stock to the portfolio to reduce click friction
        try {
            await api.addPortfolioItem(id, ticker.toUpperCase());
            setTickerInput("");
            setShowAddStock(false);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Failed to add stock: " + err.message);
        }
    };

    const handleCreate = async () => {
        if (!newName) return;
        try {
            const res = await api.createPortfolio(newName);
            setNewName("");
            setShowCreate(false);
            // Navigate to the new portfolio
            navigate(`/portfolio/${res.id}`);
        } catch (e) {
            alert("Failed to create portfolio: " + e.message);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const res = await api.uploadPortfolioCsv(id, file);
            setUploadResult(res);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
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

    const handleUpdateInvestment = async (ticker, newInv) => {
        try {
            await api.updatePortfolioItem(id, ticker, newInv);
            loadDetail(id); // Refresh
        } catch (err) {
            alert("Failed to update investment: " + err.message);
        }
    };

    const handleDeletePortfolio = async () => {
        if (!id) return;
        setConfirmModal({
            isOpen: true,
            title: "Delete Portfolio?",
            message: "This will permanently remove this portfolio and all its contents. This action cannot be undone.",
            confirmText: "Delete Permanently",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await api.deletePortfolio(id);
                    navigate("/portfolio", { replace: true });
                } catch (err) {
                    alert("Failed to delete portfolio: " + err.message);
                }
            }
        });
    };

    const startRename = () => {
        setRenameValue(data?.name || "");
        setIsRenaming(true);
        setShowMoreMenu(false);
        setTimeout(() => renameInputRef.current?.focus(), 50);
    };

    const handleRenamePortfolio = async () => {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === data.name) {
            setIsRenaming(false);
            return;
        }
        try {
            await api.renamePortfolio(id, trimmed);
            setIsRenaming(false);
            loadDetail(id); // Refresh with new name
        } catch (err) {
            alert("Failed to rename portfolio: " + err.message);
        }
    };

    // ── RENDER ──

    // 1. Loading
    if (loading) return <div className="loading">Loading Risk Terminal...</div>;

    // 2. Error or No Selection / Creation Mode
    if (!id || !data || error || isCreatingNew) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-enter">
                <div className="glass-card p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                        {error ? '🔒' : (isCreatingNew ? '📁' : '📊')}
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {error ? 'Access Restricted' : (isCreatingNew ? 'Initialize Portfolio' : 'Portfolio Detail')}
                    </h1>

                    {error ? (
                        <div className="mb-8 text-left">
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                                {error}. Please verify you have ownership of this portfolio.
                            </div>
                            <button
                                className="mt-6 w-full py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                                onClick={() => navigate('/dashboard')}
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {isCreatingNew
                                    ? 'Give your new portfolio a name to start tracking capital risk across your holdings.'
                                    : 'Select a portfolio from the navigation menu or initialize a new one.'}
                            </p>

                            <div className="text-left">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Portfolio Name</label>
                                <input
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none block text-slate-900 dark:text-white transition-all shadow-sm"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. High Growth Tech"
                                />
                            </div>
                            <button
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                onClick={handleCreate}
                            >
                                {isCreatingNew ? 'Initialize Portfolio' : 'Create First Portfolio'}
                            </button>

                            {(isCreatingNew || !id) && (
                                <button
                                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. Detail View
    return (
        <div className="portfolio-dashboard animate-enter">
            {/* [A] PAGE HEADER (Identity & Portfolio-Level Actions) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 md:px-4 mb-6 md:mb-8">
                <div className="header-left">
                    {isRenaming ? (
                        <input
                            ref={renameInputRef}
                            className="rename-input w-full md:w-auto text-xl md:text-2xl font-black bg-transparent border-b-2 border-blue-500 outline-none"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleRenamePortfolio}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenamePortfolio();
                                if (e.key === 'Escape') setIsRenaming(false);
                            }}
                        />
                    ) : (
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">{data.name}</h1>
                    )}
                    <div className="text-xs md:text-sm text-slate-500 mt-1">
                        {data.holdings.length} Holdings • Q3 FY25 Strategy
                    </div>
                </div>
                <div className="header-right" style={{ position: 'relative' }} ref={moreMenuRef}>
                    <button
                        className="btn-icon-more"
                        onClick={() => setShowMoreMenu(prev => !prev)}
                        title="Portfolio options"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <circle cx="10" cy="4" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16" r="1.5" />
                        </svg>
                    </button>
                    {showMoreMenu && (
                        <div className="more-menu-dropdown">
                            <button
                                className="more-menu-item"
                                onClick={startRename}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11.333 2A1.886 1.886 0 0114 4.667l-9 9-3.667 1L2.667 11l9-9z" />
                                </svg>
                                Rename Portfolio
                            </button>
                            <button
                                className="more-menu-item"
                                onClick={() => { setShowMoreMenu(false); setIsGlossaryOpen(true); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="8" cy="8" r="7" /><path d="M8 8v4M8 4h.01" />
                                </svg>
                                Risk Glossary
                            </button>
                            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 8px' }}></div>
                            <button
                                className="more-menu-item more-menu-danger"
                                onClick={() => { setShowMoreMenu(false); handleDeletePortfolio(); }}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                                </svg>
                                Delete Portfolio
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* [B] RISK INTELLIGENCE CARD (Pure Data) */}
            <div className="mb-10 md:mb-12">
                <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50">
                    {/* LEFT: Risk Score Anchor */}
                    <div className="flex-1">
                        <div className="flex items-center gap-4 md:gap-6">
                            <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{data.risk_score}</span>
                            <div className="flex flex-col gap-1">
                                <span className={`text-sm md:text-base font-black uppercase tracking-wider ${data.risk_score < 30 ? 'text-green-500' : data.risk_score < 70 ? 'text-amber-500' : 'text-red-500'}`}>
                                    <Tooltip
                                        label={data.risk_score < 30 ? 'Low Risk' : data.risk_score < 70 ? 'Moderate Risk' : 'High Risk'}
                                        text="A 0-100 index of financial, governance, and momentum stress. Under 30 is Stable; Over 70 is Critical."
                                    />
                                </span>
                                <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    <Tooltip
                                        label="Escalation Probability"
                                        text="AI-estimated probability (0-100%) that this portfolio will drop to a worse risk tier in the next 90 days."
                                    />: <span className="font-bold text-slate-900 dark:text-white">28%</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Metrics (No Actions) */}
                    <div className="flex flex-row md:items-center gap-8 md:gap-12 md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-6 md:pt-0">
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">QoQ Change</span>
                            <span className={`text-xl md:text-2xl font-black ${data.risk_delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {data.risk_delta > 0 ? "+" : ""}{data.risk_delta}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                <Tooltip
                                    label="Risk Momentum"
                                    text="Indicates if the risk is accelerating (getting worse faster), decelerating (stabilizing), or plateauing."
                                />
                            </span>
                            <span className="text-sm md:text-base font-bold text-amber-500 leading-tight">
                                Moderate Acceleration
                                <span className="block text-[10px] text-slate-500 font-medium mt-0.5">Driven by new signals</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* [C.1] Risk Trajectory (Separate Section - Fixed) */}
            <div className="mb-12">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Risk Trajectory</h3>
                <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-12 hover:border-blue-500/50 transition-all group">
                    <div className="flex-1">
                        <div className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-1">Acceleration Detected</div>
                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Portfolio risk has increased for 2 consecutive quarters.
                        </div>
                    </div>
                    {/* FIX: Added display layout to container for spark-bars */}
                    <div className="flex items-end gap-1.5 h-12 md:h-16 w-full md:w-[40%]">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '30%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '40%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '35%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '50%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '60%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '45%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '55%' }}></div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-sm transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: '70%' }}></div>
                        <div className="flex-1 bg-red-500 rounded-t-sm shadow-[0_-4px_12px_-2px_rgba(239,68,68,0.4)]" style={{ height: '85%' }}></div>
                    </div>
                </div>
            </div>

            {/* [C] Escalation Alerts (Grouped & Structured) */}
            <div className="exec-section">
                <h3 className="section-title">Risk Intelligence</h3>
                <div className="flex flex-col gap-4">
                    {data.escalations.length === 0 ? <div className="text-slate-500 italic p-4">No active risk signals.</div> :
                        Object.entries(data.escalations.reduce((acc, curr) => {
                            if (!acc[curr.ticker]) acc[curr.ticker] = [];
                            acc[curr.ticker].push(curr);
                            return acc;
                        }, {})).map(([ticker, signals]) => {
                            // Group by flag within the ticker
                            const flagGroups = signals.reduce((fAcc, curr) => {
                                const key = curr.flag || curr.issue || 'General Risk';
                                if (!fAcc[key]) fAcc[key] = [];
                                fAcc[key].push(curr);
                                return fAcc;
                            }, {});

                            return (
                                <div
                                    key={ticker}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-500 transition-all cursor-pointer shadow-sm group"
                                    onClick={() => navigate(`/company/${ticker}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 text-sm">
                                                {ticker.substring(0, 2)}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                                                    {ticker}
                                                </h4>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                                    {signals.length} Active Signals
                                                </span>
                                            </div>
                                        </div>
                                        <button className="text-xs font-bold text-slate-400 group-hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-1">
                                            Analyze <span className="text-lg">→</span>
                                        </button>
                                    </div>

                                    <div className="space-y-2 pl-[52px]">
                                        {Object.entries(flagGroups).map(([flag, items]) => {
                                            const quarters = items.map(i => i.quarter ? `Q${i.quarter}` : '').filter(Boolean).sort();
                                            const uniqueQuarters = [...new Set(quarters)];
                                            const timeRange = uniqueQuarters.length > 0
                                                ? (uniqueQuarters.length > 1 ? `${uniqueQuarters[0]}–${uniqueQuarters[uniqueQuarters.length - 1]}` : uniqueQuarters[0])
                                                : '';
                                            const year = items[0].year || '';

                                            return (
                                                <div key={flag} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5"></span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {items.length} {flag}
                                                    </span>
                                                    {timeRange && (
                                                        <span className="opacity-60 text-xs">
                                                            ({timeRange} {year})
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {/* Placeholder for 'Risk Jump' if we had the data */}
                                        {/* <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5"></span>
                                            <span className="font-semibold">Risk Jump +40</span>
                                        </div> */}
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>



            {/* [C] Risk Heatmap (Full Width) */}
            <div className="mb-12">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Risk Heatmap</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Broker Sync (Premium) */}
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-lg text-[10px] md:text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-not-allowed transition-all opacity-60"
                                onClick={() => alert("Direct Broker Sync is a Premium Feature coming in V2. For now, please use the CSV Upload below (it's free!).")}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l2 2m-2-2l-2-2" />
                                </svg>
                                Zerodha
                            </button>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-lg text-[10px] md:text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-not-allowed transition-all opacity-60"
                                onClick={() => alert("Direct Broker Sync is a Premium Feature coming in V2. For now, please use the CSV Upload below (it's free!).")}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><path d="M8 12h8m-4-4v8" />
                                </svg>
                                Groww
                            </button>
                        </div>

                        <div className="hidden sm:block w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        {/* CSV Upload (Highlighted) */}
                        <div className="flex flex-col items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".csv"
                                className="hidden"
                            />
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 border border-blue-500"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Sync CSV
                            </button>
                        </div>

                        {/* Manual Add */}
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
                            onClick={() => setShowAddStock(true)}
                        >
                            <span className="text-sm">+</span> Add Stock
                        </button>
                    </div>
                </div>
                {data.holdings.length === 0 ? (
                    <div className="zero-state-card">
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <h3>Start Monitoring Your Portfolio</h3>
                        <p>Add your first stock to get real-time risk intelligence.</p>
                        <button className="zero-btn-lg" onClick={() => setShowAddStock(true)}>+ Add First Stock</button>
                    </div>
                ) : (
                    <div className="glass-card overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">COMPANY</th>
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">SECTOR</th>
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        <Tooltip label="SCORE" text="Individual company risk score derived from quarterly filings." />
                                    </th>
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">
                                        <Tooltip label="FLAGS" text="Total number of unique 'red flags' detected (e.g., Debt Spike)." />
                                    </th>
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">INVESTMENT</th>
                                    <th className="px-4 py-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...data.holdings].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).map(h => (
                                    <tr key={h.ticker} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800/50 last:border-0" onClick={() => navigate(`/company/${h.ticker}`)}>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">{h.ticker}</span>
                                                <span className="text-[10px] text-slate-500 truncate max-w-[100px] md:max-w-none">{h.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{h.sector || "N/A"}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold ${h.risk_score > 60 ? 'bg-red-100 text-red-600' : (h.risk_score > 30 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600')}`}>
                                                {h.risk_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 hidden sm:table-cell">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                🚩 {h.active_flags}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-[10px] font-mono text-slate-500">₹</span>
                                                <input
                                                    id={`inv-${h.ticker}`}
                                                    type="number"
                                                    defaultValue={h.investment || 100000}
                                                    onBlur={(e) => handleUpdateInvestment(h.ticker, parseInt(e.target.value))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.target.blur();
                                                    }}
                                                    className="w-16 md:w-24 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-xs font-mono text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    onClick={() => document.getElementById(`inv-${h.ticker}`)?.focus()}
                                                    title="Update Investment"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    onClick={() => handleRemoveStock(h.ticker)}
                                                    title="Remove from Portfolio"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* [D] Domain Exposure (Full Width - Phase 3.13) */}
            <div className="mb-12">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">
                    <Tooltip label="Domain Exposure" text="Concentration of capital risk mapped to specific drivers (Debt, Growth, etc.)." />
                </h3>
                <div className="glass-card p-6">
                    {data.concentration.length === 0 ? <div className="text-slate-500 italic">No concentration data available</div> :
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-x-12 md:gap-y-6">
                            {data.concentration.map(c => (
                                <div key={c.driver}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">{c.driver}</span>
                                        <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{c.percent}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${c.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
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

            {/* CSV Upload Success/Feedback Modal */}
            {uploadResult && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-enter">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-700 p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                ✅
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Upload Complete</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                Successfully synced <span className="font-bold text-green-600">{uploadResult.success_count}</span> holdings.
                            </p>
                        </div>

                        {uploadResult.failed_tickers && uploadResult.failed_tickers.length > 0 && (
                            <div className="mb-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Skipped Stocks (Not in our 475 match-list)
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {uploadResult.failed_tickers.map(t => (
                                        <span key={t} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-bold text-slate-500">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                                    Note: We currently only support the top ~475 liquid stocks. Unsupported tickers will be added automatically as we broaden our coverage.
                                </p>
                            </div>
                        )}

                        <button
                            className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                            onClick={() => setUploadResult(null)}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}


            {/* Add Stock Modal - Refactored to match design system */}
            {
                showAddStock && (
                    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-slate-700 p-8 animate-in slide-in-from-bottom-8 duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Stock to Portfolio</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Search via Ticker or Name to track risk</p>
                                </div>
                                <button
                                    onClick={() => setShowAddStock(false)}
                                    className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleAddStock} className="flex flex-col gap-6">
                                <div className="relative" ref={autocompleteRef}>
                                    <input
                                        autoFocus
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400 placeholder:font-medium tracking-wide"
                                        placeholder="Enter Ticker (e.g. RELIANCE)"
                                        value={tickerInput}
                                        onChange={e => setTickerInput(e.target.value)}
                                        onFocus={() => { if (tickerInput.length >= 1) setShowDropdown(true); }}
                                    />
                                    {showDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {filteredCompanies.length > 0 ? (
                                                filteredCompanies.map(c => (
                                                    <div
                                                        key={c.id}
                                                        className="px-6 py-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer flex items-center justify-between transition-all group border-b border-slate-50 last:border-0 dark:border-slate-800/50"
                                                        onClick={() => selectCompany(c.ticker)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center group-hover:border-blue-500/50 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm shrink-0">
                                                                <span className="font-black text-slate-900 dark:text-white tracking-widest text-[11px]">{c.ticker}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{c.name}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.sector || "General"}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Q3 FY25</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {c.flag_count > 0 ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded">
                                                                        🚩 {c.flag_count} Signals
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-red-500/60 mt-0.5 uppercase tracking-tighter">Action Recommended</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded">
                                                                        Stable
                                                                    </span>
                                                                    <span className="text-[9px] font-bold text-emerald-500/60 mt-0.5 uppercase tracking-tighter">No Flags</span>
                                                                </div>
                                                            )}
                                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white text-slate-400 dark:text-slate-600 transition-all shadow-sm">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-5 py-12 text-center flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h4 className="text-slate-900 dark:text-white font-black text-base tracking-tight">No Results Found</h4>
                                                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium max-w-[180px] mx-auto mt-1">We couldn't find any equity matching "{tickerInput}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4 justify-end mt-4">
                                    <button
                                        type="button"
                                        className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none"
                                        onClick={() => setShowAddStock(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Add Equity to Portfolio
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Glossary Sidebar */}
            <div className={`glossary-sidebar ${isGlossaryOpen ? 'open' : ''}`}>
                <div className="glossary-header">
                    <h2 className="glossary-title">Risk Glossary</h2>
                    <button className="icon-btn" onClick={() => setIsGlossaryOpen(false)}>✕</button>
                </div>

                <div className="glossary-content">
                    <div className="glossary-item">
                        <span className="glossary-term">Risk Score</span>
                        <p className="glossary-def">
                            A proprietary 0-100 index calculating total capital risk. It synthesizes financial health (balance sheet stress),
                            governance flags, and market momentum. Scores above 70 indicate a high probability of capital erosion.
                        </p>
                    </div>

                    <div className="glossary-item">
                        <span className="glossary-term">Escalation Probability</span>
                        <p className="glossary-def">
                            Our AI model's estimated likelihood that the current risk posture will deteriorate significantly (tier downgrade)
                            within the next 90 days. High probability is a leading indicator of upcoming price volatility.
                        </p>
                    </div>

                    <div className="glossary-item">
                        <span className="glossary-term">Risk Momentum</span>
                        <p className="glossary-def">
                            Measures the rate of change in risk signals. Acceleration means new red flags are appearing faster than the
                            historical average, signaling an urgent need for re-evaluation.
                        </p>
                    </div>

                    <div className="glossary-item">
                        <span className="glossary-term">Risk Density</span>
                        <p className="glossary-def">
                            The average number of active algorithmic flags per company in your portfolio. It measures how widespread
                            deterioration is across your holdings.
                        </p>
                    </div>

                    <div className="glossary-item">
                        <span className="glossary-term">Domain Exposure</span>
                        <p className="glossary-def">
                            Categorizes your total capital risk by "Domain" (e.g., Debt, Cash Flow, Growth). This helps identify if your
                            portfolio has a structural weakness in a specific area of finance.
                        </p>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Model Methodology</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Flagium uses a multi-layered detection engine that monitors 2,400+ data points across SEBI/NSE filings,
                        auditor notes, and quarterly results. Our mission is to bridge the gap between complex filings and clear,
                        actionable risk intelligence.
                    </p>
                </div>
            </div>

            {/* Glossary Backdrop */}
            {isGlossaryOpen && (
                <div
                    className="fixed inset-0 z-[2500] bg-slate-900/20 backdrop-blur-[2px]"
                    onClick={() => setIsGlossaryOpen(false)}
                />
            )}
        </div >
    );
}
