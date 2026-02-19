
import React from 'react';

export default function TermsPage() {
    return (
        <div className="bg-white dark:bg-slate-900 py-12 lg:py-24 px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Terms of Use</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-12">
                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">01. Acceptance of Terms</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            By accessing or using Flagium AI, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                        </p>
                    </section>

                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">02. Use License</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Permission is granted to temporarily download one copy of the materials (information or software) on Flagium AI's website for personal, non-commercial transitory viewing only.
                        </p>
                    </section>

                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">03. Disclaimer</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">
                            The materials on Flagium AI's website are provided on an 'as is' basis. Flagium AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest text-center">
                                Flagium AI is for informational purposes only and does not constitute financial advice.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
