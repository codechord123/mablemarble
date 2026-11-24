// 🎈 소수점 풍선 터뜨리기 (미니게임) — 45초 동안 곱셈식의 답이 적힌 풍선을 터뜨린다.
// 틀린 풍선은 소수점 자리만 다른 답이 많아서 '곱의 소수점 위치'를 빠르게 판단하는 연습이 된다.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { makeRound, MINI_SECS, miniReward } from '../../utils/balloonPop.js'
import { sfx } from '../../utils/sounds.js'
import { cheer, shake } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini } from '../ui/MuteToggle.jsx'

const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#4ade80', '#c084fc', '#fb923c']
const LANES = [14, 38, 62, 86] // 가로 위치(%)

function newBalloons(round, level) {
  const lanes = [...LANES].sort(() => Math.random() - 0.5)
  const base = Math.max(4200, 7600 - level * 220) // 점수가 오를수록 빨리
  return round.choices.map((label, i) => ({
    id: `${Date.now()}-${i}`,
    label,
    x: lanes[i],
    delay: i * 260 + Math.random() * 300,
    dur: base * (0.85 + Math.random() * 0.3),
    color: COLORS[(i + level) % COLORS.length],
    state: 'up', // up | pop | bad
  }))
}

export default function BalloonPop({ best = 0, rewardLeft = 0, onFinish, onExit }) {
  const [phase, setPhase] = useState('ready') // ready | count | play | end
  const [count, setCount] = useState(3)
  const [round, setRound] = useState(() => makeRound())
  const [balloons, setBalloons] = useState([])
  const [startAt, setStartAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [penalty, setPenalty] = useState(0)
  const [missed, setMissed] = useState(null) // 놓친 문제의 답 (잠깐 보여 줌)
  const [result, setResult] = useState(null)
  const roundAt = useRef(0)
  const boxRef = useRef(null)

  const left = phase === 'play' ? Math.max(0, MINI_SECS - (now - startAt) / 1000 - penalty) : MINI_SECS

  useEffect(() => {
    if (import.meta.env.DEV) window.__balloon = round
  }, [round])

  // 3·2·1
  useEffect(() => {
    if (phase !== 'count') return
    if (count <= 0) {
      setPhase('play')
      setStartAt(Date.now())
      nextRound(0)
      return
    }
    sfx.tick?.()
    const t = setTimeout(() => setCount((c) => c - 1), 650)
    return () => clearTimeout(t)
  }, [phase, count]) // eslint-disable-line react-hooks/exhaustive-deps

  // 시계 + 다 날아가 버린 풍선 확인
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      const gone = balloons.length && balloons.every((b) => b.state !== 'up' || n - roundAt.current > b.delay + b.dur)
      const solved = balloons.some((b) => b.state === 'pop')
      if (gone && !solved) {
        setMissed(round.answer)
        setCombo(0)
        nextRound(score)
      }
    }, 60)
    return () => clearInterval(t)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  // 시간 끝
  useEffect(() => {
    if (phase === 'play' && left <= 0) {
      setPhase('end')
      sfx.victory?.()
      if (score >= 10) cheer(4)
      setResult(onFinish?.(score) || { reward: 0 })
    }
  }, [phase, left]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!missed) return
    const t = setTimeout(() => setMissed(null), 1400)
    return () => clearTimeout(t)
  }, [missed])

  function nextRound(level) {
    const r = makeRound()
    setRound(r)
    roundAt.current = Date.now()
    setBalloons(newBalloons(r, level))
  }

  function tap(b) {
    if (phase !== 'play' || b.state !== 'up') return
    if (b.label === round.answer) {
      sfx.correct()
      const s = score + 1
      const c = combo + 1
      setScore(s)
      setCombo(c)
      if (c % 5 === 0) cheer(2)
      setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, state: 'pop' } : x)))
      setTimeout(() => nextRound(s), 380)
    } else {
      sfx.wrong()
      setCombo(0)
      setPenalty((p) => p + 3) // 틀리면 3초 줄어든다
      setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, state: 'bad' } : x)))
      shake(boxRef.current, { px: 6, duration: 260 })
    }
  }

  const t = Date.now()
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 safe-padded px-3 pt-3 pb-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExit} className="h-9 w-9 shrink-0 rounded-full bg-black/10 font-black text-slate-700" aria-label="나가기">✕</button>
          <div className="min-w-0 flex-1 text-sm font-black text-sky-950">🎈 소수점 풍선 터뜨리기</div>
          {phase === 'play' && (
            <>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-sm font-black tabular-nums text-sky-900">⭐ {score}</span>
              <span className={`rounded-full px-2.5 py-1 text-sm font-black tabular-nums ${left < 10 ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>⏱ {Math.ceil(left)}</span>
            </>
          )}
          <SoundMini />
        </div>

        {phase === 'ready' && (
          <div className="mt-6 rounded-[1.5rem] bg-white/90 p-5 text-center shadow-xl">
            <div className="text-6xl">🎈</div>
            <h1 className="mt-2 text-2xl font-black text-sky-950">소수점 풍선 터뜨리기</h1>
            <p className="mt-2 text-sm font-bold text-slate-600">곱셈식의 <b>답</b>이 적힌 풍선을 터뜨려요!<br />소수점 위치만 다른 가짜 답이 섞여 있어요 👀</p>
            <p className="mt-1 text-xs font-bold text-rose-600">틀린 풍선을 누르면 3초가 줄어요 · {MINI_SECS}초</p>
            <p className="mt-2 text-xs font-black text-amber-700">
              {rewardLeft > 0 ? `💰 오늘 보상 ${rewardLeft}판 남음 (맞힌 개수 × 2G, 최대 ${miniReward(99)}G)` : '오늘 보상은 다 받았어요 — 연습 모드'} · 최고 ⭐ {best}
            </p>
            <GameButton color="green" onClick={() => { setCount(3); setPhase('count') }} className="mt-4 w-full py-3 text-xl">시작!</GameButton>
          </div>
        )}

        {(phase === 'count' || phase === 'play') && (
          <>
            <div className="mt-3 rounded-2xl bg-white p-3 text-center shadow-lg">
              <div className="text-xs font-black text-slate-400">이 식의 답은?{combo >= 3 && <span className="ml-1 text-orange-500">🔥 {combo}연속</span>}</div>
              <div key={round.text} className="pair-expr text-3xl font-black tabular-nums text-slate-800">{phase === 'count' ? '…' : `${round.text} =`}</div>
              {missed && <div className="text-xs font-black text-rose-600">놓쳤어요! 답은 {missed}</div>}
            </div>
            <div ref={boxRef} className="relative mt-2 h-[58dvh] overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-sky-100/40 to-white/30 ring-2 ring-white/70">
              {phase === 'count' && (
                <div className="absolute inset-0 grid place-items-center">
                  <motion.div key={count} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl font-black text-white drop-shadow-lg">{count || '시작!'}</motion.div>
                </div>
              )}
              {phase === 'play' && balloons.map((b) => {
                const prog = Math.max(0, (t - roundAt.current - b.delay) / b.dur)
                if (b.state === 'up' && (prog <= 0 || prog > 1.05)) return null
                const y = 108 - prog * 125 // 아래에서 위로 (%)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => tap(b)}
                    aria-label={`풍선 ${b.label}`}
                    className="absolute -translate-x-1/2 transition-opacity"
                    style={{ left: `${b.x}%`, top: `${y}%`, opacity: b.state === 'up' ? 1 : 0, transitionDuration: b.state === 'up' ? '0ms' : '250ms' }}
                  >
                    <svg width="78" height="104" viewBox="0 0 78 104" className="drop-shadow-md">
                      <ellipse cx="39" cy="40" rx="34" ry="38" fill={b.state === 'bad' ? '#94a3b8' : b.color} />
                      <ellipse cx="27" cy="26" rx="8" ry="12" fill="rgba(255,255,255,0.45)" />
                      <path d="M35 77 L43 77 L39 84 Z" fill={b.state === 'bad' ? '#94a3b8' : b.color} />
                      <path d="M39 84 Q34 92 39 98 Q44 104 39 104" stroke="#64748b" strokeWidth="1.5" fill="none" />
                      <text x="39" y="47" textAnchor="middle" fontSize={b.label.length > 5 ? 15 : 19} fontWeight="900" fill="#0f172a">{b.label}</text>
                    </svg>
                  </button>
                )
              })}
              {phase === 'play' && balloons.filter((b) => b.state === 'pop').map((b) => (
                <div key={`p${b.id}`} className="pointer-events-none absolute -translate-x-1/2 text-4xl shop-pop" style={{ left: `${b.x}%`, top: '40%' }}>💥</div>
              ))}
            </div>
          </>
        )}

        {phase === 'end' && (
          <div className="mt-6 rounded-[1.5rem] bg-white/95 p-5 text-center shadow-xl">
            <div className="text-5xl">{score >= 15 ? '🏆' : score >= 8 ? '🎉' : '🎈'}</div>
            <div className="mt-1 text-sm font-black text-slate-500">맞힌 풍선</div>
            <div className="text-5xl font-black tabular-nums text-sky-950">⭐ {score}</div>
            {score > best && <div className="mt-1 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-sm font-black text-amber-950 shop-bop">🏆 최고 기록!</div>}
            <div className="mt-2 text-sm font-black text-amber-700">{result?.reward ? `💰 +${result.reward}G 받았어요!` : '오늘 보상은 다 받았어요 (연습 모드)'}</div>
            <div className="mt-4 grid gap-2">
              <GameButton color="green" onClick={() => { setScore(0); setCombo(0); setPenalty(0); setResult(null); setCount(3); setPhase('count') }} className="w-full py-3 text-lg">🎈 다시 하기</GameButton>
              <GameButton color="violet" onClick={onExit} className="w-full py-3 text-lg">🏘️ 마을로</GameButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
