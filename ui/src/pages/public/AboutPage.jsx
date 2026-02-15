export default function AboutPage() {
    return (
        <div className="bg-white py-20 px-8">
            <div className="max-w-[700px] mx-auto text-center md:text-left">
                <h1 className="text-4xl font-bold text-slate-900 mb-8">About Flagium</h1>

                <p className="text-xl text-slate-700 leading-relaxed mb-6 font-medium">
                    Flagium is built by investors and engineers focused on systematic financial risk assessment and long-term capital protection.
                </p>

                <p className="text-lg text-slate-600 leading-relaxed mb-12">
                    The platform is grounded in rule-based analysis of publicly reported financial data.
                </p>

                <div className="bg-slate-50 p-8 rounded-xl border border-gray-100 text-center">
                    <p className="text-lg text-slate-800 font-bold mb-2">Our Philosophy</p>
                    <p className="text-2xl text-slate-900 font-light italic">"Downside protection first."</p>
                </div>

                <div className="mt-16 border-t border-gray-100 pt-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Why We Built This</h2>
                    <p className="text-slate-600 leading-relaxed mb-6">
                        In an age of speculative excess and noise, we saw a need for clarity. Investors often miss the structural deterioration happening beneath the surface because they are focused on price action.
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        We built Flagium to bring institutional-grade risk visibility to those who prioritize preserving their capital above all else.
                    </p>
                </div>
            </div>
        </div>
    );
}
