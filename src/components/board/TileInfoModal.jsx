import { AnimatePresence, motion } from 'framer-motion'
import { TILE_TYPES, BUILDING_LABELS, BUILDING_ICONS, TOLL_MULTIPLIERS } from '../../utils/boardConfig.js'
import { calculateToll } from '../../utils/gameEngine.js'
import BuildingIcon from './BuildingIcon.jsx'
import FlagIcon from './FlagIcon.jsx'

const TYPE_LABEL = {
  start: '🏁 출발', island: '🏝️ 무인도', space: '🚀 우주여행',
  tax: '💸 세금', welfare: '🎁 사회복지', golden_key: '🔑 황금열쇠',
}

export default function TileInfoModal({ tile, owner, ownerInfo, onClose }) {
  if (!tile) return null
  const isCity = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const level = ownerInfo?.houses ?? 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.7, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.7, y: 30, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl p-5 max-w-sm w-full"
        >
          <div className="text-center">
            <div className="flex items-center justify-center" style={{ height: '48px' }}>
              {isCity ? (
                level > 0 ? (
                  <BuildingIcon level={level} size={48} />
                ) : tile.country ? (
                  <span style={{ width: 56, height: 38 }}>
                    <FlagIcon code={tile.country} />
                  </span>
                ) : <span className="text-3xl">🏘️</span>
              ) : <span className="text-3xl">✨</span>}
            </div>
            <div className="text-2xl font-extrabold text-amber-900 mt-2">
              {tile.name || TYPE_LABEL[tile.type] || tile.type}
            </div>
          </div>

          {isCity && (
            <>
              <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                <div className="text-sm text-amber-800 font-semibold">땅값</div>
                <div className="text-lg font-extrabold text-amber-900">
                  💰 {tile.price.toLocaleString()}원
                </div>
              </div>

              {owner && (
                <div className="mt-2 p-3 rounded-xl border-2" style={{ borderColor: 'currentColor' }}>
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full ${owner.color} flex items-center justify-center text-sm border border-white shadow`}>
                      {owner.avatar || '●'}
                    </div>
                    <div>
                      <div className="font-bold text-amber-900">{owner.name}</div>
                      <div className="text-xs text-amber-700">
                        {BUILDING_ICONS[level]} {BUILDING_LABELS[level]}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="text-sm font-bold text-amber-900 mb-1">단계별 통행료</div>
                <div className="grid grid-cols-4 gap-1">
                  {TOLL_MULTIPLIERS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-center text-xs ${
                        idx === level ? 'bg-amber-200 ring-2 ring-amber-500' : 'bg-gray-100'
                      }`}
                    >
                      <div className="font-bold text-amber-900">{BUILDING_LABELS[idx]}</div>
                      <div className="text-amber-700">{calculateToll(tile, idx).toLocaleString()}원</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tile.type === TILE_TYPES.TAX && (
            <div className="mt-4 p-3 bg-rose-50 rounded-xl text-center">
              <div className="text-sm text-rose-800 font-semibold">차감 금액</div>
              <div className="text-lg font-extrabold text-rose-900">{tile.amount.toLocaleString()}원</div>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition"
          >
            닫기
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
