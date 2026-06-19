import { motion } from 'framer-motion'
import { BOARD, TILE_TYPES } from '../../utils/boardConfig.js'

export default function SpaceTravelModal({ onPick, onCancel }) {
  const cities = BOARD.filter(
    (t) => t.type === TILE_TYPES.CITY || t.type === TILE_TYPES.LANDMARK,
  )

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full"
      >
        <div className="text-center">
          <div className="text-5xl">🚀</div>
          <h3 className="text-2xl font-extrabold text-amber-900 mt-2">우주여행</h3>
          <p className="text-amber-700 mt-1">이동할 도시를 선택하세요.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {cities.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className={`p-3 rounded-xl border-2 text-left hover:bg-amber-50 transition ${
                t.type === TILE_TYPES.LANDMARK ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="font-bold text-amber-900">{t.name}</div>
              <div className="text-xs text-gray-600">
                {t.type === TILE_TYPES.LANDMARK && '🏛️ '}
                {t.price.toLocaleString()}원 · 난이도 {'★'.repeat(t.difficulty)}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="mt-4 w-full py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold"
        >
          이동 안 함 (제자리)
        </button>
      </motion.div>
    </div>
  )
}
