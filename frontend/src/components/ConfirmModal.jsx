/**
 * ConfirmModal — Reusable confirmation dialog.
 *
 * Props:
 *   isOpen: boolean
 *   title: string
 *   message: string
 *   confirmLabel: string
 *   cancelLabel: string
 *   onConfirm: () => void
 *   onCancel: () => void
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative glass-card max-w-sm w-full p-6 space-y-5 border border-clarion-border shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-lg font-outfit font-bold text-clarion-text mb-2">{title}</h3>
          <p className="text-sm text-clarion-muted leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost flex-1 min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger flex-1 min-h-[44px]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
