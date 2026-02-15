
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="max-w-[800px] mx-auto px-8 py-16">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>

            <div className="prose prose-slate">
                <p className="text-slate-600 mb-6">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Information We Collect</h2>
                    <p className="text-slate-600 mb-4">
                        We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or communicate with us. This may include your name, email address, and payment information.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">2. How We Use Information</h2>
                    <p className="text-slate-600 mb-4">
                        We use the information we collect to operate, maintain, and improve our services, to process transactions, and to send you related information including confirmations and invoices.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Data Security</h2>
                    <p className="text-slate-600 mb-4">
                        We implement appropriate technical and organizational measures to protect specific personal data against unauthorized or unlawful processing and against accidental loss, destruction, or damage.
                    </p>
                </section>
            </div>
        </div>
    );
}
