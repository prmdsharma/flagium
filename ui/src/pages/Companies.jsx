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
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="Search ticker or name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start md:self-auto">
                        {["all", "flagged", "clean"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wider ${filter === f ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Showing {companies.length} of {data.count} constituents
                </div>
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
            <div className="md:hidden flex flex-col gap-4">
                {companies.map((c) => (
                    <div key={c.ticker} className="glass-card p-5 group active:scale-[0.98] transition-all" onClick={() => navigate(`/company/${c.ticker}`)}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{c.ticker}</span>
                                    {c.flag_count > 0 ? (
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded uppercase">Flagged</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-black rounded uppercase">Clean</span>
                                    )}
                                </div>
                                <div className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">{c.name}</div>
                            </div>
                            <div className="text-right">
                                {c.flag_count > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-red-500">{c.flag_count}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Flags</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{c.sector || "—"}</span>
                            <div className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1">
                                View Intelligence
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
