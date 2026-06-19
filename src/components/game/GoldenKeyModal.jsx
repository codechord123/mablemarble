import { AnimatePresence, motion } from 'framer-motion'

export default function GoldenKeyModal({ card, onConfirm }) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ rotateY: -90, scale: 0.5 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            className="bg-gradient-to-br from-yellow-300 to-amber-500 rounded-3xl shadow-2xl p-1 max-w-sm w-full"
          >
            <div className="bg-white rounded-[20px] p-6 text-center">
              <div className="text-sm font-bold text-amber-700 tracking-widest">🔑 황금열쇠</div>
              <div className="text-7xl my-3">{card.emoji}</div>
              <div className="text-2xl font-extrabold text-amber-900">{card.title}</div>
              <div className="mt-2 text-amber-700">{card.description}</div>
              <button
                onClick={onConfirm}
                className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow hover:bg-amber-700 transition"
              >
                효과 적용
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
