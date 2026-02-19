export default function MethodologyPage() {
    return (
        <div className="bg-white py-20 px-8">
            <div className="max-w-[800px] mx-auto">
                <h1 className="text-4xl font-bold text-slate-900 mb-6">Methodology</h1>
                <p className="text-xl text-slate-600 mb-12 leading-relaxed">
                    Flagium AI applies structured, rule-based analysis to multi-quarter financial data to detect early signs of corporate deterioration.
                </p>

                <div className="space-y-16">
                    {/* Section 1 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-gray-200 pb-2">Core Risk Signals</h2>
                        <p className="text-slate-600 mb-6">
                            Flagium AI evaluates companies across key financial stress dimensions. Each signal is evaluated across multiple reporting periods to assess structural consistency.
                        </p>
                        <ul className="space-y-3 text-slate-700 font-medium list-disc pl-5">
                            <li>Interest Coverage Stability</li>
                            <li>Free Cash Flow Sustainability</li>
                            <li>Operating Cash Flow vs Net Profit Divergence</li>
                            <li>Profit Collapse Events</li>
                            <li>Revenue-Debt Divergence</li>
                        </ul>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-gray-200 pb-2">Risk Score Construction</h2>
                        <p className="text-slate-600 mb-4">
                            The Flagium AI Risk Score aggregates signal intensity and persistence across recent quarters.
                        </p>
                        <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
                            <p className="font-semibold text-slate-900 mb-2">Key Principles:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600">
                                <li>Higher scores indicate elevated structural stress.</li>
                                <li>Scores are designed for relative portfolio comparison — not price forecasting.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-gray-200 pb-2">Deterioration Acceleration Index</h2>
                        <p className="text-slate-600 mb-6">
                            Beyond static risk, Flagium AI evaluates the rate of change in financial stress. Acceleration often precedes material deterioration.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center">
                                <span className="font-bold text-green-700 block mb-1">Stable</span>
                                <span className="text-sm text-green-600">No significant change</span>
                            </div>
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-center">
                                <span className="font-bold text-yellow-700 block mb-1">Gradual Increase</span>
                                <span className="text-sm text-yellow-600">Creeping stress</span>
                            </div>
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                                <span className="font-bold text-red-700 block mb-1">Rapid Escalation</span>
                                <span className="text-sm text-red-600">Urgent warning</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-gray-200 pb-2">Escalation Probability Model</h2>
                        <p className="text-slate-600 leading-relaxed">
                            Flagium AI estimates the probability that risk conditions worsen in subsequent quarters based on historical deterioration patterns and signal clustering.
                        </p>
                        <p className="text-slate-600 mt-4 font-medium italic">
                            This is not a prediction model. It is a stress-progression assessment.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4 border-b border-gray-200 pb-2">What Flagium AI Is Not</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <li className="flex items-center gap-2 text-slate-700">
                                <span className="text-red-500 font-bold">✕</span> Not a trading system
                            </li>
                            <li className="flex items-center gap-2 text-slate-700">
                                <span className="text-red-500 font-bold">✕</span> Not price prediction
                            </li>
                            <li className="flex items-center gap-2 text-slate-700">
                                <span className="text-red-500 font-bold">✕</span> Not momentum analysis
                            </li>
                            <li className="flex items-center gap-2 text-slate-700">
                                <span className="text-red-500 font-bold">✕</span> Not investment advice
                            </li>
                        </ul>
                        <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-lg text-center">
                            <p className="text-blue-900 font-semibold text-lg">Flagium AI is a structural financial risk monitoring system.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
