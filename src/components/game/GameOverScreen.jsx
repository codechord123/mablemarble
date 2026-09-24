import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import GameButton from '../ui/GameButton.jsx'
import AnimalFace from '../ui/AnimalFace.jsx'
import MathText from '../ui/MathText.jsx'
import { formatAnswer } from './ResultBanner.jsx'
import { netWorth } from '../../utils/rules.js'

// 단원(분류)별 정답률 막대 + 오답 노트
function StatBar({ stats }) {
  const [open, setOpen] = useState(false)
  if (!stats || stats.answered === 0) {
    return <div className="text-xs text-gray-500">문제 풀이 기록 없음</div>
  }
  const rate = Math.round((stats.correct / stats.answered) * 100)
  const wrong = stats.wrong || []
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-slate-600">정답률</span>
        <span className="font-bold text-amber-900">
          {stats.correct}/{stats.answered} ({rate}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div className="bg-emerald-500 h-full" style={{ width: `${rate}%` }} />
      </div>
      {Object.keys(stats.byCategory).length > 0 && (
        <div className="mt-2 grid gap-1">
          {Object.entries(stats.byCategory).map(([cat, c]) => {
            const r = Math.round((c.correct / c.answered) * 100)
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-24 sm:w-32 truncate text-slate-600">{cat}</span>
                <span className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <span className={`block h-full ${r >= 70 ? 'bg-emerald-500' : r >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${r}%` }} />
                </span>
                <span className="w-12 text-right tabular-nums font-bold text-slate-700">{c.correct}/{c.answered}</span>
              </div>
            )
          })}
        </div>
      )}
      {wrong.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-bold"
          >
            <span>📒 오답 노트 ({wrong.length})</span>
            <span>{open ? '접기 ▲' : '다시 보기 ▼'}</span>
          </button>
          {open && (
            <ol className="mt-2 grid gap-2">
              {wrong.map((q, i) => (
                <li key={`${q.id}-${i}`} className="p-3 rounded-lg bg-white ring-1 ring-slate-200 text-sm text-left">
                  <div className="text-[11px] font-bold text-slate-400">{q.category}</div>
                  <div className="font-semibold text-slate-800 leading-relaxed"><MathText>{q.question}</MathText></div>
                  <div className="mt-1 font-black text-emerald-700">정답: <MathText>{formatAnswer(q)}</MathText></div>
                  {q.explanation && (
                    <div className="mt-1 text-slate-600 text-xs leading-relaxed">💡 <MathText>{q.explanation}</MathText></div>
                  )}
                </li>
              ))}
            </ol>
          )}
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

  // 순위는 총자산(현금 + 땅·건물 값)으로 매긴다
  const ranked = [...players]
    .map((p) => ({ ...p, tileCount: tilesByOwner[p.id] || 0, worth: netWorth(p, ownership) }))
    .sort((a, b) => (b.alive - a.alive) || (b.worth - a.worth))

  const winner = ranked[0]

  return (
    <div className="min-h-screen hero-bg-soft flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-[1.75rem] shadow-2xl ring-1 ring-amber-900/5 p-5 sm:p-8 max-w-lg w-full"
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
              <div className="flex items-center gap-2 mb-2">
                <span className="font-black text-gray-500 w-7 shrink-0">{i + 1}위</span>
                <span className={`h-9 w-9 shrink-0 rounded-full ${p.color} flex items-center justify-center shadow`}>
                  <AnimalFace emoji={p.avatar} className="w-[86%] h-[86%]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-amber-900 truncate">
                    {p.name}
                    {!p.alive && <span className="ml-1 text-rose-500 text-xs">파산</span>}
                  </div>
                  <div className="text-xs text-gray-600 tabular-nums">
                    총자산 <strong className="text-amber-900">{p.worth.toLocaleString()}원</strong>
                    <span className="text-gray-400"> · 현금 {p.money.toLocaleString()} · 땅 {p.tileCount}</span>
                  </div>
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
