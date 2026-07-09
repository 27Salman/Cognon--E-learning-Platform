import { Bell } from 'lucide-react';

export default function CallRequestModal({ requestData, onStartCall, onDismiss }) {
    if (!requestData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">

            {/* Slide-up card */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">

                {/* Header bar */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Call Request</p>
                        <p className="text-white font-semibold text-sm">from a Student</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xl flex-shrink-0">
                            {requestData.requesterName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 text-base">{requestData.requesterName}</p>
                            <p className="text-sm text-gray-500">is requesting a video call with you</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {/* Dismiss */}
                        <button
                            onClick={onDismiss}
                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            Dismiss
                        </button>

                        {/* Start Call */}
                        <button
                            onClick={onStartCall}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                            🎥 Start Call
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
