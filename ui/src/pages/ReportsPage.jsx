import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [sanity, setSanity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('health'); // 'health' or 'sanity'

    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const [statsData, sanityData] = await Promise.all([
                    api.getIngestionStatus(),
                    api.getSanityReport()
                ]);
                setStats(statsData);
                setSanity(sanityData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchData();
        }
    }, [user, authLoading, navigate]);

    const [scanLoading, setScanLoading] = useState(false);
    const [ingestLoading, setIngestLoading] = useState(null); // Ticker or null

    const handleRunScan = async () => {
        if (!confirm("Are you sure you want to trigger a full flag engine scan? This happens in the background.")) return;
        setScanLoading(true);
        try {
            await api.triggerScan();
            alert("Scan triggered successfully.");
        } catch (err) {
            alert("Failed to trigger scan: " + err.message);
        } finally {
            setScanLoading(false);
        }
    };

    const handleRunIngest = async (ticker) => {
        setIngestLoading(ticker);
        try {
            await api.triggerIngest(ticker);
            alert(`Ingestion triggered for ${ticker}.`);
        } catch (err) {
            alert(`Failed to trigger ingestion for ${ticker}: ` + err.message);
        } finally {
            setIngestLoading(null);
        }
    };

    const [fullIngestLoading, setFullIngestLoading] = useState(false);

    const handleFullIngest = async () => {
        if (!confirm("Are you sure you want to trigger a full ingestion for all companies? This will run in the background.")) return;
        setFullIngestLoading(true);
        try {
            await api.triggerFullIngestion();
            alert("Full ingestion triggered successfully.");
            // Refresh data after a short delay to see 'running' status
            setTimeout(async () => {
                const statsData = await api.getIngestionStatus();
                setStats(statsData);
            }, 1000);
        } catch (err) {
            alert("Failed to trigger full ingestion: " + err.message);
        } finally {
            setFullIngestLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 px-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!stats || !sanity) return null;

    const { ingestion, flag_engine, system_jobs = {} } = stats;
    const coveragePercent = Math.round(((ingestion.total_companies - ingestion.companies_with_data_gaps) / ingestion.total_companies) * 100) || 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 px-8 pb-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Admin Console</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">System Health & Data Integrity</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-fit">
                        <button
                            onClick={() => setActiveTab('health')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'health' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            System Health
                        </button>
                        <button
                            onClick={() => setActiveTab('sanity')}
                            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sanity' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Data Sanity
                        </button>
                    </div>
                </div>

                {activeTab === 'health' ? (
                    <>
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Ingestion Health */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Data Completeness</div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-black ${coveragePercent < 90 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {coveragePercent}%
                                    </span>
                                    <span className="text-sm font-medium text-slate-400">of {ingestion.total_companies} companies</span>
                                </div>
                                <div className="w-full bg-slate-50 dark:bg-slate-900 h-3 rounded-full mt-4 overflow-hidden border border-slate-100 dark:border-slate-700">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${coveragePercent < 90 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`}
                                        style={{ width: `${coveragePercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        Target: {ingestion.coverage_target} Qtrs
                                    </p>
                                    <div className="text-4xl font-black text-slate-900 dark:text-white">
                                        {ingestion.companies_with_data_gaps}
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Gaps</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ingestion Job Status */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        Ingestion Job
                                        {system_jobs['Ingestion Job']?.status === 'running' && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-black uppercase tracking-widest ${system_jobs['Ingestion Job']?.status === 'running' ? 'text-blue-500' :
                                                    system_jobs['Ingestion Job']?.status === 'completed' ? 'text-emerald-500' :
                                                        system_jobs['Ingestion Job']?.status === 'failed' ? 'text-red-500' : 'text-slate-400'
                                                    }`}>
                                                    {system_jobs['Ingestion Job']?.status || 'IDLE'}
                                                </span>
                                            </div>
                                        </div>
                                        {system_jobs['Ingestion Job']?.message && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Logs</span>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono line-clamp-2 leading-relaxed italic">
                                                    "{system_jobs['Ingestion Job'].message}"
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Run</span>
                                            <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                                                {system_jobs['Ingestion Job']?.last_run_start ? new Date(system_jobs['Ingestion Job'].last_run_start).toLocaleString() : 'Never'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleFullIngest}
                                    disabled={fullIngestLoading || system_jobs['Ingestion Job']?.status === 'running'}
                                    className={`mt-6 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all transform active:scale-95 ${fullIngestLoading || system_jobs['Ingestion Job']?.status === 'running'
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 shadow-md'}`}
                                >
                                    {fullIngestLoading ? 'Initializing...' : system_jobs['Ingestion Job']?.status === 'running' ? 'Job In Progress' : 'Start Full Ingestion'}
                                </button>
                            </div>

                            {/* Flag Engine Status */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        Flag Engine
                                        {system_jobs['Flag Engine Job']?.status === 'running' && (
                                            <span className="flex h-2 w-2 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Detection</span>
                                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-widest">{flag_engine.total_active_flags} <span className="text-xs text-slate-400 -ml-1">Flgs</span></span>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                                <span className={`text-xs font-black uppercase tracking-widest ${system_jobs['Flag Engine Job']?.status === 'running' ? 'text-blue-500' :
                                                    system_jobs['Flag Engine Job']?.status === 'completed' ? 'text-emerald-500' : 'text-slate-400'
                                                    }`}>
                                                    {system_jobs['Flag Engine Job']?.status || 'IDLE'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Execution</span>
                                            <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-700">
                                                {flag_engine.last_run ? new Date(flag_engine.last_run).toLocaleString() : 'Never'}
                                            </span>
                                        </div>
                                        {system_jobs['Flag Engine Job']?.message && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Summary</span>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono line-clamp-1 leading-relaxed italic">
                                                    "{system_jobs['Flag Engine Job'].message}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleRunScan}
                                    disabled={scanLoading || system_jobs['Flag Engine Job']?.status === 'running'}
                                    className={`mt-6 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all transform active:scale-95 ${scanLoading || system_jobs['Flag Engine Job']?.status === 'running'
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20'}`}
                                >
                                    {scanLoading ? 'Initializing...' : system_jobs['Flag Engine Job']?.status === 'running' ? 'Scanning...' : 'Trigger Engine Scan'}
                                </button>
                            </div>
                        </div>

                        {/* Detailed List */}
                        {ingestion.at_risk_list.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Priority Gaps
                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-full">Manual Ingestion Recommended</span>
                                    </h3>
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {ingestion.at_risk_list.map((item) => (
                                        <div key={item.ticker} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <div className="flex items-center gap-6">
                                                <span className="font-black text-slate-900 dark:text-white tracking-widest">{item.ticker}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Availability</span>
                                                    <span className="text-sm text-slate-600 dark:text-slate-300 font-bold">
                                                        {item.quarters} of {ingestion.coverage_target} Quarters
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRunIngest(item.ticker)}
                                                disabled={ingestLoading === item.ticker}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${ingestLoading === item.ticker ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-800'}`}
                                            >
                                                {ingestLoading === item.ticker ? 'Ingesting...' : 'Ingest Missing Data'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Sanity Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SanityCard
                                title="Duplicate Records"
                                value={sanity.summary.total_duplicates}
                                status={sanity.summary.total_duplicates > 0 ? 'critical' : 'success'}
                                subtitle="Financial records with identical periods"
                            />
                            <SanityCard
                                title="Total Data Gaps"
                                value={sanity.summary.companies_missing_data}
                                status={sanity.summary.companies_missing_data > 0 ? 'amber' : 'success'}
                                subtitle="Companies with 0 financial records"
                            />
                            <SanityCard
                                title="Symmetry Issues"
                                value={sanity.summary.symmetry_discrepancies}
                                status={sanity.summary.symmetry_discrepancies > 0 ? 'amber' : 'success'}
                                subtitle="Annual != SUM(Quarters) discrepancies"
                            />
                        </div>

                        {/* Synthesis Discrepancies Table */}
                        {sanity.discrepancies.length > 0 && (
                            <div className="glass-card overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-red-500 text-white">
                                    <h3 className="font-black flex items-center gap-2 uppercase tracking-widest text-xs">
                                        Symmetry Discrepancies
                                        <span className="px-2 py-0.5 bg-white text-red-600 text-[9px] font-black uppercase rounded animate-pulse">Critical</span>
                                    </h3>
                                    <p className="text-[10px] opacity-80 mt-1 font-bold tracking-tight uppercase">Manual Data Correction Required</p>
                                </div>
                                <div className="overflow-x-auto scrollbar-hide">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticker</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Year</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Revenue</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Σ Quarters</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Difference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {sanity.discrepancies.map((d, i) => {
                                                const diff = Math.abs(d.annual_rev - d.sum_q_rev);
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                                        <td className="px-6 py-4 font-black text-slate-900 dark:text-white tracking-widest">{d.ticker}</td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">{d.year}</td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">{(d.annual_rev / 1e7).toFixed(2)} Cr</td>
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white">{(d.sum_q_rev / 1e7).toFixed(2)} Cr</td>
                                                        <td className="px-6 py-4 text-xs font-black text-red-500 text-right uppercase">
                                                            {((diff / d.annual_rev) * 100).toFixed(1)}% error
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Flag Stats */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">Flag Distribution Heatmap</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {sanity.flag_stats.map((f, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{f.flag_name}</span>
                                            <span className="text-lg font-black text-slate-900 dark:text-white">{f.companies} <span className="text-xs text-slate-400 font-medium tracking-normal">cos</span></span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black ${f.coverage > 50 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                            {f.coverage.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SanityCard({ title, value, status, subtitle }) {
    const statusColors = {
        success: 'text-emerald-500',
        critical: 'text-red-500 bg-red-50 dark:bg-red-900/10',
        amber: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10'
    };

    return (
        <div className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm ${status === 'success' ? 'bg-white dark:bg-slate-800' : statusColors[status]} transition-all hover:scale-[1.02]`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</div>
            <div className={`text-4xl font-black ${status === 'success' ? 'text-emerald-500' : ''}`}>{value}</div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-tight">{subtitle}</p>
        </div>
    );
}
