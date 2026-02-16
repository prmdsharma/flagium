import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function ProfilePage() {
    const { user } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.full_name || "");
    const [isSaving, setIsSaving] = useState(false);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ old: "", new: "", confirm: "" });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const [sessionInfo, setSessionInfo] = useState({
        browser: "Unknown",
        os: "Unknown",
        lastActive: new Date().toLocaleString()
    });

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "");
        }

        // Basic Session Info
        const ua = navigator.userAgent;
        let browser = "Other";
        if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

        let os = "Other";
        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";

        setSessionInfo({
            browser,
            os,
            lastActive: new Date().toLocaleString()
        });
    }, [user]);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await api.updateProfile(fullName);
            setIsEditing(false);
            alert("Profile updated successfully! Refreshing data...");
            window.location.reload();
        } catch (err) {
            alert("Failed to update profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError("Passwords do not match");
            return;
        }
        setPasswordLoading(true);
        setPasswordError("");
        try {
            await api.changePassword(passwordData.old, passwordData.new);
            setPasswordSuccess("Password changed successfully!");
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess("");
                setPasswordData({ old: "", new: "", confirm: "" });
            }, 2000);
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <div className="mb-8 flex items-baseline justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">User Profile</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Info Card */}
                <div className="md:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 overflow-hidden relative group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-4 ring-4 ring-white dark:ring-slate-700 transform transition-transform group-hover:rotate-12">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{user.full_name || "New User"}</h2>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{user.email}</p>

                            <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</span>
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Detailed Settings */}
                <div className="md:col-span-2 space-y-8">
                    {/* Account Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Account Information</h3>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold">
                                            {user.full_name || "Not provided"}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <div className="px-5 py-3 bg-slate-100/30 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 font-bold italic">
                                        {user.email}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Email cannot be changed manually</p>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-4 flex gap-3">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        onClick={() => { setIsEditing(false); setFullName(user.full_name || ""); }}
                                        className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security & Access */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Security & Access</h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-400/50 dark:hover:border-blue-400/50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                        🔒
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm">Change Password</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5">Keep your account secure with a strong password.</p>
                                    </div>
                                </div>
                                <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors">
                                    →
                                </div>
                            </div>

                            <div className="p-5 bg-slate-100/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-5 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-xl">
                                        💻
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-sm">Active Session</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-0.5">Information about your current browser session.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">OS / Platform</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{sessionInfo.os}</span>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Browser</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{sessionInfo.browser}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Update Password</h3>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-8 space-y-5">
                            {passwordError && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl text-center">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl text-center">
                                    {passwordSuccess}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.old}
                                    onChange={(e) => setPasswordData({ ...passwordData, old: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {passwordLoading ? "Updating..." : "Update Password"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 font-black text-xs uppercase tracking-widest rounded-xl text-slate-500 dark:text-slate-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
