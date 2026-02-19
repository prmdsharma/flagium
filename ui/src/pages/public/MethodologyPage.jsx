export default function MethodologyPage() {
    return (
        <div className="bg-white dark:bg-slate-900 py-12 lg:py-24 px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-16 text-center lg:text-left">
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Methodology</h1>
                    <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        Flagium AI applies structured, rule-based analysis to multi-quarter financial data to detect early signs of corporate deterioration.
                    </p>
                </div>

                <div className="space-y-24 lg:space-y-32">
                    {/* Section 1 */}
                    <section className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600 rounded-full hidden lg:block"></div>
                        <h2 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-8">01. Core Risk Signals</h2>
                        <p className="text-base lg:text-lg text-slate-700 dark:text-slate-300 mb-10 leading-relaxed font-medium">
                            Flagium AI evaluates companies across key financial stress dimensions. Each signal is evaluated across multiple reporting periods to assess structural consistency.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                "Interest Coverage Stability",
                                "Free Cash Flow Sustainability",
                                "Operating Cash Flow vs Net Profit Divergence",
                                "Profit Collapse Events",
                                "Revenue-Debt Divergence"
                            ].map((signal, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{signal}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full hidden lg:block"></div>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8">02. Risk Score Construction</h2>
                        <div className="lg:flex gap-12 items-start">
                            <div className="flex-1 mb-8 lg:mb-0">
                                <p className="text-base lg:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                    The Flagium AI Risk Score aggregates signal intensity and persistence across recent quarters, providing a standardized metric for cross-portfolio analysis.
                                </p>
                            </div>
                            <div className="lg:w-[400px] bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Key Principles</h4>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <span className="text-blue-500">→</span>
                                        <span className="text-sm text-slate-400 font-bold leading-relaxed">Higher scores indicate elevated structural stress.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-blue-500">→</span>
                                        <span className="text-sm text-slate-400 font-bold leading-relaxed">Scores are designed for relative portfolio comparison — not price forecasting.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-red-500 rounded-full hidden lg:block"></div>
                        <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.2em] mb-8">03. Deterioration Acceleration</h2>
                        <p className="text-base lg:text-lg text-slate-700 dark:text-slate-300 mb-12 leading-relaxed font-medium">
                            Beyond static risk, Flagium AI evaluates the rate of change in financial stress. Acceleration often precedes material deterioration.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:border-emerald-500/30">
                                <div className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Stable
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase">No significant change</span>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:border-amber-500/30">
                                <div className="text-amber-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Gradual
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Creeping stress</span>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:border-red-500/30">
                                <div className="text-red-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    Escalating
                                </div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Urgent warning</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="bg-slate-50 dark:bg-slate-800/30 p-8 lg:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-10">What Flagium AI Is Not</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
                            {[
                                "A Trading System",
                                "Price Prediction",
                                "Momentum Analysis",
                                "Investment Advice"
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black">✕</div>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                            <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Flagium AI is a structural financial risk monitoring system.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
