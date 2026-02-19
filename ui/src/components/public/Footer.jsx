import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <footer className="w-full bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-12 md:py-16 transition-colors duration-200">
            <div className="max-w-[1280px] mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-slate-900 dark:bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm transition-colors">
                                F
                            </div>
                            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Flagium AI</span>
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Systematic financial risk monitoring for capital preservation focused investors.
                        </p>
                    </div>

                    {/* Links 1 */}
                    <div className="col-span-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
                        <ul className="space-y-3">
                            <li><Link to="/methodology" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Methodology</Link></li>
                            <li><Link to="/login" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Login</Link></li>
                            <li><Link to="/register" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Sign Up</Link></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div className="col-span-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">About</Link></li>
                            <li><Link to="/contact" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Links 3 */}
                    <div className="col-span-1">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li><Link to="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Terms of Use</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        &copy; {new Date().getFullYear()} Flagium AI. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xl text-center md:text-right">
                        Flagium AI provides analytical signals based on publicly available financial information. It does not provide investment advice.
                    </p>
                </div>
            </div>
        </footer>
    );
}
