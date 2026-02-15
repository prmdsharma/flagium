import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Companies() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, flagged, clean
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        api.getCompanies().then(setData).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /> Loading companies…</div>;
    if (!data) return <div className="loading">Failed to load</div>;

    let companies = data.companies;

    if (filter === "flagged") companies = companies.filter((c) => c.flag_count > 0);
    if (filter === "clean") companies = companies.filter((c) => c.flag_count === 0);
    if (search) {
        const q = search.toLowerCase();
        companies = companies.filter(
            (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>Companies</h1>
                <p>{data.count} Nifty 50 constituents tracked</p>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <input
                    type="text"
                    className="toolbar-search"
                    placeholder="Search ticker or name…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="toolbar-filters">
                    {["all", "flagged", "clean"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`filter-btn ${filter === f ? "active" : ""}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <span className="toolbar-count">
                    {companies.length} result{companies.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Desktop Table */}
            <div className="glass-card table-wrap desktop-only" style={{ padding: 0, overflow: "hidden" }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th>Sector</th>
                            <th>Flags</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((c) => (
                            <tr key={c.ticker} style={{ cursor: "pointer" }} onClick={() => navigate(`/company/${c.ticker}`)}>
                                <td>
                                    <span className="ticker">{c.ticker}</span>
                                </td>
                                <td className="company-name">{c.name}</td>
                                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                    {c.sector || "—"}
                                </td>
                                <td>
                                    {c.flag_count > 0 ? (
                                        <span className="badge flag-count">{c.flag_count}</span>
                                    ) : (
                                        <span style={{ color: "var(--text-muted)" }}>0</span>
                                    )}
                                </td>
                                <td>
                                    {c.flag_count > 0 ? (
                                        <span className="badge high">⚠ Flagged</span>
                                    ) : (
                                        <span className="badge clean">✓ Clean</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-only">
                {companies.map((c) => (
                    <div key={c.ticker} className="mobile-card" onClick={() => navigate(`/company/${c.ticker}`)}>
                        <div className="mobile-card-header">
                            <span className="ticker">{c.ticker}</span>
                            {c.flag_count > 0 ? (
                                <span className="badge high">⚠ {c.flag_count}</span>
                            ) : (
                                <span className="badge clean">✓</span>
                            )}
                        </div>
                        <div className="mobile-card-name">{c.name}</div>
                        <div className="mobile-card-sector">{c.sector || "—"}</div>
                    </div>
                ))}
            </div>
        </>
    );
}
