import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email securely...');

    useEffect(() => {
        if (token) {
            api.verifyEmail(token)
                .then(res => {
                    setStatus('success');
                    setMessage(res.message || 'Email verified successfully!');
                    // Redirect to login after 3 seconds
                    setTimeout(() => navigate('/login'), 3000);
                })
                .catch(err => {
                    setStatus('error');
                    setMessage(err.message || 'Verification failed. The link may be invalid or expired.');
                });
        }
    }, [token, navigate]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Email Verification
                    </h2>
                </div>

                <div className="mt-8">
                    {status === 'verifying' && (
                        <div className="text-center py-6">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 mb-4"></div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {message}
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-6 border border-green-200 dark:border-green-800/50 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-md font-bold text-green-800 dark:text-green-400 mb-2">
                                {message}
                            </p>
                            <p className="text-sm font-medium text-green-600 dark:text-green-500/80 animate-pulse">
                                Redirecting to login shortly...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-6 border border-red-200 dark:border-red-800/50 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
                                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-6">
                                {message}
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 shadow-lg shadow-slate-200/50 dark:shadow-blue-900/20"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
