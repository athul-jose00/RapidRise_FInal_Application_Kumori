import React from "react";

export default function ConfirmModal({
  isOpen,
  title,
  description,
  onClose,
  onPrimary,
  onDanger,
  primaryLabel = "Confirm",
  dangerLabel = "Delete Permanently",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          {onPrimary && (
            <button
              onClick={onPrimary}
              className="px-4 py-2 rounded-xl bg-white text-sm font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              {primaryLabel}
            </button>
          )}

          {onDanger && (
            <button
              onClick={onDanger}
              className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700"
            >
              {dangerLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
