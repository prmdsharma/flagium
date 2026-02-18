import { Link, useOutletContext } from "react-router-dom";

export default function LandingPage() {
    const { onOpenAuthModal } = useOutletContext();

    return (
        <div className="bg-[#F9FAFB]">
            {/* 1. HERO SECTION */}
            <section className="pt-20 pb-32 px-8">
                <div className="max-w-[1280px] mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                        Built for Capital Preservation, <br className="hidden md:block" />
                        <span className="text-slate-500">Not Speculation.</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Flagium monitors structural financial deterioration in listed companies using objective, rules-based risk signals — so investors can detect trouble before it becomes collapse.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => onOpenAuthModal("register")}
                            className="h-12 px-8 bg-slate-900 text-white font-semibold rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            Create Free Account
                        </button>
                        <Link
                            to="/methodology"
                            className="h-12 px-8 bg-white text-slate-700 font-semibold rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            View Sample Analysis
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. THE PROBLEM */}
            <section className="py-20 px-8 bg-white border-t border-b border-gray-100">
                <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                            Most Collapses Signal Early. <br />
                            <span className="text-red-600">Few Investors Notice.</span>
                        </h2>
                        <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                            <p>
                                Corporate failures rarely happen overnight. They deteriorate quietly across quarters — through weakening cash flows, rising leverage, earnings inconsistencies, and structural stress.
                            </p>
                            <p>
                                By the time the price reflects the risk, the damage is already done.
                            </p>
                            <p className="font-medium text-slate-900">
                                Flagium exists to monitor that deterioration — systematically.
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-8 border border-gray-200 shadow-sm">
                        {/* Visual Abstract of Deterioration */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                                <span className="font-medium text-slate-700">Earnings Quality</span>
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">DETERIORATING</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 opacity-80">
                                <span className="font-medium text-slate-700">Cash Flow Yield</span>
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">WEAKENING</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 opacity-60">
                                <span className="font-medium text-slate-700">Interest Coverage</span>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">STRESS</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. WHAT FLAGIUM DOES */}
            <section className="py-20 px-8">
                <div className="max-w-[1280px] mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Systematic Downside Risk Monitoring</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            No noise. No price prediction. Only financial stress visibility.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Earnings Stress Detection</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Identifies profit collapses, operating cash flow inconsistencies, and weakening coverage ratios.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Balance Sheet Pressure</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Tracks leverage divergence and structural debt expansion against revenue trends.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                            <div className="w-12 h-12 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Deterioration Acceleration</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Measures whether risk is stable, increasing gradually, or accelerating rapidly.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. HOW IT WORKS */}
            <section className="py-20 px-8 bg-white border-t border-gray-100">
                <div className="max-w-[1280px] mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Simple Workflow. Institutional Depth.</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gray-100 -z-10"></div>

                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border-4 border-white shadow-sm">1</div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Add your portfolio</h3>
                            <p className="text-slate-600">Enter your holdings or watchlist tickers securely.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border-4 border-white shadow-sm">2</div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Engine scans financials</h3>
                            <p className="text-slate-600">Flagium analyzes multi-quarter financial data automatically.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6 border-4 border-white shadow-sm">3</div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Receive risk signals</h3>
                            <p className="text-slate-600">Risk scores and deterioration trends are generated instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. WHO IT'S FOR */}
            <section className="py-20 px-8">
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl p-12 text-center md:text-left md:flex items-center justify-between shadow-xl">
                    <div className="mb-8 md:mb-0">
                        <h2 className="text-3xl font-bold text-white mb-6">Designed for Serious Investors</h2>
                        <ul className="space-y-3 text-slate-300">
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Capital preservation focused investors
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Independent advisors
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Family offices
                            </li>
                            <li className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Long-term equity allocators
                            </li>
                        </ul>
                    </div>
                    <div className="md:w-1/3 border-l border-slate-700 pl-0 md:pl-12">
                        <p className="text-lg text-white font-medium italic">
                            "If you prioritize downside protection over speculation — Flagium is built for you."
                        </p>
                    </div>
                </div>
            </section>

            {/* 6. WHY FLAGIUM */}
            <section className="py-20 px-8 bg-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Clarity Over Noise</h2>
                    <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                        Markets react to price. Flagium monitors financial structure. <br />
                        Instead of asking <span className="text-slate-900 font-semibold">"Will it go up?"</span> <br />
                        We ask <span className="text-slate-900 font-semibold">"Is structural risk increasing?"</span>
                    </p>
                    <p className="text-lg font-bold text-blue-600">That distinction matters.</p>
                </div>
            </section>

            {/* 7. ABOUT FLAGIUM */}
            <section className="py-20 px-8 bg-[#F9FAFB] border-t border-gray-100">
                <div className="max-w-2xl mx-auto text-center">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">About</h4>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        Flagium is built by investors and engineers focused on systematic financial risk assessment and long-term capital protection.
                    </p>
                    <p className="text-slate-600">
                        The platform is grounded in rule-based analysis of publicly reported financial data. <br />
                        No predictions. No speculation. Only structured risk visibility.
                    </p>
                </div>
            </section>
        </div>
    );
}
