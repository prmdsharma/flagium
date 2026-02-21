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
                            Flagium AI evaluates companies across key financial stress dimensions. Each signal is evaluated across multiple reporting periods to assess structural consistency. Our engine currently tracks 5 core flags:
                        </p>

                        <div className="space-y-6">
                            {[
                                {
                                    code: "F1", name: "Operating Cash Flow < Net Profit", category: "Earnings Quality",
                                    rule: "OCF < PAT in at least 2 of the last 3 years.",
                                    meaning: "Reported profit is not backed by actual cash generation. This can indicate aggressive revenue recognition or working capital deterioration."
                                },
                                {
                                    code: "F2", name: "Negative Free Cash Flow Streak", category: "Governance",
                                    rule: "Free Cash Flow < 0 for 3 consecutive years.",
                                    meaning: "The company is burning cash year after year, increasing reliance on external debt or equity dilution to fund operations."
                                },
                                {
                                    code: "F3", name: "Revenue-Debt Divergence", category: "Balance Sheet Stress",
                                    rule: "YoY Revenue declines AND YoY Total Debt increases.",
                                    meaning: "The company is borrowing more while its top line shrinks — a classic sign of financial deterioration and operational shortfalls."
                                },
                                {
                                    code: "F4", name: "Low Interest Coverage", category: "Balance Sheet Stress",
                                    rule: "Interest Coverage Ratio (EBIT / Interest) < 2.5x.",
                                    meaning: "The company's operating earnings are insufficient to comfortably service its debt obligations, offering a thin margin of safety."
                                },
                                {
                                    code: "F5", name: "Profit Collapse", category: "Earnings Quality",
                                    rule: "Net Profit drops by > 50% YoY.",
                                    meaning: "A sudden and significant collapse in profitability, indicating loss of competitive advantage, regulatory impact, or one-time charges."
                                }
                            ].map((flag, idx) => (
                                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black rounded">{flag.code}</span>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{flag.name}</h3>
                                        </div>
                                        <span className="hidden md:block text-slate-300 dark:text-slate-600">•</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{flag.category}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Trigger Rule:</span>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{flag.rule}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Implication:</span>
                                            <span className="text-sm text-slate-600 dark:text-slate-400">{flag.meaning}</span>
                                        </div>
                                    </div>
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
