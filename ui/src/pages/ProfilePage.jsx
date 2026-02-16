import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-8 flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Profile</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Info Card */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 overflow-hidden relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 ring-4 ring-white dark:ring-slate-700">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.full_name || "N/A"}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{user.email}</p>

                            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Account Status</span>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold uppercase tracking-wider">Active</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">Access Level</span>
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider">{user.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Detailed Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-900 dark:text-white">Account Information</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                                        {user.full_name || "Not provided"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50" disabled>
                                    Edit Profile
                                </button>
                                <p className="mt-2 text-[10px] text-slate-400 italic">Editing profile is currently disabled for security reasons.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Security & Access</h3>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase font-bold tracking-widest">Last changed: Never</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 transition-colors group">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Change Password</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Update your login credentials regularly.</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform cursor-pointer">
                                    🔒
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-colors group">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">Session Management</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review and manage active browser sessions.</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform cursor-pointer">
                                    💻
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
