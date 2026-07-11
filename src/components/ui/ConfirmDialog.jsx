import { AnimatePresence, motion } from 'framer-motion'
import GameButton from './GameButton.jsx'

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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.7, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[1.75rem] shadow-2xl ring-1 ring-amber-900/5 p-6 max-w-sm w-full"
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
              <GameButton color="gray" onClick={onCancel} className="py-3">
                {cancelLabel}
              </GameButton>
              <GameButton color={variant === 'danger' ? 'red' : 'amber'} onClick={onConfirm} className="py-3">
                {confirmLabel}
              </GameButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
