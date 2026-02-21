import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Companies() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const searchContainerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.getCompanies().then(setData).finally(() => setLoading(false));
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchResults = useMemo(() => {
        if (!data?.companies || !search.trim()) return [];
        const q = search.toLowerCase();
        return data.companies.filter(
            (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
        ).sort((a, b) => {
            const aTicker = a.ticker.toLowerCase();
            const bTicker = b.ticker.toLowerCase();
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            // 1. Exact ticker match
            if (aTicker === q) return -1;
            if (bTicker === q) return 1;

            // 2. Ticker startsWith match
            const aTickerStarts = aTicker.startsWith(q);
            const bTickerStarts = bTicker.startsWith(q);
            if (aTickerStarts && !bTickerStarts) return -1;
            if (!aTickerStarts && bTickerStarts) return 1;

            // 3. Name startsWith match
            const aNameStarts = aName.startsWith(q);
            const bNameStarts = bName.startsWith(q);
            if (aNameStarts && !bNameStarts) return -1;
            if (!aNameStarts && bNameStarts) return 1;

            return 0; // Default: let `.includes` fall to bottom
        }).slice(0, 8); // Show only top 8 suggestions in dropdown
    }, [data, search]);

    if (loading) return <div className="loading"><div className="spinner" /> Loading market data…</div>;
    if (!data) return <div className="loading">Failed to load</div>;

    const flaggedCount = data.companies.filter(c => c.flag_count > 0).length;
    const cleanCount = data.companies.length - flaggedCount;

    return (
        <div className="max-w-4xl mx-auto pb-32 mt-4 relative px-4">
            {/* Header Text (Optional context) */}
            <div className="text-center pt-8 pb-4">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Flagium AI</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Monitoring {data.companies.length} equities for structural risk signatures.</p>
            </div>

            {/* 1. Prominent Search Bar (Search-First Professional Layout) */}
            <div className={`relative group w-full mx-auto mt-24 z-50 transition-all duration-300 ${isFocused && search.trim() ? "-translate-y-4 shadow-2xl shadow-blue-500/20" : ""}`} ref={searchContainerRef}>
                <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl blur-xl transition-all group-focus-within:bg-blue-500/20 duration-500"></div>
                <div className={`relative bg-white dark:bg-slate-900 border-2 ${isFocused && search.trim() && searchResults.length > 0 ? "rounded-t-2xl border-b-transparent dark:border-b-transparent" : "rounded-2xl"} border-slate-100 dark:border-slate-800 shadow-sm transition-all focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 flex items-center`}>
                    <div className="pl-6 text-blue-500">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="w-full bg-transparent border-none pl-5 pr-6 py-6 text-xl font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
                        placeholder="Search by ticker symbol or company name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setIsFocused(true);
                            }}
                            className="pr-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* Autocomplete Dropdown */}
                {isFocused && search.trim() && (
                    <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-2 border-t-0 border-blue-500 rounded-b-2xl shadow-2xl shadow-blue-500/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        {searchResults.length > 0 ? (
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50 max-h-[400px] overflow-y-auto hide-scrollbar">
                                {searchResults.map((c) => (
                                    <li
                                        key={c.ticker}
                                        onClick={() => navigate(`/company/${c.ticker}`)}
                                        className="px-6 py-4 hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer flex flex-col md:flex-row md:items-center justify-between group transition-colors gap-4 md:gap-0"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm shrink-0">
                                                <span className="font-black text-slate-900 dark:text-white tracking-widest text-xs">{c.ticker}</span>
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded animate-in fade-in">{c.sector || "Unknown Sector"}</span>
                                                    {c.index && <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">{c.index}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 justify-between md:justify-end border-t border-slate-100 dark:border-slate-800/50 md:border-transparent pt-3 md:pt-0">
                                            {c.flag_count > 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded border border-red-100/50 dark:border-red-800/30 group-hover:scale-105 transition-transform">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
                                                    {c.flag_count} Flags
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded border border-emerald-100/50 dark:border-emerald-800/30 group-hover:scale-105 transition-transform">
                                                    Clean
                                                </span>
                                            )}
                                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white text-slate-300 dark:text-slate-600 transition-all">
                                                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1 tracking-tight">No Exact Matches</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Could not find any company matching "{search}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!search.trim() && (
                <div className="text-center pt-[15vh] pb-12 animate-in fade-in duration-1000">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4 border border-slate-100 dark:border-slate-700/50">
                        <svg className="w-5 h-5 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                        Search by Ticker or Name to instantly jump to the intelligence dossier
                    </p>
                </div>
            )}
        </div>
    );
}
