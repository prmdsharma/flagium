
import React from 'react';

export default function ContactPage() {
    return (
        <div className="bg-white dark:bg-slate-900 py-12 lg:py-24 px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center lg:text-left mb-16 lg:mb-24">
                    <h1 className="text-4xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Contact <span className="text-blue-600">Us</span></h1>
                    <p className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Connect with the transparency team.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    <div className="glass-card p-10 lg:p-12">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Inquiries</h2>
                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Email Address</span>
                            <a href="mailto:support@flagiumai.com" className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                                support@flagiumai.com
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="p-8 lg:p-12 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Support Hours</h3>
                            <p className="text-base lg:text-lg text-slate-900 dark:text-white font-black uppercase tracking-tight mb-2">Monday — Friday</p>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">9:00 AM — 5:00 PM EST</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
