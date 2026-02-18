
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function LoginModal({ isOpen, onClose, initialMode = "login" }) {
    const [isLogin, setIsLogin] = useState(initialMode === "login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setIsLogin(initialMode === "login");
        setError(null);
        setSuccess(null);
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (isLogin) {
                await login(email, password);
                onClose();
                navigate("/dashboard");
            } else {
                await register(email, password, name);
                setSuccess("Registration successful! We've sent a verification link to your email. Please verify to continue.");
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left shadow-2xl transition-all sm:w-full sm:max-w-md border border-slate-100">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="login-header mb-8 text-center">
                    <img src={logo} alt="Flagium" className="h-12 w-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Risk Terminal Access</h1>
                    <p className="text-sm text-slate-500 font-medium">{isLogin ? "Authenticate to Continue" : "Initialize Identity"}</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="text-center space-y-6">
                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
                            {success}
                        </div>
                        <button
                            onClick={() => {
                                setSuccess(null);
                                setIsLogin(true);
                            }}
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/10 transition-all font-sans"
                        >
                            Return to Login
                        </button>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Credential</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                placeholder="name@company.com"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Passcode</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium placeholder:text-slate-400"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg shadow-slate-900/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isLogin ? "Decrypt & Enter" : "Establish Identity"}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
                        >
                            {isLogin ? "Request Access (Register)" : "Have Access? Login"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
