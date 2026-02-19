
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="bg-white dark:bg-slate-900 py-12 lg:py-24 px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="space-y-12">
                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">01. Information We Collect</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or communicate with us. This may include your name, email address, and payment information.
                        </p>
                    </section>

                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">02. How We Use Information</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            We use the information we collect to operate, maintain, and improve our services, to process transactions, and to send you related information including confirmations and invoices.
                        </p>
                    </section>

                    <section className="glass-card p-8 lg:p-10">
                        <h2 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">03. Data Security</h2>
                        <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            We implement appropriate technical and organizational measures to protect specific personal data against unauthorized or unlawful processing and against accidental loss, destruction, or damage.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
