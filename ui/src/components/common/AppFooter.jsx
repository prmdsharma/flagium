import { Link } from "react-router-dom";

export default function AppFooter() {
    return (
        <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-8 transition-colors duration-200">
            <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 dark:text-slate-500">

                {/* Left: Copyright */}
                <div>
                    &copy; {new Date().getFullYear()} Flagium
                </div>

                {/* Right: Links */}
                <div className="flex items-center gap-6">
                    <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        Privacy
                    </Link>
                    <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        Terms
                    </Link>
                    <span className="cursor-help hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Data is based on public financial reports. Not investment advice.">
                        Data Disclaimer
                    </span>
                </div>
            </div>
        </footer>
    );
}
