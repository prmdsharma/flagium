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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">Red Flags</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{data.count} active signals across constituency</p>
                </div>

                {/* Severity Filter */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto">
                    {[
                        { label: "All", value: null },
                        { label: "High", value: "HIGH", color: "text-red-500" },
                        { label: "Medium", value: "MEDIUM", color: "text-amber-500" },
                    ].map((f) => (
                        <button
                            key={f.label}
                            onClick={() => { setFilter(f.value); setLoading(true); }}
                            className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 ${filter === f.value ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                        >
                            {f.value === "HIGH" && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                            {f.value === "MEDIUM" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Flag Cards */}
            <div className="grid grid-cols-1 gap-4">
                {data.flags.map((f, i) => (
                    <div key={i} className="glass-card p-5 lg:p-6 group relative overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.99]">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${f.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-black font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded uppercase">{f.flag_code}</span>
                                <span
                                    className="text-lg font-black text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    onClick={() => navigate(`/company/${f.ticker}`)}
                                >
                                    {f.ticker}
                                </span>
                                <span className="hidden sm:inline-block text-xs font-bold text-slate-400 uppercase tracking-widest">— {f.flag_name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${f.severity === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                {f.severity}
                            </span>
                        </div>

                        <div className="sm:hidden mb-3 text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">
                            {f.flag_name}
                        </div>

                        <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {f.message}
                        </p>
                    </div>
                ))}
            </div>

            {data.flags.length === 0 && (
                <div className="glass-card py-20 px-6 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No Threats Detected</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">All systems nominal. No flags matching the current filter criteria.</p>
                </div>
            )}
        </>
    );
}
