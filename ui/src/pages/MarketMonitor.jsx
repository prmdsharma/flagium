import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const TIER_CONFIG = {
    stable: { label: "Stable", color: "#10b981", icon: "🟢" },
    early_warning: { label: "Early Warning", color: "#f59e0b", icon: "🟡" },
    elevated: { label: "Elevated Risk", color: "#f97316", icon: "🟠" },
    high_risk: { label: "High Risk", color: "#ef4444", icon: "🔴" },
};

const SEVERITY_COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b" };

function RiskScoreBar({ score, max = 12 }) {
    const pct = Math.min((score / max) * 100, 100);
    const color = score >= 7 ? "#ef4444" : score >= 4 ? "#f97316" : score >= 1 ? "#f59e0b" : "#10b981";
    return (
        <div className="risk-score-bar-bg">
            <div className="risk-score-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.getDashboard().then(setData).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /> Loading intelligence…</div>;
    if (!data) return <div className="loading">Failed to load</div>;

    const { risk_momentum, portfolio_health, flag_pressure, most_at_risk, new_deteriorations, risk_narrative } = data;
    const rm = risk_momentum;
    const ph = portfolio_health;
    const coverageCount = rm.total_companies || 0;

    // Prepare health donut data
    const healthData = Object.entries(ph.tiers).map(([key, count]) => ({
        name: TIER_CONFIG[key].label,
        value: count,
        color: TIER_CONFIG[key].color,
    }));

    const topSectors = Array.from(
        new Set((most_at_risk || []).map(c => c.sector).filter(Boolean))
    ).slice(0, 2);

    const formatSectors = (sectors) => {
        if (!sectors.length) return null;
        if (sectors.length === 1) return sectors[0];
        return `${sectors[0]} and ${sectors[1]}`;
    };

    const contextHeader = `System-wide financial stress across ${coverageCount} covered companies.`;

    const interpretation = (() => {
        const breadth =
            rm.delta_density > 0 || rm.delta_companies > 0
                ? "expanding"
                : rm.delta_density < 0 || rm.delta_companies < 0
                    ? "stabilizing"
                    : "steady";

        const severity =
            rm.delta_high > 0 ? "rising" : rm.delta_high < 0 ? "easing" : "stable";

        const sectorText = formatSectors(topSectors);
        if (sectorText) {
            return `Risk breadth is ${breadth}, with high severity flags ${severity} across ${sectorText}.`;
        }

        return risk_narrative || `Risk breadth is ${breadth} across the coverage universe.`;
    })();

    // Helper for deltas
    const renderDelta = (value, isInverse = false) => {
        if (!value || value === 0) return null;
        const isPositive = value > 0;
        // Default: Up is Bad (Red)
        // Inverse (Stable): Up is Good (Green)
        const isBad = isInverse ? !isPositive : isPositive;
        const colorClass = isBad ? 'up-bad' : 'down-good';
        const arrow = isPositive ? '▲' : '▼';
        // Use custom class for health legend to adjust size/margin
        const className = isInverse !== undefined ? "legend-delta" : "qs-delta";

        return (
            <span className={`${className} ${colorClass}`}>
                {arrow} {Math.abs(value)}
            </span>
        );
    };

    const renderQsDelta = (value) => {
        if (!value || value === 0) return null;
        const isPositive = value > 0;
        const isBad = isPositive; // For risk metrics, up is bad
        const colorClass = isBad ? 'up-bad' : 'down-good';
        const arrow = isPositive ? '▲' : '▼';
        return (
            <span className={`qs-delta ${colorClass}`}>
                {arrow} {Math.abs(value)}
            </span>
        );
    };

    return (
        <>
            {/* ══════════════════════════════════════════
                SECTION 1 — RISK MOMENTUM HERO
                ══════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════
                SECTION 1 — RISK MOMENTUM HERO
                ══════════════════════════════════════════ */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    <div className="p-6 lg:p-8 flex-1 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">RISK MOMENTUM</div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6">{contextHeader}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:gap-8 mb-6">
                            <span className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-none font-mono tracking-tighter">{rm.risk_density}</span>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Market Risk Density</span>
                                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] cursor-help" title="Average active risk signals per company.">ℹ️</div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Avg signals per company</span>
                                {rm.rd_history && (
                                    <div className="w-24 h-8">
                                        <ResponsiveContainer>
                                            <LineChart data={rm.rd_history.map((v, i) => ({ i, v }))}>
                                                <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            {rm.is_baseline ? (
                                <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800/50">📍 Baseline Scan — QoQ trends begin next quarter</span>
                            ) : (
                                <span className="text-[10px] font-black bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-red-100 dark:border-red-800/50 flex items-center gap-2 w-fit">
                                    <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    ▲ +18% vs Last Quarter
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-6 lg:p-8 lg:w-[45%] bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="grid grid-cols-2 gap-6 lg:gap-8">
                            <div className="flex flex-col">
                                <div className="text-2xl lg:text-3xl font-black text-red-500 mb-1">{rm.high_flags}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">High Severity</div>
                                {!rm.is_baseline && (
                                    <div className={`text-[10px] font-bold ${rm.delta_high > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {rm.delta_high > 0 ? '▲' : '▼'} {Math.abs(rm.delta_high)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="text-2xl lg:text-3xl font-black text-amber-500 mb-1">{rm.medium_flags}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medium Severity</div>
                                {!rm.is_baseline && (
                                    <div className={`text-[10px] font-bold ${rm.delta_medium > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {rm.delta_medium > 0 ? '▲' : '▼'} {Math.abs(rm.delta_medium)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="text-2xl lg:text-3xl font-black text-blue-500 mb-1">{rm.total_flags}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</div>
                                {!rm.is_baseline && (
                                    <div className={`text-[10px] font-bold ${rm.delta_total > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {rm.delta_total > 0 ? '▲' : '▼'} {Math.abs(rm.delta_total)}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="text-2xl lg:text-3xl font-black text-red-500 mb-1">{rm.flagged_companies}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Companies Hit</div>
                                {!rm.is_baseline && (
                                    <div className={`text-[10px] font-bold ${rm.delta_companies > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {rm.delta_companies > 0 ? '▲' : '▼'} {Math.abs(rm.delta_companies)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border-y border-slate-800 px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3 lg:gap-6">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Interpretation</span>
                <span className="text-xs lg:text-sm font-medium text-slate-300 leading-relaxed">{interpretation}</span>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 2 — PORTFOLIO HEALTH INTELLIGENCE
                ══════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════
                SECTION 2 — PORTFOLIO HEALTH INTELLIGENCE
                ══════════════════════════════════════════ */}
            <div className="glass-card p-6 lg:p-8 mt-6 lg:mt-8 mx-4 lg:mx-0">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                    Portfolio Health Distribution
                </h2>
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Stacked bar */}
                    <div className="flex-1">
                        <div className="h-10 lg:h-12 w-full flex rounded-xl overflow-hidden shadow-sm mb-8">
                            {Object.entries(ph.tiers).map(([tier, count]) => {
                                if (count === 0) return null;
                                const pct = ((count / ph.total) * 100).toFixed(1);
                                return (
                                    <div
                                        key={tier}
                                        className="h-full flex items-center justify-center text-[10px] font-black text-white/90"
                                        style={{ width: `${pct}%`, background: TIER_CONFIG[tier].color }}
                                        title={`${TIER_CONFIG[tier].label}: ${count} (${pct}%)`}
                                    >
                                        {parseFloat(pct) > 8 && <span>{count}</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Object.entries(ph.tiers).map(([tier, count]) => (
                                <div key={tier} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full" style={{ background: TIER_CONFIG[tier].color }} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{TIER_CONFIG[tier].label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{count}</span>
                                        {ph.deltas && renderDelta(ph.deltas[tier], tier === 'stable')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mini donut */}
                    <div className="relative w-full lg:w-48 h-48 flex items-center justify-center shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={healthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    dataKey="value"
                                    strokeWidth={3}
                                    stroke="var(--bg-surface)"
                                >
                                    {healthData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-card)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "12px",
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                        boxShadow: 'var(--shadow-md)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{ph.total}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Found</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                LOWER GRID — 70/30 LAYOUT
                ══════════════════════════════════════════ */}
            {/* ══════════════════════════════════════════
                LOWER GRID — 70/30 LAYOUT
                ══════════════════════════════════════════ */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-0 mt-6 lg:mt-8">
                {/* LEFT 70% */}
                <div className="flex-[7] flex flex-col gap-6 lg:gap-8">
                    {/* SECTION 3 — TOP ACTIVE RISK SIGNALS */}
                    <div className="glass-card p-6 lg:p-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Top Active Risk Signals
                        </h2>
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">SIGNAL</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">COMPANIES HIT</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">IMPACT</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">SEVERITY</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">WEIGHT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flag_pressure.slice(0, 5).map(fp => (
                                        <tr key={fp.code} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                                            <td className="py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded w-fit">{fp.code}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{fp.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{fp.companies_impacted}</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col gap-1.5 min-w-[120px]">
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fp.impact_pct}%`, backgroundColor: fp.max_severity === 'HIGH' ? '#ef4444' : '#f59e0b' }}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{fp.impact_pct}% Impact</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${fp.max_severity === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                    {fp.max_severity}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <span className="text-sm font-black font-mono text-slate-600 dark:text-slate-400">{fp.severity_weight}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 4 — MOST AT-RISK COMPANIES */}
                    <div className="glass-card p-6 lg:p-8">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Most At-Risk Companies
                        </h2>
                        <div className="flex flex-col gap-4">
                            {most_at_risk.map(c => (
                                <div key={c.ticker} className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/30 cursor-pointer" onClick={() => navigate(`/company/${c.ticker}`)}>
                                    <div className={`w-full sm:w-1.5 h-1 sm:h-auto ${c.tier === 'high_risk' ? 'bg-red-500' : (c.tier === 'elevated' ? 'bg-orange-500' : 'bg-amber-500')}`}></div>
                                    <div className="p-5 flex-1 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{c.ticker}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.name}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${c.highest_severity === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                                {c.highest_severity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-8 lg:gap-12">
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-2xl font-black font-mono leading-none ${c.tier === 'high_risk' ? 'text-red-500' : (c.tier === 'elevated' ? 'text-orange-500' : 'text-amber-500')}`}>{c.risk_score}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">/15</span>
                                                </div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Risk Score</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{c.flag_count}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Flags</span>
                                            </div>
                                            <div className="hidden md:flex flex-col items-end">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-none">{c.last_triggered}</span>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Updated</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT 30% */}
                <div className="flex-[3] flex flex-col gap-6 lg:gap-8">
                    {/* SECTION 5 — NEW DETERIORATIONS */}
                    <div className="glass-card p-6 lg:p-7 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="flex items-center gap-1.5 text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse tracking-widest">
                                <span className="w-1 h-1 rounded-full bg-white"></span>
                                LIVE
                            </span>
                        </div>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-3">
                            <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                            New Deteriorations
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Since last results</p>

                        <div className="flex flex-col gap-3">
                            {new_deteriorations && new_deteriorations.length > 0 ? (
                                new_deteriorations.slice(0, 6).map(d => (
                                    <div key={d.ticker} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer active:scale-[0.98]" onClick={() => navigate(`/company/${d.ticker}`)}>
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${d.high_count > 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {d.ticker.slice(0, 2)}
                                        </div>
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-sm font-black text-slate-900 dark:text-white truncate">{d.ticker}</span>
                                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${d.high_count > 0 ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    {d.high_count > 0 ? 'High' : 'Med'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <span className="text-[9px] text-slate-400 whitespace-nowrap">⚡ {d.trigger_name || "New Signal Detect"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-xs font-bold text-slate-400 italic">No new deteriorations detected.</div>
                            )}
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="glass-card p-6 lg:p-7">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Quick Stats
                        </h2>
                        <div className="flex flex-col gap-5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Total Companies</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{rm.total_companies}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Companies Flagged</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-red-500 font-mono">{rm.flagged_companies}</span>
                                    {renderQsDelta(rm.delta_companies)}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Weighted Score</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{rm.severity_weighted}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Risk Density</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-amber-500 font-mono">{rm.risk_density}</span>
                                    {renderQsDelta(rm.delta_density)}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">High Sev Flags</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-red-500 font-mono">{rm.high_flags}</span>
                                    {renderQsDelta(rm.delta_high)}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Medium Sev Flags</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-amber-500 font-mono">{rm.medium_flags}</span>
                                    {renderQsDelta(rm.delta_medium)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
