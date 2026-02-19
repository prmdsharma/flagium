export default function AboutPage() {
    return (
        <div className="bg-white dark:bg-slate-900 py-12 lg:py-24 px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center lg:text-left mb-16 lg:mb-24">
                    <h1 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">About <span className="text-blue-600">Flagium AI</span></h1>

                    <p className="text-xl lg:text-3xl text-slate-700 dark:text-slate-300 leading-tight mb-8 font-black uppercase max-w-2xl">
                        Built for investors who prioritize systematic capital protection.
                    </p>

                    <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-widest max-w-xl">
                        A rule-based transparency engine for publicly reported financial data.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-24">
                    <div>
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Our Philosophy</h2>
                        <div className="glass-card p-10 lg:p-16 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <p className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                                "Downside protection <span className="text-blue-600">first</span>."
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Execution</h2>
                        <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Flagium AI is built by investors and engineers who believe that clarity comes from discipline, not noise. We focus on structural deterioration that often remains hidden beneath price action.
                        </p>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-16">
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Why We Built This</h2>
                    <div className="flex flex-col lg:flex-row gap-12">
                        <p className="flex-1 text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            In an age of speculative excess, clarity is the rarest commodity. We saw a need for an institutional-grade risk visibility tool that prioritizes factual reporting over sentiment.
                        </p>
                        <p className="flex-1 text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Our goal is to provide the infrastructure for those who demand a factual basis for their risk assessments, helping to preserve long-term capital in volatile environments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
