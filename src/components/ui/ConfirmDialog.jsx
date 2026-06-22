import { AnimatePresence, motion } from 'framer-motion'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default', // 'default' | 'danger'
  onConfirm,
  onCancel,
}) {
  const confirmColor =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700'
      : 'bg-amber-600 hover:bg-amber-700'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full"
          >
            {title && (
              <div className="text-xl font-extrabold text-amber-900 text-center">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm text-amber-800 mt-2 text-center">{description}</div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                onClick={onCancel}
                className="py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`py-3 text-white rounded-xl font-bold shadow transition ${confirmColor}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
