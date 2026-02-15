
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NotificationDropdown({ isOpen, onClose, notifications, onMarkAllRead }) {
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
                {notifications.length > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                        <div className="mx-auto h-10 w-10 text-slate-300 mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /><path d="M4 2C2.8 3.7 2 5.7 2 8" /><path d="M22 8c0-2.3-.8-4.3-2-6" /></svg>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">No new alerts</p>
                        <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-50">
                        {notifications.map((notif) => (
                            <li key={notif.id}>
                                <Link
                                    to={notif.link}
                                    className="block px-4 py-3 hover:bg-slate-50 transition-colors group relative"
                                    onClick={onClose}
                                >
                                    {!notif.read && (
                                        <span className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r"></span>
                                    )}
                                    <div className={`flex gap-3 ${!notif.read ? 'pl-2' : ''}`}>
                                        {/* Icon based on severity or type */}
                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.severity === 'CRITICAL' || notif.severity === 'HIGH' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' :
                                                notif.severity === 'MEDIUM' || notif.severity === 'ELEVATED' ? 'bg-amber-500' :
                                                    'bg-blue-500'
                                            }`} />

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {notif.heading || notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                                {notif.message || notif.description}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                                <span>{notif.timeAgo}</span>
                                                {notif.company && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-medium text-slate-600">{notif.company}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <Link to="/flags" className="block w-full py-1.5 text-center text-xs text-slate-500 hover:text-slate-800 font-medium rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all" onClick={onClose}>
                    View Alert History
                </Link>
            </div>
        </div>
    );
}
