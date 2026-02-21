import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/register") {
            setIsLogin(false);
        }
    }, [location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (isLogin) {
                await login(email, password);
                navigate("/dashboard");
            } else {
                await register(email, password, name);
                navigate("/registration-success");
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <img src={logo} alt="Flagium AI" className="mx-auto h-12 w-auto mb-6" />
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Risk Terminal Access
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        {isLogin ? "Authenticate" : "Initialize Identity"}
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium text-red-800 dark:text-red-400">
                            {error}
                        </p>
                    </div>
                )}

                {success && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800 text-center">
                        <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-4">
                            {success}
                        </p>
                        <button
                            className="text-sm font-semibold text-green-700 dark:text-green-500 hover:underline"
                            onClick={() => {
                                setSuccess(null);
                                setIsLogin(true);
                            }}
                        >
                            Return to Login
                        </button>
                    </div>
                )}

                {!success && (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Email Credential</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">Passcode</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono tracking-[0.3em]"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 shadow-md shadow-blue-500/30"
                            >
                                {isLogin ? "Decrypt & Enter" : "Establish Identity"}
                            </button>
                        </div>
                    </form>
                )}

                {!success && (
                    <div className="flex items-center justify-between text-sm mt-6">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
                        >
                            {isLogin ? "Request Access (Register)" : "Have Access? Login"}
                        </button>
                        {isLogin && (
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors focus:outline-none"
                            >
                                Forgot Password?
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
