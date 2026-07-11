import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import GameButton from '../ui/GameButton.jsx'

function StatBar({ stats }) {
  if (!stats || stats.answered === 0) {
    return <div className="text-xs text-gray-500">문제 풀이 기록 없음</div>
  }
  const rate = Math.round((stats.correct / stats.answered) * 100)
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span>정답률</span>
        <span className="font-bold text-amber-900">
          {stats.correct}/{stats.answered} ({rate}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-emerald-500 h-full" style={{ width: `${rate}%` }} />
      </div>
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="mt-1 text-gray-600">
          {Object.entries(stats.byCategory).map(([cat, s]) => (
            <span key={cat} className="mr-2">
              {cat} {s.correct}/{s.answered}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function shootConfetti() {
  const duration = 3000
  const end = Date.now() + duration
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } })
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

export default function GameOverScreen({ players, ownership, onRestart, onRematch }) {
  useEffect(() => { shootConfetti() }, [])

  const tilesByOwner = {}
  for (const info of Object.values(ownership)) {
    tilesByOwner[info.ownerId] = (tilesByOwner[info.ownerId] || 0) + 1
  }

  const ranked = [...players]
    .map((p) => ({ ...p, tileCount: tilesByOwner[p.id] || 0 }))
    .sort((a, b) => (b.alive - a.alive) || (b.money - a.money))

  const winner = ranked[0]

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-[1.75rem] shadow-2xl ring-1 ring-amber-900/5 p-8 max-w-lg w-full"
      >
        <div className="text-center">
          <div className="text-7xl">🏆</div>
          <div className="text-3xl font-extrabold text-amber-900 mt-2">게임 종료!</div>
          <div className="mt-2 text-xl">
            우승: <strong className={`${winner.color.replace('bg-', 'text-')}`}>{winner.name}</strong>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {ranked.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-xl border-2 ${
                i === 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-500 w-6">{i + 1}위</span>
                  <span className={`h-8 w-8 rounded-full ${p.color} flex items-center justify-center text-base shadow`}>
                    {p.avatar || '●'}
                  </span>
                  <span className="font-bold text-amber-900">{p.name}</span>
                  {!p.alive && <span className="text-rose-500 text-xs">파산</span>}
                </div>
                <div className="text-sm text-gray-700">
                  💰 {p.money.toLocaleString()} · 🏘️ {p.tileCount}
                </div>
              </div>
              <StatBar stats={p.stats} />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {onRematch && (
            <GameButton color="green" onClick={onRematch} className="w-full py-3">
              🔁 같은 친구들로 다시
            </GameButton>
          )}
          <GameButton color="amber" onClick={onRestart} className="w-full py-3">
            🏠 메인 메뉴
          </GameButton>
        </div>
      </motion.div>
    </div>
  )
}
