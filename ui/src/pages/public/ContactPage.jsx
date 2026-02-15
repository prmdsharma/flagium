
import React from 'react';

export default function ContactPage() {
    return (
        <div className="max-w-[1280px] mx-auto px-8 py-16">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Contact Us</h1>
            <p className="text-lg text-slate-600 mb-4">
                We'd love to hear from you. Please reach out to us at:
            </p>
            <a href="mailto:support@flagium.com" className="text-blue-600 hover:underline text-lg">
                support@flagium.com
            </a>

            <div className="mt-12 p-8 bg-slate-50 rounded-xl border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Support Hours</h2>
                <p className="text-slate-600">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
            </div>
        </div>
    );
}
