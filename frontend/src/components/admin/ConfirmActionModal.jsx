import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function ConfirmActionModal({
  isOpen,
  action,
  userName,
  onConfirm,
  onClose,
  loading,
}) {
  if (!isOpen) return null;

  const isBlock = action === "block";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        {/* Icon */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              isBlock ? "bg-red-100" : "bg-green-100"
            }`}
          >
            {isBlock ? (
              <AlertTriangle className="w-7 h-7 text-red-600" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-green-600" />
            )}
          </div>

          <h2 className="text-lg font-semibold text-gray-800 text-center">
            {isBlock ? "Block User" : "Unblock User"}
          </h2>

          <p className="text-sm text-gray-500 text-center mt-2">
            {isBlock ? (
              <>
                Are you sure you want to block{" "}
                <span className="font-medium text-gray-700">{userName}</span>?
                They will no longer be able to access the platform.
              </>
            ) : (
              <>
                Are you sure you want to unblock{" "}
                <span className="font-medium text-gray-700">{userName}</span>?
                They will regain access to the platform.
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
              isBlock
                ? "bg-red-600 hover:bg-red-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading
              ? isBlock
                ? "Blocking..."
                : "Unblocking..."
              : isBlock
                ? "Yes, Block"
                : "Yes, Unblock"}
          </button>
        </div>
      </div>
    </div>
  );
}
