import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { api } from "../api";

export default function CompanyDetail() {
    const { ticker } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFlag, setExpandedFlag] = useState(null);

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
                    <div className="bb-metrics-grid">
                        <div className="bb-metric">
                            <span className="bb-metric-label">Risk Class</span>
                            <span className={`bb-metric-val ${statusClass}`} style={{ fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{status}</span>
                        </div>
                        <div className="bb-metric">
                            <span className="bb-metric-label">Primary Driver</span>
                            <span className="bb-metric-val bb-name">Balance Sheet Stress</span>
                        </div>
                    </div>
                </div>

                {/* Center: Risk Engine + Density Layer */}
                <div className="bb-panel bb-center">
                    <div className="risk-engine-module">
                        <div className="rem-label">Flagium Risk Score</div>
                        <div className="rem-score-row">
                            <div className="rem-score">{risk_score} <span className="rem-max">/ 100</span></div>
                            <div className="rem-delta" style={{ color: deltaColor }}>
                                {predictive?.delta_qoq > 0 ? "+" : ""}{predictive?.delta_qoq} QoQ
                            </div>
                        </div>
                        <div className="rem-density-row">
                            <span>{predictive?.sector_percentile}th Percentile (Sector)</span>
                            <span style={{ margin: '0 8px', color: '#64748b' }}>|</span>
                            <span>Accel: +{predictive?.acceleration} Qtrs</span>
                        </div>
                    </div>
                </div>

                {/* Right: Trajectory & Projection */}
                <div className="bb-panel bb-right">
                    <div className="rem-label" style={{ alignSelf: 'flex-start' }}>6Q Trajectory & Forecast</div>
                    {history && (
                        <div style={{ width: '100%', height: '60px', marginTop: '4px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history.map((v, i) => ({ i, v }))}>
                                    <Line type="step" dataKey="v" stroke={isHighRisk ? "#ef4444" : "#cbd5e1"} strokeWidth={2} dot={false} />
                                    <ReferenceLine y={60} stroke="#475569" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    <div className="rem-projection-block">
                        <div className="proj-item">
                            <span className="proj-label">BASE</span>
                            <span className="proj-val">{predictive?.projected_base}</span>
                        </div>
                        <div className="proj-item">
                            <span className="proj-label">STRESS</span>
                            <span className="proj-val" style={{ color: '#ef4444' }}>{predictive?.projected_stress}</span>
                        </div>
                        <div className="proj-item">
                            <span className="proj-label">ESC. PROB</span>
                            <span className="proj-val">{predictive?.escalation_prob}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="institutional-grid">
                {/* LEFT COL (70%) */}
                <div className="detail-left-col">

                    {/* 1. Assessment Panel (V6 Refined) */}
                    <section className="assessment-panel">
                        <h3 className="section-title-inst">Forensic Assessment</h3>
                        <div className="assessment-text">
                            {narrative}
                        </div>
                    </section>

                    {/* 2. Flagium Active Risk Objects (V6 Density) */}
                    <section className="risk-objects-section">
                        <div className="section-header-row">
                            <h3 className="section-title-inst">Active Risk Objects ({flags?.length || 0})</h3>
                            <div className="legend">
                                <span className="legend-item"><span className="dot critical"></span>Critical</span>
                                <span className="legend-item"><span className="dot high"></span>High</span>
                            </div>
                        </div>

                        <div className="risk-objects-list">
                            {flags && flags.map((flag, idx) => {
                                // V6: Tint & Severity Logic
                                const urgencyClass = flag.flag_name.includes("Interest") || flag.flag_name.includes("OCF") ? "obj-critical" : "obj-high";
                                const impactScore = urgencyClass === "obj-critical" ? 15 : 10;

                                return (
                                    <div key={idx} className={`risk-object-card ${urgencyClass}`}>
                                        <div className="roc-left-border"></div>
                                        <div className="roc-content">
                                            <div className="roc-header">
                                                <span className="roc-title">{flag.flag_name}</span>
                                                <span className="roc-badge">Active for {flag.duration_quarters} Qtrs</span>
                                            </div>
                                            <div className="roc-metrics">
                                                <div className="roc-metric">
                                                    <span className="label">Impact Weight</span>
                                                    <span className="val">{impactScore} / 15</span>
                                                </div>
                                                <div className="roc-metric">
                                                    <span className="label">Model Confidence</span>
                                                    <span className="val">High (92%)</span>
                                                </div>
                                                <div className="roc-metric">
                                                    <span className="label">Sector Percentile</span>
                                                    <span className="val" style={{ color: '#ef4444' }}>98th</span>
                                                </div>
                                            </div>
                                            <div className="roc-desc">
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
                    <section className="timeline-section-v4">
                        <h3 className="section-title-inst">Deterioration Timeline</h3>
                        <div className="timeline-track-v4">
                            {timeline && timeline.map((t, i) => (
                                <div key={i} className="timeline-node-v4">
                                    <div className="t-line"></div>
                                    <div className={`t-dot ${t.severity === 'High' ? 'red' : 'gray'}`}></div>
                                    <div className="t-content">
                                        <div className="t-quarter">{t.quarter}</div>
                                        <div className="t-event">{t.event}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. Financials (Compact) */}
                    <section className="financials-section-v4">
                        <h3 className="section-title-inst">Key Financials (INR Cr)</h3>
                        <table className="inst-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Revenue</th>
                                    <th>Net Profit</th>
                                    <th>OCF</th>
                                    <th>Debt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {annual && annual.slice(0, 3).map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.year}</td>
                                        <td>{r.revenue.toLocaleString()}</td>
                                        <td>{r.net_profit.toLocaleString()}</td>
                                        <td>{r.ocf.toLocaleString()}</td>
                                        <td>{r.total_debt.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>

                {/* RIGHT COL (30%) */}
                <div className="detail-right-col">
                    <section className="structural-section-v4">
                        <h3 className="section-title-inst">Structural Risk Profile</h3>
                        <div className="structural-grid">
                            {structural_scores && Object.entries(structural_scores).map(([cat, metric]) => (
                                <div key={cat} className="struct-row">
                                    <div className="struct-header-row">
                                        <span style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                                        <span className="struct-score-val">{metric.score} | {metric.percentile}th %ile</span>
                                    </div>
                                    <div className="struct-bar-bg">
                                        <div className="struct-bar-fill" style={{ width: `${metric.percentile}%` }}></div>
                                        {/* Sector Median Marker (V6) */}
                                        <div className="struct-median-marker" style={{ left: `${(metric.sector_median / 10) * 100}%` }} title={`Sector Median: ${metric.sector_median}`}></div>
                                    </div>
                                    <div className="struct-context">vs Sector Median ({metric.sector_median})</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="composition-section">
                        <h3 className="section-title-inst">Risk Composition</h3>
                        <div className="composition-chart-placeholder">
                            <div className="comp-bar-stack">
                                <div className="comp-seg s-bs" style={{ width: '45%' }}></div>
                                <div className="comp-seg s-eq" style={{ width: '30%' }}></div>
                                <div className="comp-seg s-gov" style={{ width: '25%' }}></div>
                            </div>
                            <div className="comp-legend">
                                <div><span className="dot s-bs"></span>Balance Sheet (45%)</div>
                                <div><span className="dot s-eq"></span>Earnings (30%)</div>
                                <div><span className="dot s-gov"></span>Governance (25%)</div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
