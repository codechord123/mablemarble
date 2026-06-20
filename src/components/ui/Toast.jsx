import { AnimatePresence, motion } from 'framer-motion'

export default function Toast({ show, children, color = 'bg-amber-600', position = 'top' }) {
  const pos = position === 'top' ? 'top-16' : 'bottom-16'
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className={`fixed left-1/2 -translate-x-1/2 ${pos} z-40 ${color} text-white px-5 py-3 rounded-2xl font-bold shadow-2xl pointer-events-none`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
