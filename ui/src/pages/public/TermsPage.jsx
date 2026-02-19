
import React from 'react';

export default function TermsPage() {
    return (
        <div className="max-w-[800px] mx-auto px-8 py-16">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Terms of Use</h1>

            <div className="prose prose-slate">
                <p className="text-slate-600 mb-6">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                    <p className="text-slate-600 mb-4">
                        By accessing or using Flagium AI, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Use License</h2>
                    <p className="text-slate-600 mb-4">
                        Permission is granted to temporarily download one copy of the materials (information or software) on Flagium AI's website for personal, non-commercial transitory viewing only.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Disclaimer</h2>
                    <p className="text-slate-600 mb-4">
                        The materials on Flagium AI's website are provided on an 'as is' basis. Flagium AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                    </p>
                    <p className="text-slate-600 font-medium">
                        Flagium AI is for informational purposes only and does not constitute financial advice.
                    </p>
                </section>
            </div>
        </div>
    );
}
