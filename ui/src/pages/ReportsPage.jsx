import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && user?.role !== 'admin') {
            navigate('/');
            return;
        }

        const fetchStats = async () => {
            try {
                const data = await api.getIngestionStatus();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchStats();
        }
    }, [user, authLoading, navigate]);

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

    if (!stats) return null;

    const { ingestion, flag_engine } = stats;
    const coveragePercent = Math.round(((ingestion.total_companies - ingestion.companies_with_data_gaps) / ingestion.total_companies) * 100) || 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 px-8 pb-12">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Reports</h1>
                    <p className="text-slate-500 dark:text-slate-400">System health, data ingestion status, and engine diagnostics.</p>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ingestion Health */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Data Completeness</div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${coveragePercent < 90 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {coveragePercent}%
                            </span>
                            <span className="text-sm text-slate-400">of {ingestion.total_companies} companies</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${coveragePercent < 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${coveragePercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Target: {ingestion.coverage_target} quarters
                        </p>
                    </div>

                    {/* Missing Data Count */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Action Required</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {ingestion.companies_with_data_gaps}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Companies need backfill
                        </div>
                    </div>

                    {/* Flag Engine */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Flag Engine Status</div>
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-300">Active Flags</span>
                                <span className="font-bold text-slate-900 dark:text-white">{flag_engine.total_active_flags}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-slate-600 dark:text-slate-300">Last Run</span>
                                <span className="text-sm text-slate-500 font-mono">
                                    {flag_engine.last_run ? new Date(flag_engine.last_run).toLocaleString() : 'Never'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed List */}
                {ingestion.at_risk_list.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Companies with Data Gaps</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
                            {ingestion.at_risk_list.map((item) => (
                                <div key={item.ticker} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <span className="font-medium text-slate-900 dark:text-white">{item.ticker}</span>
                                    <span className="text-sm text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                        Only {item.quarters} Qtrs
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
