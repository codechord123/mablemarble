import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AnimatedNumber from '../ui/AnimatedNumber.jsx'
import CoinIcon from '../ui/CoinIcon.jsx'
import AnimalFace from '../ui/AnimalFace.jsx'
import { ITEMS } from '../../utils/rules.js'

// underdog: 지금 꼴찌라 월급 1.5배를 받는 사람
export default function PlayerCard({ player, isCurrent, underdog = false }) {
  const streak = player.streak || 0
  const items = player.items || []
  const stats = player.stats || { answered: 0, correct: 0 }
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null

  // 금액 변화를 떠오르는 숫자로 보여준다. 여러 번 연속으로 바뀌어도 겹쳐 쌓인다.
  const prevMoney = useRef(player.money)
  const [deltas, setDeltas] = useState([])
  useEffect(() => {
    const diff = player.money - prevMoney.current
    prevMoney.current = player.money
    if (!diff) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setDeltas((cur) => [...cur, { id, diff }])
    const t = setTimeout(() => setDeltas((cur) => cur.filter((d) => d.id !== id)), 1000)
    return () => clearTimeout(t)
  }, [player.money])

  return (
    <div
      className={`player-card relative p-2 sm:p-2.5 rounded-xl border transition-all duration-300 ${
        isCurrent
          ? 'border-amber-400 bg-white breathe-ring scale-[1.02]'
          : 'border-amber-900/5 bg-white/70 card-soft opacity-80'
      } ${!player.alive ? 'grayscale opacity-50' : ''}`}
    >
      <AnimatePresence>
        {deltas.map(({ id, diff }) => (
          <motion.span
            key={id}
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: 1, y: -28, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-10 t-title tabular-nums whitespace-nowrap ${
              diff > 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
            style={{ textShadow: '0 1px 2px rgba(255,255,255,0.9)' }}
          >
            {diff > 0 ? '+' : '−'}
            {Math.abs(diff).toLocaleString()}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="player-card-inner">
        <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full ${player.color} flex items-center justify-center text-base sm:text-lg shadow-sm ring-2 ring-white flex-shrink-0`}>
          <AnimalFace emoji={player.avatar} className="w-[86%] h-[86%]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="t-body text-amber-800/70 truncate leading-tight">{player.name}</div>
          <div className="t-title text-amber-900 tabular-nums flex items-center gap-1 leading-tight">
            <CoinIcon size={15} /> <AnimatedNumber value={player.money} />원
          </div>
        </div>
      </div>
      {(accuracy !== null || player.islandTurnsLeft > 0 || streak >= 2 || items.length > 0 || underdog) && (
        <div className="flex items-center justify-center gap-1 flex-wrap mt-1.5 text-[10px] sm:text-xs">
          {accuracy !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              ✅ {stats.correct}/{stats.answered}
              <span className="text-emerald-500">·</span>
              {accuracy}%
            </span>
          )}
          {streak >= 2 && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-black ${
              streak >= 3 ? 'bg-orange-500 text-white combo-flame' : 'bg-orange-50 text-orange-600'
            }`}>
              🔥 {streak}연속
            </span>
          )}
          {items.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold"
              title={items.map((k) => ITEMS[k]?.name).join(', ')}>
              {items.map((k, i) => <span key={i}>{ITEMS[k]?.icon}</span>)}
            </span>
          )}
          {underdog && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold"
              title="꼴찌는 출발 월급 1.5배">
              💪 역전 찬스
            </span>
          )}
          {player.islandTurnsLeft > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-semibold">
              🏝️ {player.islandTurnsLeft}
            </span>
          )}
        </div>
      )}
      {!player.alive && <div className="text-red-500 text-xs mt-0.5 font-bold">💥 파산</div>}
    </div>
  )
}
