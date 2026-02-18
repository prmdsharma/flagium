import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import Tooltip from "../components/common/Tooltip";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [activePid, setActivePid] = useState(null);

    useEffect(() => {
        api.getAggregatedHealth()
            .then(res => {
                setData(res);
                if (res.summaries && res.summaries.length > 0) {
                    setActivePid(res.summaries[0].id);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /> Loading Portfolio Intelligence…</div>;

    if (!data || data.portfolio_count === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-enter">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl mb-6">
                    📊
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Flagium</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                    You haven't initialized any portfolios yet. Create your first portfolio to start monitoring capital risk.
                </p>
                <Link to="/portfolio" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all">
                    Initialize First Portfolio
                </Link>
            </div>
        );
    }

    const { risk_score, risk_delta, total_capital, summaries, escalations, status, escalation_prob, acceleration } = data;
    const activePf = summaries.find(s => s.id === activePid) || summaries[0];

    const getStatusColor = (s) => {
        if (s === 'High Risk') return 'text-red-500';
        if (s === 'Monitoring') return 'text-yellow-500';
        return 'text-green-500';
    };

    const getStatusIcon = (s) => {
        if (s === 'High Risk') return '🔴';
        if (s === 'Monitoring') return '🟡';
        return '🟢';
    };

    return (
        <div className="space-y-8 animate-enter">
            {/* 1️⃣ Top: Overall Capital Risk (Aggregated) */}
            <div className="glass-card p-8 relative">
                <div className="absolute top-0 right-0 p-4 text-[100px] opacity-5 pointer-events-none">🛡️</div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                                <Tooltip label="Overall Capital Risk" text="Aggregated risk score across your entire portfolio, weighted by capital deployed." />
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500">AGGREGATED</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className={`text-4xl font-black ${getStatusColor(status)}`}>
                                {getStatusIcon(status)} {status}
                            </h1>
                        </div>
                        <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-4">
                            <span>Across {data.portfolio_count} portfolios • Capital-weighted exposure</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 mb-1 uppercase">
                                <Tooltip label="Risk Score" text="Composite index (0-100) combining structural and algorithmic risk signals." />
                            </span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{risk_score}</span>
                            <span className={`text-[10px] font-bold ${risk_delta > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {risk_delta > 0 ? '▲' : '▼'} {Math.abs(risk_delta)} QoQ
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 mb-1 uppercase">
                                <Tooltip label="Escalation Prob" text="Statistical likelihood of a risk-tier downgrade in the next 90 days." />
                            </span>
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{escalation_prob}%</span>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${escalation_prob}%` }} />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 mb-1 uppercase">
                                <Tooltip label="Acceleration" text="The rate at which new risk flags are being detected compared to historical norms." />
                            </span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">{acceleration}</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Status</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 mb-1 uppercase">Total Capital</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">₹{(total_capital / 1e7).toFixed(1)} Cr</span>
                            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter">Deployed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2️⃣ Below: Portfolio Breakdown (Selector + Active Tile) */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.portfolio_count === 1 ? "Your Portfolio" : "Portfolio Attribution"}
                    </h2>
                    <Link to="/portfolio?new=true" className="text-sm font-bold text-blue-600 hover:text-blue-700">+ New Portfolio</Link>
                </div>

                {/* 2.1 Mini-Tiles (Selector) - Only show if > 1 portfolio */}
                {data.portfolio_count > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {summaries.map(pf => (
                            <button
                                key={pf.id}
                                onClick={() => setActivePid(pf.id)}
                                className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-all flex items-center gap-2 ${activePid === pf.id
                                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${pf.tier === 'high_risk' ? 'bg-red-500' : (pf.tier === 'elevated' ? 'bg-amber-500' : 'bg-green-500')}`} />
                                {pf.name}
                                <span className="opacity-50 text-[9px] ml-1">{pf.score}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* 2.2 Active Detail Card (Shown Tile) */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div
                        onClick={() => navigate(`/portfolio/${activePf.id}`)}
                        className={`glass-card flex items-center justify-between hover:border-blue-500 cursor-pointer transition-all group ${activePf.tier !== 'stable' ? 'bg-amber-50/5' : ''} ${data.portfolio_count > 1 ? 'p-5' : 'p-6'}`}
                    >
                        <div className="flex items-center gap-6">
                            <div className={`w-3 rounded-full ${data.portfolio_count > 1 ? 'h-12' : 'h-16'} ${activePf.tier === 'high_risk' ? 'bg-red-500' : (activePf.tier === 'elevated' ? 'bg-amber-500' : 'bg-green-500')}`} />
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{activePf.tier.replace('_', ' ')}</div>
                                <div className={`${data.portfolio_count > 1 ? 'text-xl' : 'text-2xl'} font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors`}>{activePf.name}</div>
                                <div className="text-sm text-slate-500 mt-1">₹{(activePf.capital / 1e7).toFixed(2)} Cr Capital Deployed</div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className={`${data.portfolio_count > 1 ? 'text-4xl' : 'text-5xl'} font-black text-slate-900 dark:text-white leading-none`}>{activePf.score}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-2 tracking-widest uppercase">Risk Score</div>
                        </div>
                    </div>
                </div>

                {/* 2.3 Risk Distribution Strip */}
                <div className="flex flex-wrap gap-6 mt-8 py-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">Risk Density:</div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-[10px] text-slate-500">STABLE:</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{summaries.filter(s => s.tier === 'stable').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-[10px] text-slate-500">MONITORING:</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{summaries.filter(s => s.tier === 'elevated').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-[10px] text-slate-500">ELEVATED:</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">{summaries.filter(s => s.tier === 'high_risk').length}</span>
                    </div>
                </div>
            </div>

            {/* 3️⃣ Attention Required Section */}
            {(escalations.length > 0 || summaries.some(p => p.tier !== 'stable')) && (
                <div className={`glass-card border-t-4 shadow-lg ${status === 'Monitoring'
                    ? 'border-t-amber-500 border-x-slate-100 border-b-slate-100 dark:border-slate-800 bg-amber-50/10'
                    : 'border-t-red-600 border-x-slate-100 border-b-slate-100 dark:border-slate-800 bg-red-50/10'}`}>
                    <div className={`p-4 border-b flex items-center justify-between ${status === 'Monitoring' ? 'border-amber-100 dark:border-amber-900/20' : 'border-red-100 dark:border-red-900/20'}`}>
                        <h2 className={`text-base font-bold flex items-center gap-2 ${status === 'Monitoring' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                            <span>{status === 'Monitoring' ? '👁️' : '⚠️'}</span> {status === 'Monitoring' ? 'ACTIVE MONITORING' : 'ATTENTION REQUIRED'}
                        </h2>
                        {summaries.filter(p => p.tier !== 'stable').length > 0 && (
                            <span className={`text-[10px] font-black text-white px-2 py-0.5 rounded animate-pulse ${status === 'Monitoring' ? 'bg-amber-500' : 'bg-red-600'}`}>
                                {summaries.filter(p => p.tier !== 'stable').length} AT RISK
                            </span>
                        )}
                    </div>
                    <div className="p-0">
                        {/* Portfolios needing attention */}
                        {summaries.filter(p => p.tier !== 'stable').map(pf => (
                            <div key={pf.id} className="p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-900/10 last:border-0 hover:bg-slate-50/50 cursor-pointer" onClick={() => navigate(`/portfolio/${pf.id}`)}>
                                <div className="flex items-center gap-3">
                                    <div className={`text-sm font-bold ${pf.tier === 'high_risk' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                        {pf.name} <span className="text-slate-400 mx-1">•</span> {pf.tier.toUpperCase()} Status
                                    </div>
                                </div>
                                <div className={`text-xs font-semibold decoration-dotted underline underline-offset-4 ${pf.tier === 'high_risk' ? 'text-red-600' : 'text-amber-600'}`}>
                                    {pf.tier === 'high_risk' ? 'Mitigate Risk →' : 'Review Signals →'}
                                </div>
                            </div>
                        ))}

                        {/* Deduplicated Escalations */}
                        {(() => {
                            // Group escalations by ticker
                            const groups = escalations.reduce((acc, esc) => {
                                if (!acc[esc.ticker]) acc[esc.ticker] = [];
                                acc[esc.ticker].push(esc);
                                return acc;
                            }, {});

                            return Object.entries(groups).slice(0, 3).map(([ticker, items], i) => {
                                const count = items.length;
                                const severity = items.some(i => i.severity === 'CRITICAL') ? 'CRITICAL' : (items.some(i => i.severity === 'HIGH') ? 'HIGH' : 'MEDIUM');
                                const quarters = items.map(i => `Q${i.quarter}`).filter((v, i, a) => a.indexOf(v) === i).sort();
                                const range = quarters.length > 1 ? `${quarters[0]}-${quarters[quarters.length - 1]}` : quarters[0];
                                const year = items[0].year || '2025';

                                return (
                                    <div key={ticker} className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/30 cursor-pointer" onClick={() => navigate(`/company/${ticker}`)}>
                                        <div className="flex flex-col">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                {ticker}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 font-medium">
                                                <span className={severity === 'CRITICAL' ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                                                    {count} {severity} Signals
                                                </span>
                                                <span className="mx-1">•</span>
                                                {range} {year}
                                            </div>
                                        </div>
                                        <button className="text-[10px] font-bold text-blue-600 uppercase tracking-wide hover:underline">Review Signals →</button>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
