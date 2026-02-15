export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDanger = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-enter">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all
                                ${isDanger
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
