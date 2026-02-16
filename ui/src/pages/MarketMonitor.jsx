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

    // Prepare health donut data
    const healthData = Object.entries(ph.tiers).map(([key, count]) => ({
        name: TIER_CONFIG[key].label,
        value: count,
        color: TIER_CONFIG[key].color,
    }));

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
                SECTION 0 — NARRATIVE INTELLIGENCE
                ══════════════════════════════════════════ */}
            <div className="risk-narrative-banner">
                <span className="narrative-icon">⚡</span>
                <span className="narrative-text">{risk_narrative}</span>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 1 — RISK MOMENTUM HERO
                ══════════════════════════════════════════ */}
            <div className="risk-momentum-hero">
                <div className="momentum-main">
                    <div className="momentum-left">
                        <div className="momentum-label">RISK MOMENTUM</div>
                        <div className="momentum-headline">
                            <span className="momentum-density">{rm.risk_density}</span>
                            <div className="momentum-density-context">
                                <span className="momentum-density-label">Portfolio Risk Density</span>
                                <div className="info-tooltip" title="Severity-weighted flags divided by total companies. Checks for concentration of high-severity risks.">
                                    ℹ️
                                </div>
                            </div>
                            {rm.rd_history && (
                                <div className="density-sparkline" style={{ width: 120, height: 40, marginTop: 5 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={rm.rd_history.map((v, i) => ({ i, v }))}>
                                            <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="momentum-sub">
                            {rm.is_baseline ? (
                                <span className="momentum-baseline">📍 Baseline Scan — QoQ trends begin next quarter</span>
                            ) : (
                                <span className="momentum-delta up">▲ +18% vs Last Quarter</span>
                            )}
                        </div>
                    </div>
                    <div className="momentum-right">
                        <div className="momentum-stats">
                            <div className="m-stat">
                                <div className="m-stat-value red">{rm.high_flags}</div>
                                <div className="m-stat-label">High Severity</div>
                                {!rm.is_baseline && (
                                    <div className={`m-stat-delta ${rm.delta_high > 0 ? 'up-bad' : 'down-good'}`}>
                                        {rm.delta_high > 0 ? '+' : ''}{rm.delta_high}
                                    </div>
                                )}
                            </div>
                            <div className="m-stat">
                                <div className="m-stat-value amber">{rm.medium_flags}</div>
                                <div className="m-stat-label">Medium Severity</div>
                                {!rm.is_baseline && (
                                    <div className={`m-stat-delta ${rm.delta_medium > 0 ? 'up-bad' : 'down-good'}`}>
                                        {rm.delta_medium > 0 ? '+' : ''}{rm.delta_medium}
                                    </div>
                                )}
                            </div>
                            <div className="m-stat">
                                <div className="m-stat-value blue">{rm.total_flags}</div>
                                <div className="m-stat-label">Total Signals</div>
                                {!rm.is_baseline && (
                                    <div className={`m-stat-delta ${rm.delta_total > 0 ? 'up-bad' : 'down-good'}`}>
                                        {rm.delta_total > 0 ? '+' : ''}{rm.delta_total}
                                    </div>
                                )}
                            </div>
                            <div className="m-stat">
                                <div className="m-stat-value red">{rm.flagged_companies}</div>
                                <div className="m-stat-label">Companies Flagged</div>
                                {!rm.is_baseline && (
                                    <div className={`m-stat-delta ${rm.delta_companies > 0 ? 'up-bad' : 'down-good'}`}>
                                        {rm.delta_companies > 0 ? '+' : ''}{rm.delta_companies}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                SECTION 2 — PORTFOLIO HEALTH INTELLIGENCE
                ══════════════════════════════════════════ */}
            <div className="glass-card section-health">
                <h2>🏥 Portfolio Health Distribution</h2>
                <div className="health-layout">
                    {/* Stacked bar */}
                    <div className="health-bar-container">
                        <div className="health-bar">
                            {Object.entries(ph.tiers).map(([tier, count]) => {
                                if (count === 0) return null;
                                const pct = ((count / ph.total) * 100).toFixed(1);
                                return (
                                    <div
                                        key={tier}
                                        className="health-bar-segment"
                                        style={{ width: `${pct}%`, background: TIER_CONFIG[tier].color }}
                                        title={`${TIER_CONFIG[tier].label}: ${count} (${pct}%)`}
                                    >
                                        {parseFloat(pct) > 8 && <span>{count}</span>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="health-legend">
                            {Object.entries(ph.tiers).map(([tier, count]) => (
                                <div key={tier} className="health-legend-item">
                                    <span className="legend-dot" style={{ background: TIER_CONFIG[tier].color }} />
                                    <span className="legend-label">{TIER_CONFIG[tier].label}</span>
                                    <span className="legend-count">{count}</span>
                                    {ph.deltas && renderDelta(ph.deltas[tier], tier === 'stable')}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mini donut */}
                    <div className="health-donut">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={healthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    dataKey="value"
                                    strokeWidth={2}
                                    stroke="var(--bg-primary)"
                                >
                                    {healthData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-card)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "8px",
                                        color: "var(--text-primary)",
                                        fontSize: 13,
                                    }}
                                    formatter={(value, name) => [`${value} companies`, name]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center-label">
                            <span className="donut-center-num">{ph.total}</span>
                            <span className="donut-center-text">Total</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════
                LOWER GRID — 70/30 LAYOUT
                ══════════════════════════════════════════ */}
            <div className="dashboard-lower-grid">
                {/* LEFT 70% */}
                <div className="dashboard-lower-left">
                    {/* SECTION 3 — TOP ACTIVE RISK SIGNALS */}
                    <div className="glass-card">
                        <h2>📡 Top Active Risk Signals</h2>
                        <table className="intelligence-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>SIGNAL</th>
                                    <th style={{ width: '15%' }}>COMPANIES HIT</th>
                                    <th style={{ width: '25%' }}>IMPACT</th>
                                    <th style={{ width: '15%' }}>SEVERITY</th>
                                    <th style={{ width: '10%' }}>WEIGHT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flag_pressure.slice(0, 5).map(fp => (
                                    <tr key={fp.code}>
                                        <td>
                                            <div className="signal-name">
                                                <span className="flag-code-sm">{fp.code}</span>
                                                {fp.name}
                                            </div>
                                        </td>
                                        <td><div className="companies-hit">{fp.companies_impacted}</div></td>
                                        <td>
                                            <div className="impact-bar-bg">
                                                <div className="impact-bar-fill" style={{ width: `${fp.impact_pct}%`, backgroundColor: fp.max_severity === 'HIGH' ? '#ef4444' : '#f59e0b' }}></div>
                                            </div>
                                            <span className="impact-pct">{fp.impact_pct}%</span>
                                        </td>
                                        <td>
                                            <span className={`severity-badge ${fp.max_severity.toLowerCase()}`}>
                                                {fp.max_severity}
                                            </span>
                                        </td>
                                        <td><div className="weight-cell">{fp.severity_weight}</div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* SECTION 4 — MOST AT-RISK COMPANIES */}
                    <div className="glass-card">
                        <h2>🎯 Most At-Risk Companies</h2>
                        <table className="intelligence-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>TICKER</th>
                                    <th style={{ width: '20%' }}>RISK SCORE <span className="header-context">(0-15)</span></th>
                                    <th style={{ width: '10%' }}>FLAGS</th>
                                    <th style={{ width: '15%' }}>SEVERITY</th>
                                    <th style={{ width: '25%' }}>LAST TRIGGERED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {most_at_risk.map(c => (
                                    <tr key={c.ticker} className={`risk-row tier-${c.tier || 'stable'}`} onClick={() => window.location.href = `/company/${c.ticker}`}>
                                        <td>
                                            <div className="company-cell">
                                                <div className="ticker clickable bold-ticker">{c.ticker}</div>
                                                <div className="company-name-sm">{c.name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="risk-score-cell">
                                                <span className={`risk-score-num tier-${c.tier}`}>{c.risk_score}</span>
                                                <div className="risk-score-bar-bg">
                                                    <div className="risk-score-bar-fill" style={{
                                                        width: `${Math.min(100, (c.risk_score / 15) * 100)}%`,
                                                        backgroundColor: c.tier === 'high_risk' ? '#ef4444' : (c.tier === 'elevated' ? '#f97316' : '#f59e0b')
                                                    }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="flag-count-badge">{c.flag_count}</span></td>
                                        <td>
                                            <span className={`severity-badge ${c.highest_severity.toLowerCase()}`}>
                                                {c.highest_severity}
                                            </span>
                                        </td>
                                        <td><div className="date-cell">{c.last_triggered}</div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT 30% */}
                <div className="dashboard-lower-right">
                    {/* SECTION 5 — NEW DETERIORATIONS */}
                    <div className="glass-card deterioration-card">
                        <div className="det-header-row">
                            <h2 className="det-title">⚠️ New Deteriorations</h2>
                            <div className="live-status">LIVE</div>
                        </div>
                        <div className="section-subtitle">Since last quarter results</div>

                        <div className="deterioration-list">
                            {new_deteriorations && new_deteriorations.length > 0 ? (
                                new_deteriorations.slice(0, 6).map(d => (
                                    <div key={d.ticker} className="deterioration-item-v2" onClick={() => window.location.href = `/company/${d.ticker}`}>
                                        <div className="det-stripe" style={{ backgroundColor: d.high_count > 0 ? '#ef4444' : '#f59e0b' }}></div>
                                        <div className="det-content">
                                            <div className="det-top-row">
                                                <span className="det-ticker">{d.ticker}</span>
                                                <span className="det-badge-sm">{d.high_count > 0 ? 'High Risk' : 'Medium'}</span>
                                            </div>
                                            <div className="det-trigger-row">
                                                <span className="det-trigger-icon">⚡</span>
                                                <span className="det-trigger-text">{d.trigger_name || "New Signal Detect"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state-sm">No new deteriorations detected.</div>
                            )}
                        </div>
                    </div>

                    {/* QUICK STATS */}
                    <div className="glass-card quick-stats-card">
                        <h2>📊 Quick Stats</h2>
                        <div className="quick-stat-row">
                            <span className="qs-label">Total Companies</span>
                            <span className="qs-value">{rm.total_companies}</span>
                        </div>
                        <div className="quick-stat-row">
                            <span className="qs-label">Companies Flagged</span>
                            <div className="qs-value-group">
                                <span className="qs-value red">{rm.flagged_companies}</span>
                                {renderQsDelta(rm.delta_companies)}
                            </div>
                        </div>
                        <div className="quick-stat-row">
                            <span className="qs-label">Severity-Weighted Score</span>
                            <span className="qs-value">{rm.severity_weighted}</span>
                        </div>
                        <div className="quick-stat-row">
                            <span className="qs-label">Risk Density</span>
                            <div className="qs-value-group">
                                <span className="qs-value amber">{rm.risk_density}</span>
                                {renderQsDelta(rm.delta_density)}
                            </div>
                        </div>
                        <div className="quick-stat-row">
                            <span className="qs-label">High Severity Flags</span>
                            <div className="qs-value-group">
                                <span className="qs-value red">{rm.high_flags}</span>
                                {renderQsDelta(rm.delta_high)}
                            </div>
                        </div>
                        <div className="quick-stat-row">
                            <span className="qs-label">Medium Severity Flags</span>
                            <div className="qs-value-group">
                                <span className="qs-value amber">{rm.medium_flags}</span>
                                {renderQsDelta(rm.delta_medium)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
