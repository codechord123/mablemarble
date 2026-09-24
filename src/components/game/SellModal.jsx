// 땅 팔기 — 돈이 모자라면 파산 대신 도시를 지은 값의 절반에 판다.
// 빚을 다 갚을 때까지 하나씩 고른다. (팔아도 못 갚는 경우는 스토어가 바로 파산 처리)

import { motion } from 'framer-motion'
import { BUILDING_LABELS } from '../../utils/boardConfig.js'
import { ownedTiles, sellValue, SELL_RATE } from '../../utils/rules.js'
import TileArt from '../board/TileArt.jsx'
import AnimalFace from '../ui/AnimalFace.jsx'
import CoinIcon from '../ui/CoinIcon.jsx'

export default function SellModal({ player, ownership, onSell }) {
  const lots = ownedTiles(ownership, player.id)
    .map((l) => ({ ...l, value: sellValue(l.tile, l.level) }))
    .sort((a, b) => a.value - b.value)
  const debt = -player.money

  return (
    <div className="fixed inset-0 z-40 bg-sky-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="question-card bg-white rounded-[1.75rem] max-w-lg w-full max-h-[94dvh] overflow-y-auto"
      >
        <div className="question-banner relative px-5 pt-5 pb-6 text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #c2410c)' }}>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 shrink-0 rounded-full ${player.color} border-[3px] border-white shadow-lg flex items-center justify-center`}>
              <AnimalFace emoji={player.avatar} className="w-[92%] h-[92%]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white/85">{player.name}</div>
              <div className="text-xl sm:text-2xl font-black">돈이 모자라요! 땅을 팔아요</div>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 font-black tabular-nums">
            갚아야 할 돈 <CoinIcon size={16} /> {debt.toLocaleString()}원
          </div>
        </div>

        <div className="p-4 sm:p-5 -mt-3 bg-white rounded-t-[1.5rem] relative">
          <div className="text-xs sm:text-sm font-bold text-slate-500 mb-2">
            지은 값의 {Math.round(SELL_RATE * 100)}%를 받고 팔아요. 빚을 다 갚으면 게임이 이어져요.
          </div>
          <div className="grid gap-2">
            {lots.map(({ tile, level, value }) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => onSell(tile.id)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border-2 border-slate-200 bg-white shadow-[0_4px_0_#e2e8f0] active:translate-y-[3px] active:shadow-none text-left"
              >
                <span className="h-11 w-11 shrink-0"><TileArt artKey={tile.country} alt="" className="h-full w-auto" /></span>
                <span className="flex-1 min-w-0">
                  <span className="block font-black text-slate-800 truncate">{tile.name}</span>
                  <span className="block text-xs font-bold text-slate-500">{BUILDING_LABELS[level]}</span>
                </span>
                <span className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-black tabular-nums">
                  +{value.toLocaleString()}원
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
