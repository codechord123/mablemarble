import { AnimatePresence, motion } from 'framer-motion'

export default function GoldenKeyModal({ card, onConfirm }) {
  const isMission = card?.effect?.type === 'mission'

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
            className={`rounded-3xl shadow-2xl p-1 max-w-sm w-full ${
              isMission
                ? 'bg-gradient-to-br from-pink-300 to-violet-500'
                : 'bg-gradient-to-br from-yellow-300 to-amber-500'
            }`}
          >
            <div className="bg-white rounded-[20px] p-6 text-center">
              <div className="text-sm font-bold text-amber-700 tracking-widest">
                {isMission ? '🎪 미션 카드' : '🔑 황금열쇠'}
              </div>
              <div className="text-7xl my-3">{card.emoji}</div>
              <div className="text-2xl font-extrabold text-amber-900">{card.title}</div>
              <div className="mt-2 text-amber-700 text-sm">{card.description}</div>

              {isMission ? (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => onConfirm(true)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow hover:bg-emerald-700 transition"
                  >
                    ✅ 성공!
                  </button>
                  <button
                    onClick={() => onConfirm(false)}
                    className="flex-1 py-3 bg-gray-400 text-white rounded-xl font-bold shadow hover:bg-gray-500 transition"
                  >
                    😅 포기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onConfirm()}
                  className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow hover:bg-amber-700 transition"
                >
                  효과 적용
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
