import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "../api";

export default function CompanyDetail() {
    const { ticker } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFlag, setExpandedFlag] = useState(null);
    const [financialsTab, setFinancialsTab] = useState("annual");

    useEffect(() => {
        setLoading(true);
        api.getCompany(ticker)
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [ticker]);

    if (loading) return <div className="loading-screen">Loading Intelligence...</div>;
    if (error) return <div className="error-screen">Error: {error}</div>;
    if (!data) return <div className="error-screen">Company not found</div>;

    const { company, analysis, flags, annual } = data;
    const { status, risk_score, history, trajectory, timeline, narrative, structural_scores, predictive } = analysis || {};

    // Helper colors - Updated for V5/V6 scale (0-100)
    const isHighRisk = risk_score >= 60;
    const statusClass = risk_score >= 60 ? "status-high-risk" : risk_score >= 35 ? "status-elevated" : risk_score >= 15 ? "status-warning" : "status-stable";

    // V6 Helper for Delta Color
    const deltaColor = (predictive?.delta_qoq || 0) > 0 ? "#ef4444" : "#22c55e"; // Red if risk increased

    return (
        <div className="company-detail-page">
            {/* 🔴 V6: Elite Institutional Header */}
            <div className="bloomberg-header">
                {/* Left: Identity & Classification */}
                <div className="bb-panel bb-left">
                    <div className="bb-ticker-row">
                        <h1 className="bb-ticker">{company?.ticker}</h1>
                        <span className="bb-name">{company?.name}</span>
                        <span className="bb-sector-badge">{company?.sector}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Class</span>
                            <span className={`text-sm lg:text-base font-black uppercase tracking-wider ${statusClass}`}>{status}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Driver</span>
                            <span className="text-sm lg:text-base font-black text-slate-700 dark:text-slate-300">Balance Sheet Stress</span>
                        </div>
                    </div>
                </div>

                {/* Center: Risk Engine + Density Layer */}
                <div className="bb-panel bb-center">
                    <div className="text-center">
                        <div className="rem-label">Flagium AI Risk Score</div>
                        <div className="rem-score-row">
                            <div className="rem-score text-slate-900 dark:text-white">{risk_score} <span className="rem-max">/ 100</span></div>
                            <div className="rem-delta" style={{ color: deltaColor, backgroundColor: `${deltaColor}10` }}>
                                {predictive?.delta_qoq > 0 ? "+" : ""}{predictive?.delta_qoq} QoQ
                            </div>
                        </div>
                        <div className="rem-density-row">
                            <span>{predictive?.sector_percentile}th Percentile (Sector)</span>
                            <span className="mx-2 opacity-30">•</span>
                            <span>Accel: +{predictive?.acceleration} Qtrs</span>
                        </div>
                    </div>
                </div>

                {/* Right: Trajectory & Projection */}
                <div className="bb-panel bb-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">6Q Trajectory & Forecast</div>
                    {history && history.length > 0 ? (
                        <div className="w-full h-16 lg:h-20 mb-4 px-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={history.map((v, i) => ({ i, v }))} margin={{ top: 10, bottom: 0, left: 0, right: 0 }}>
                                    <XAxis dataKey="i" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                                        {history.map((v, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === history.length - 1
                                                    ? (risk_score >= 60 ? "#ef4444" : "#3b82f6")
                                                    : "var(--slate-200-fallback)"
                                                }
                                                className={index === history.length - 1 ? "drop-shadow-[0_-4px_8px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_-4px_8px_rgba(59,130,246,0.1)]" : "opacity-30 dark:opacity-20"}
                                            />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 3" opacity={0.2} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-16 lg:h-20 mb-4 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Insufficient Data for Trajectory</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col px-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">BASE</span>
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{predictive?.projected_base}</span>
                        </div>
                        <div className="flex flex-col px-2 border-x border-slate-200 dark:border-slate-700 flex-1 items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">STRESS</span>
                            <span className="text-sm font-black font-mono text-red-500">{predictive?.projected_stress}</span>
                        </div>
                        <div className="flex flex-col px-2 text-right">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">ESC. PROB</span>
                            <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{predictive?.escalation_prob}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 px-4 lg:px-0">
                {/* LEFT COL (70%) */}
                <div className="flex-[7] flex flex-col gap-6 lg:gap-8">

                    {/* 1. Assessment Panel (V6 Refined) */}
                    <section className="glass-card p-6 lg:p-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Forensic Assessment
                        </h3>
                        <div className="text-base lg:text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                            {narrative}
                        </div>
                    </section>

                    {/* 2. Flagium AI Active Risk Objects (V6 Density) */}
                    <section className="glass-card p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                Active Risk Objects ({flags?.length || 0})
                            </h3>
                            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>Critical</span>
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span>High</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {flags && flags.map((flag, idx) => {
                                const isCritical = flag.flag_name.includes("Interest") || flag.flag_name.includes("OCF");
                                const impactScore = isCritical ? 15 : 10;

                                return (
                                    <div key={idx} className={`relative flex flex-col sm:flex-row overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isCritical ? 'bg-red-50/30 dark:bg-red-900/10' : 'bg-slate-50/50 dark:bg-slate-900/50'}`}>
                                        <div className={`w-full sm:w-1.5 h-1 sm:h-auto ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <div className="p-5 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{flag.flag_name}</span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase bg-white/50 dark:bg-black/20 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-800">Active for {flag.duration_quarters} Qtrs</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact Weight</span>
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{impactScore} / 15</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Model Confidence</span>
                                                    <span className="text-xs font-black text-green-500">92%</span>
                                                </div>
                                                <div className="hidden md:flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sector Percentile</span>
                                                    <span className="text-xs font-black text-red-500">98th</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 italic leading-snug">
                                                {flag.flag_name === "Low Interest Coverage"
                                                    ? "Operating income is insufficient to cover interest obligations. Ratio < 1.5x signals distress."
                                                    : "Significant divergence between reported PAT and Operating Cash Flow."
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 3. Deterioration Timeline */}
                    <section className="glass-card p-6 lg:p-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Deterioration Timeline
                        </h3>
                        <div className="relative flex overflow-x-auto pb-4 scrollbar-hide py-4 px-2">
                            <div className="absolute top-8 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 z-0"></div>
                            {timeline && timeline.map((t, i) => (
                                <div key={i} className="relative z-10 flex flex-col items-center min-w-[140px] px-4 first:pl-0">
                                    <div className={`w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-sm mb-4 ${t.severity === 'High' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                    <div className="text-center">
                                        <div className="text-[11px] font-bold text-slate-900 dark:text-white uppercase mb-1">{t.quarter}</div>
                                        <div className="text-[10px] text-slate-500 leading-tight max-w-[120px]">{t.event}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Financials (Compact) - Tabbed View */}
                    <section className="glass-card p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                Key Financials (INR Cr)
                            </h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center self-start sm:self-auto">
                                <button
                                    onClick={() => setFinancialsTab('annual')}
                                    className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all uppercase tracking-wider ${financialsTab === 'annual' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Annual
                                </button>
                                <button
                                    onClick={() => setFinancialsTab('quarterly')}
                                    className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all uppercase tracking-wider ${financialsTab === 'quarterly' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Quarterly
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Profit</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OCF</th>
                                        <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Debt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(financialsTab === 'annual' ? (annual || []) : (data.quarterly || []))
                                        .slice(0, financialsTab === 'annual' ? 3 : 8)
                                        .map((r, i) => (
                                            <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-50 dark:border-slate-800/50">
                                                <td className="py-4 text-left text-sm font-bold text-slate-900 dark:text-white">
                                                    {r.quarter ? `Q${r.quarter} FY${r.year}` : `FY${r.year}`}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">{r.revenue ? (r.revenue / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}</td>
                                                <td className="py-4 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">{r.net_profit ? (r.net_profit / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}</td>
                                                <td className="py-4 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">{(r.operating_cash_flow !== undefined && r.operating_cash_flow !== null) ? (r.operating_cash_flow / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : ((r.ocf !== undefined && r.ocf !== null) ? (r.ocf / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-")}</td>
                                                <td className="py-4 px-4 text-sm font-mono text-slate-600 dark:text-slate-400">{(r.total_debt !== undefined && r.total_debt !== null) ? (r.total_debt / 10000000).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "-"}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* RIGHT COL (30%) */}
                <div className="flex-[3] flex flex-col gap-6 lg:gap-8">
                    <section className="glass-card p-6 lg:p-7">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Risk Profiles
                        </h3>
                        <div className="flex flex-col gap-8">
                            {structural_scores && Object.entries(structural_scores).map(([cat, metric]) => (
                                <div key={cat} className="flex flex-col gap-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{cat.replace('_', ' ')}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{metric.score}</span>
                                            <span className="text-[10px] text-slate-400 ml-1.5 font-bold">{metric.percentile}th %ile</span>
                                        </div>
                                    </div>
                                    <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${metric.percentile}%` }}></div>
                                        {/* Sector Median Marker (V6) */}
                                        <div className="absolute top-0 bottom-0 w-1 bg-slate-400/50 z-10" style={{ left: `${(metric.sector_median / 10) * 100}%` }} title={`Sector Median: ${metric.sector_median}`}></div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider text-right">vs Sector Median ({metric.sector_median})</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card p-6 lg:p-7">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                            Risk Composition
                        </h3>
                        <div className="flex flex-col gap-8">
                            <div className="flex h-12 rounded-xl overflow-hidden shadow-sm shadow-blue-500/5">
                                <div className="bg-blue-600 transition-all duration-500" style={{ width: '45%' }}></div>
                                <div className="bg-indigo-500 transition-all duration-500" style={{ width: '30%' }}></div>
                                <div className="bg-purple-500 transition-all duration-500" style={{ width: '25%' }}></div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Balance Sheet</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">45%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Earnings</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">30%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Governance</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">25%</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div >
    );
}
