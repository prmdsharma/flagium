import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Flags() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(null); // null = all, "HIGH", "MEDIUM"
    const navigate = useNavigate();

    useEffect(() => {
        api.getFlags(filter).then(setData).finally(() => setLoading(false));
    }, [filter]);

    if (loading) return <div className="loading"><div className="spinner" /> Loading flags…</div>;
    if (!data) return <div className="loading">Failed to load</div>;

    return (
        <>
            <div className="page-header">
                <h1>Red Flags</h1>
                <p>{data.count} active flags across all companies</p>
            </div>

            {/* Severity Filter */}
            <div className="toolbar">
                <div className="toolbar-filters">
                    {[
                        { label: "All", value: null },
                        { label: "🔴 High", value: "HIGH" },
                        { label: "🟡 Medium", value: "MEDIUM" },
                    ].map((f) => (
                        <button
                            key={f.label}
                            onClick={() => { setFilter(f.value); setLoading(true); }}
                            className={`filter-btn ${filter === f.value ? "active" : ""}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Flag Cards */}
            {data.flags.map((f, i) => (
                <div key={i} className={`flag-card severity-${f.severity?.toLowerCase()}`}>
                    <div className="flag-header">
                        <div className="flag-header-left">
                            <span className="flag-code">{f.flag_code}</span>
                            <span
                                className="ticker"
                                style={{ cursor: "pointer" }}
                                onClick={() => navigate(`/company/${f.ticker}`)}
                            >
                                {f.ticker}
                            </span>
                            <span className="flag-name hide-mobile">{f.flag_name}</span>
                        </div>
                        <span className={`badge ${f.severity?.toLowerCase()}`}>{f.severity}</span>
                    </div>
                    <div className="flag-name show-mobile-only">{f.flag_name}</div>
                    <p className="flag-message">{f.message}</p>
                </div>
            ))}

            {data.flags.length === 0 && (
                <div className="glass-card" style={{ textAlign: "center", padding: 60 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <p style={{ color: "var(--text-secondary)" }}>No flags found for this filter.</p>
                </div>
            )}
        </>
    );
}
