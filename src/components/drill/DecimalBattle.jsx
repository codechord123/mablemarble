// 소수의 곱셈 몬스터 배틀 — 혼자 하는 계산 연습 게임.
// 스테이지(교과서 차례)마다 몬스터 3마리 + 보스. 맞히면 공격, 빨리 맞히면 크리티컬,
// 틀리거나 시간이 지나면 몬스터에게 맞아 하트가 준다. 틀리면 풀이를 보여 주고 이어 간다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { makeProblem, grade, show } from '../../utils/decimalGame.js'
import { useAccount } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { burstAt, cheer, shake } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'

// ─── 스테이지 — 5-2 4단원 소수의 곱셈 차례 ───
export const STAGES = [
  { id: 1, type: 'small_n', place: '초록 숲', bg: ['#34d399', '#0f766e'], mobs: [['🐛', '애벌레'], ['🐌', '달팽이'], ['🐞', '무당벌레']], boss: ['🦂', '전갈 대장'], secs: 25 },
  { id: 2, type: 'big_n', place: '바위 동굴', bg: ['#a8a29e', '#44403c'], mobs: [['🦇', '박쥐'], ['🐀', '동굴쥐'], ['🦔', '고슴도치']], boss: ['🐻', '동굴곰'], secs: 30 },
  { id: 3, type: 'n_small', place: '푸른 바다', bg: ['#38bdf8', '#1e3a8a'], mobs: [['🐟', '물고기'], ['🦀', '꽃게'], ['🪼', '해파리']], boss: ['🦈', '상어 왕'], secs: 25 },
  { id: 4, type: 'n_big', place: '모래 사막', bg: ['#fbbf24', '#b45309'], mobs: [['🐍', '모래뱀'], ['🦎', '도마뱀'], ['🐪', '낙타']], boss: ['🦁', '사막 사자'], secs: 30 },
  { id: 5, type: 'small_small', place: '얼음 왕국', bg: ['#a5f3fc', '#1d4ed8'], mobs: [['🐧', '펭귄'], ['🦭', '물범'], ['⛄', '눈사람']], boss: ['🐻‍❄️', '북극곰 장군'], secs: 30 },
  { id: 6, type: 'big_big', place: '불꽃 화산', bg: ['#fb923c', '#7f1d1d'], mobs: [['🦕', '목긴룡'], ['🦖', '티라노'], ['🐊', '악어']], boss: ['🐉', '불꽃 드래곤'], secs: 50 },
  { id: 7, type: 'shift', place: '우주 정거장', bg: ['#818cf8', '#1e1b4b'], mobs: [['👾', '픽셀 괴물'], ['🛸', '비행접시'], ['🤖', '로봇']], boss: ['👽', '외계인 사령관'], secs: 30 },
  { id: 8, type: 'mix', place: '마왕의 성', bg: ['#c084fc', '#3b0764'], mobs: [['👻', '유령'], ['🎃', '호박 귀신'], ['🧙', '마법사']], boss: ['🐲', '소수점 마왕'], secs: 45, final: true },
]
const TYPE_NAME = {
  small_n: '(1보다 작은 소수) × (자연수)',
  big_n: '(1보다 큰 소수) × (자연수)',
  n_small: '(자연수) × (1보다 작은 소수)',
  n_big: '(자연수) × (1보다 큰 소수)',
  small_small: '(1보다 작은 소수) × (1보다 작은 소수)',
  big_big: '(1보다 큰 소수) × (1보다 큰 소수)',
  shift: '곱의 소수점 위치',
  mix: '모든 유형 섞어서',
}
const HP = [2, 2, 3, 5] // 몬스터 3마리 + 보스
const HEARTS = 3

// ─── 기록 (이 기기) ───
const KEY = 'boomarble_decimal_v1'
function loadRec(who) {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')[who] || { stars: {}, best: {} }
  } catch {
    return { stars: {}, best: {} }
  }
}
function saveRec(who, rec) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    all[who] = rec
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* 저장 못 해도 게임은 된다 */
  }
}

// ─── 스테이지 고르기 ───
function StageMap({ rec, name, onPick, onBack }) {
  const totalStars = Object.values(rec.stars).reduce((a, b) => a + b, 0)
  return (
    <div className="min-h-[100dvh] dec-map-bg safe-padded px-4 pt-5 pb-28">
      <div className="mx-auto w-full max-w-xl">
        <button type="button" onClick={onBack} className="text-white/85 font-bold text-sm">← 메인 메뉴</button>
        <div className="mt-2 text-center text-white">
          <div className="text-5xl drop-shadow">⚔️</div>
          <h1 className="mt-1 text-3xl font-black drill-title">소수 곱셈 몬스터 배틀</h1>
          <p className="mt-1 font-semibold text-white/85">계산을 맞히면 공격! 빨리 맞히면 크리티컬! 틀리면 몬스터의 반격!</p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-black">
            <span>🧑‍🚀 {name}</span>
            <span className="text-amber-300">⭐ {totalStars} / {STAGES.length * 3}</span>
          </div>
        </div>

        <ol className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {STAGES.map((s) => {
            const stars = rec.stars[s.id] || 0
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="dec-stage group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-left text-white shadow-lg transition active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${s.bg[0]}, ${s.bg[1]})` }}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/25 text-4xl">{s.boss[0]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-white/80">STAGE {s.id}{s.final ? ' · 최종' : ''}</span>
                    <span className="block text-lg font-black leading-tight">{s.place}</span>
                    <span className="block truncate text-[11px] font-bold text-white/85">{TYPE_NAME[s.type]}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg leading-none tracking-tighter">
                      {[1, 2, 3].map((i) => (
                        <span key={i} className={i <= stars ? 'text-amber-300 drop-shadow' : 'text-white/30'}>★</span>
                      ))}
                    </span>
                    {rec.best[s.id] ? <span className="mt-1 block text-[11px] font-black text-white/85">최고 {rec.best[s.id].toLocaleString()}</span> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="mt-4 text-center text-xs font-bold text-white/75">
          몬스터 3마리 + 보스 · 하트 3개 · 남은 하트만큼 별을 받아요 · 기록은 이 기기에 저장돼요
        </p>
      </div>
    </div>
  )
}

// ─── 숫자 패드 ───
function Keypad({ onKey, disabled }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫']
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onKey(k)}
          className={`h-12 rounded-xl text-2xl font-black shadow-[0_3px_0_rgba(0,0,0,0.18)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50 sm:h-14 ${
            k === '.' ? 'bg-amber-300 text-amber-950' : k === '⌫' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800'
          }`}
          aria-label={k === '.' ? '소수점' : k === '⌫' ? '지우기' : k}
        >
          {k === '.' ? '●' : k}
        </button>
      ))}
    </div>
  )
}

// ─── 배틀 ───
function Battle({ stage, onExit, onDone }) {
  const [idx, setIdx] = useState(0) // 몇 번째 몬스터
  const [hp, setHp] = useState(HP[0])
  const [hearts, setHearts] = useState(HEARTS)
  const [problem, setProblem] = useState(() => makeProblem(stage.type))
  const [qKey, setQKey] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('fight') // fight | hurt | kill | win | lose
  const [combo, setCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [stats, setStats] = useState({ right: 0, wrong: 0, crit: 0 })
  const [pops, setPops] = useState([]) // 날아오르는 데미지 숫자
  const [miss, setMiss] = useState(null) // 틀렸을 때: { problem, given, timeout }
  const [now, setNow] = useState(Date.now())
  const startedAt = useRef(Date.now())
  const monRef = useRef(null)
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const isBoss = idx === HP.length - 1
  const mob = isBoss ? stage.boss : stage.mobs[idx]
  const maxHp = HP[idx]
  const left = Math.max(0, stage.secs - (now - startedAt.current) / 1000)
  const critWindow = Math.round(stage.secs / 3)

  // 개발 모드에서만 — 브라우저 테스트가 지금 문제를 알 수 있게
  useEffect(() => {
    if (import.meta.env.DEV) window.__decProblem = problem
  }, [problem])

  const newProblem = useCallback(
    (boss) => {
      setProblem(makeProblem(stage.type, { hard: boss }))
      setInput('')
      setQKey((k) => k + 1)
      startedAt.current = Date.now()
      setNow(Date.now())
    },
    [stage.type],
  )

  // 시간 흐름
  useEffect(() => {
    if (phase !== 'fight') return
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase === 'fight' && left <= 0) hurt(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0, phase])
  useEffect(() => {
    if (phase === 'fight' && left > 0 && left <= 5 && Math.abs(left - Math.round(left)) < 0.11) sfx.tick()
  }, [Math.ceil(left)]) // eslint-disable-line react-hooks/exhaustive-deps

  function pop(text, cls) {
    const id = Math.random()
    setPops((p) => [...p, { id, text, cls }])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1000)
  }

  function hurt(timeout = false) {
    sfx.wrong()
    setCombo(0)
    setStats((s) => ({ ...s, wrong: s.wrong + 1 }))
    setHearts((h) => h - 1)
    setMiss({ problem, timeout, typed: input })
    setPhase('hurt')
    // 몬스터가 달려들고 화면이 흔들린다
    monRef.current?.animate?.(
      [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(40%) scale(1.35)', offset: 0.35 }, { transform: 'translateY(0) scale(1)' }],
      { duration: 450, easing: 'ease-in-out' },
    )
    setTimeout(() => shake(rootRef.current, { px: 12, duration: 450 }), 150)
  }

  function submit() {
    if (phase !== 'fight') return
    const r = grade(problem, input)
    if (r === 'invalid') {
      shake(inputRef.current, { px: 6, duration: 300 })
      return
    }
    if (r === 'wrong') return hurt(false)
    // 정답 — 공격!
    const secs = (Date.now() - startedAt.current) / 1000
    const crit = secs <= critWindow
    const dmg = crit ? 2 : 1
    const c = combo + 1
    const gain = 100 + (crit ? 50 : 0) + (c >= 3 ? 20 * Math.min(c, 10) : 0)
    setCombo(c)
    setScore((s) => s + gain)
    setStats((s) => ({ ...s, right: s.right + 1, crit: s.crit + (crit ? 1 : 0) }))
    if (crit) sfx.double()
    else sfx.correct()
    pop(crit ? `크리티컬! -${dmg}` : `-${dmg}`, crit ? 'text-amber-300 text-4xl' : 'text-white text-3xl')
    monRef.current?.animate?.(
      [
        { transform: 'translateX(0) rotate(0)', filter: 'brightness(1)' },
        { transform: 'translateX(-10%) rotate(-8deg)', filter: 'brightness(2.2)', offset: 0.2 },
        { transform: 'translateX(8%) rotate(6deg)', filter: 'brightness(1.4)', offset: 0.5 },
        { transform: 'translateX(0) rotate(0)', filter: 'brightness(1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    )
    const nhp = Math.max(0, hp - dmg)
    setHp(nhp)
    if (nhp > 0) {
      newProblem(isBoss)
      return
    }
    // 몬스터 쓰러뜨림
    setPhase('kill')
    burstAt(monRef.current, { count: isBoss ? 90 : 45 })
    if (isBoss) {
      cheer(5, monRef.current)
      sfx.victory()
      setTimeout(() => setPhase('win'), 1300)
      return
    }
    sfx.coin()
    setTimeout(() => {
      const n = idx + 1
      setIdx(n)
      setHp(HP[n])
      newProblem(n === HP.length - 1)
      setPhase('fight')
    }, 1100)
  }

  function afterHurt() {
    setMiss(null)
    if (hearts <= 0) {
      setPhase('lose')
      return
    }
    newProblem(isBoss)
    setPhase('fight')
  }

  function key(k) {
    if (phase !== 'fight') return
    setInput((s) => {
      if (k === '⌫') return s.slice(0, -1)
      if (k === '.') return s.includes('.') || s.length >= 9 ? s : (s || '0') + '.'
      if (s.length >= 9) return s
      return s === '0' ? k : s + k
    })
  }

  // 키보드로도
  useEffect(() => {
    const onKey = (e) => {
      if (phase === 'hurt' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        return afterHurt()
      }
      if (phase !== 'fight') return
      if (/^[0-9]$/.test(e.key)) key(e.key)
      else if (e.key === '.' || e.key === ',') key('.')
      else if (e.key === 'Backspace') key('⌫')
      else if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 끝나면 기록
  const finished = useRef(false)
  useEffect(() => {
    if ((phase === 'win' || phase === 'lose') && !finished.current) {
      finished.current = true
      const stars = phase === 'win' ? Math.max(1, hearts) : 0
      const total = score + (phase === 'win' ? hearts * 200 : 0)
      onDone({ stars, score: total })
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const timeFrac = left / stage.secs
  const crit = stage.secs - left <= critWindow

  return (
    <div
      ref={rootRef}
      className="min-h-[100dvh] safe-padded flex flex-col items-center px-3 pt-3 pb-28 sm:pb-6"
      style={{ background: `linear-gradient(180deg, ${stage.bg[0]}, ${stage.bg[1]})` }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col">
        {/* 위: 나가기 · 스테이지 · 하트 · 점수 */}
        <div className="flex items-center gap-2 text-white">
          <button type="button" onClick={onExit} className="h-9 w-9 shrink-0 rounded-full bg-black/25 font-black" aria-label="나가기">✕</button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">STAGE {stage.id} · {stage.place}</div>
            <div className="truncate text-[11px] font-bold text-white/80">{TYPE_NAME[stage.type]}</div>
          </div>
          <div className="shrink-0 text-xl tracking-tighter" aria-label={`하트 ${hearts}개`}>
            {Array.from({ length: HEARTS }, (_, i) => (
              <span key={i} className={i < hearts ? '' : 'opacity-25 grayscale'}>❤️</span>
            ))}
          </div>
          <div className="shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-sm font-black tabular-nums">{score.toLocaleString()}</div>
        </div>

        {/* 몬스터 */}
        <div className="relative mt-2 flex flex-col items-center">
          <div className="flex w-full items-center justify-center gap-1 text-[11px] font-black text-white/85">
            {HP.map((_, i) => (
              <span key={i} className={`rounded-full px-2 py-0.5 ${i < idx ? 'bg-black/30 line-through opacity-60' : i === idx ? 'bg-white text-slate-800' : 'bg-black/20'}`}>
                {i === HP.length - 1 ? '👑 보스' : `${i + 1}`}
              </span>
            ))}
          </div>
          <div className="mt-1 text-lg font-black text-white drop-shadow">{isBoss && '👑 '}{mob[1]}</div>
          <div className="mt-1 flex gap-1">
            {Array.from({ length: maxHp }, (_, i) => (
              <span key={i} className={`h-3 w-7 rounded-full border-2 border-white/70 transition ${i < hp ? 'bg-rose-500' : 'bg-black/30'}`} />
            ))}
          </div>
          <AnimatePresence mode="popLayout">
            {phase !== 'win' && (
              <motion.div
                key={`${idx}`}
                initial={{ scale: 0, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: phase === 'kill' ? 0.0 : 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14, opacity: { duration: phase === 'kill' ? 0.8 : 0.2 } }}
                className="relative"
              >
                <div ref={monRef} className={`dec-monster select-none leading-none ${isBoss ? 'text-[7.5rem] sm:text-[9rem]' : 'text-[5.5rem] sm:text-[7rem]'}`}>
                  {mob[0]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* 데미지 숫자 */}
          <div className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center">
            {pops.map((p) => (
              <span key={p.id} className={`dec-pop absolute font-black drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] ${p.cls}`}>{p.text}</span>
            ))}
          </div>
          {phase === 'kill' && !isBoss && <div className="absolute bottom-0 text-xl font-black text-white drop-shadow">{mob[1]} 쓰러뜨림!</div>}
          {idx === HP.length - 1 && phase === 'fight' && hp === maxHp && (
            <div className="dec-boss-banner absolute -bottom-1 rounded-full bg-rose-600 px-4 py-1 text-sm font-black text-white shadow-lg">⚠️ BOSS 등장! 문제가 조금 더 어려워요</div>
          )}
        </div>

        {/* 문제 */}
        <div className="mt-3 rounded-[1.4rem] bg-white/95 p-3 shadow-xl sm:p-4">
          <div className="flex items-center justify-between text-xs font-black">
            <span className={combo >= 3 ? 'rounded-full bg-orange-500 px-2 py-0.5 text-white combo-flame' : 'text-slate-400'}>
              {combo >= 2 ? `🔥 ${combo}연속` : '맞히면 공격!'}
            </span>
            <span className={`tabular-nums ${left <= 5 ? 'text-rose-600' : crit ? 'text-emerald-600' : 'text-slate-500'}`}>
              {crit ? '⚡ 크리티컬 찬스 ' : ''}⏱ {Math.ceil(left)}초
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-linear"
              style={{ width: `${(phase === 'fight' ? timeFrac : 0) * 100}%`, background: left <= 5 ? '#e11d48' : crit ? '#10b981' : '#f59e0b' }}
            />
          </div>
          {problem.given && (
            <div className="mt-2 text-center text-sm font-black text-slate-500">
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 tabular-nums">{problem.given}</span> 을(를) 이용해서
            </div>
          )}
          <div key={qKey} className="dec-expr mt-1 text-center font-black text-slate-800 tabular-nums">
            {problem.text} =
          </div>
          <div
            ref={inputRef}
            className={`mx-auto mt-1 flex h-14 max-w-[16rem] items-center justify-center rounded-2xl border-4 text-3xl font-black tabular-nums ${
              input ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-dashed border-slate-300 text-slate-300'
            }`}
            aria-live="polite"
          >
            {input || '?'}
          </div>
          <div className="mt-2.5">
            <Keypad onKey={key} disabled={phase !== 'fight'} />
          </div>
          <GameButton color={input && phase === 'fight' ? 'red' : 'gray'} disabled={!input || phase !== 'fight'} onClick={submit} className="mt-2.5 w-full py-3 text-2xl">
            ⚔️ 공격!
          </GameButton>
        </div>
      </div>

      {/* 틀렸을 때 — 풀이 */}
      <AnimatePresence>
        {phase === 'hurt' && miss && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-rose-900/45 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ y: 80, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 80 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl"
            >
              <div className="text-center text-2xl font-black text-rose-600">
                {miss.timeout ? '⏰ 시간이 다 됐어요!' : `💥 ${mob[1]}의 반격!`}
                <span className="ml-1 text-lg">❤️ -1</span>
              </div>
              {!miss.timeout && miss.typed && (
                <div className="mt-1 text-center text-sm font-bold text-slate-500">내 답: <span className="line-through">{miss.typed}</span></div>
              )}
              <div className="mt-2 text-center text-2xl font-black text-slate-800 tabular-nums">
                {miss.problem.text} = <span className="text-emerald-600">{show(miss.problem.answer)}</span>
              </div>
              <ol className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-[0.95rem] font-bold leading-relaxed text-amber-950">
                {miss.problem.steps.map((s, i) => (
                  <li key={i}>✏️ {s}</li>
                ))}
              </ol>
              <GameButton color={hearts > 0 ? 'violet' : 'gray'} onClick={afterHurt} className="mt-4 w-full py-3 text-xl">
                {hearts > 0 ? `알겠어요! 다시 싸우기 (❤️ ${hearts})` : '확인'}
              </GameButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 끝 */}
      <AnimatePresence>
        {(phase === 'win' || phase === 'lose') && (
          <Result win={phase === 'win'} stage={stage} hearts={hearts} score={score} stats={stats} onExit={onExit} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Result({ win, stage, hearts, score, stats, onExit }) {
  const stars = win ? Math.max(1, hearts) : 0
  const total = score + (win ? hearts * 200 : 0)
  const acc = stats.right + stats.wrong ? Math.round((stats.right / (stats.right + stats.wrong)) * 100) : 0
  const next = STAGES.find((s) => s.id === stage.id + 1)
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ scale: 0.4, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 15 }} className="w-full max-w-sm text-center">
        <div className="drill-levelup font-black leading-none">{win ? 'STAGE CLEAR!' : 'GAME OVER'}</div>
        <div className="mt-3 text-5xl tracking-tight">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.25, type: 'spring', stiffness: 400, damping: 12 }}
              className={i <= stars ? 'text-amber-300 drop-shadow' : 'text-white/25'}
            >★</motion.span>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-white/95 p-4 text-slate-800 shadow-xl">
          <div className="text-3xl font-black tabular-nums">{total.toLocaleString()}점</div>
          {win && hearts > 0 && <div className="text-xs font-bold text-slate-500">남은 하트 보너스 +{hearts * 200}</div>}
          <div className="mt-2 grid grid-cols-3 gap-1 text-sm font-black">
            <div className="rounded-xl bg-emerald-50 py-1.5 text-emerald-700">⭕ {stats.right}</div>
            <div className="rounded-xl bg-amber-50 py-1.5 text-amber-700">⚡ {stats.crit}</div>
            <div className="rounded-xl bg-slate-50 py-1.5 text-slate-600">{acc}%</div>
          </div>
          {!win && <p className="mt-2 text-sm font-bold text-slate-600">풀이를 떠올리며 다시 도전해 봐요! 💪</p>}
        </div>
        <div className="mt-4 grid gap-2">
          {win && next && (
            <GameButton color="green" onClick={() => onExit(next)} className="w-full py-3 text-lg">다음 스테이지: {next.place} →</GameButton>
          )}
          <GameButton color="violet" onClick={() => onExit(stage)} className="w-full py-3 text-lg">🔁 다시 하기</GameButton>
          <GameButton color="gray" onClick={() => onExit(null)} className="w-full py-2.5">스테이지 고르기</GameButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DecimalBattle({ onBack }) {
  const me = useAccount((s) => s.me)
  const who = me?.username ? `acct:${me.username}` : 'device'
  const name = me ? me.name || me.username : '탐험가'
  const [rec, setRec] = useState(() => loadRec(who))
  const [stage, setStage] = useState(null)
  const [round, setRound] = useState(0) // 같은 스테이지 다시 하기 때 새로 그리기

  useEffect(() => setRec(loadRec(who)), [who])

  const done = useCallback(
    (sid, { stars, score }) => {
      setRec((cur) => {
        const next = {
          stars: { ...cur.stars, [sid]: Math.max(cur.stars[sid] || 0, stars) },
          best: { ...cur.best, [sid]: Math.max(cur.best[sid] || 0, score) },
        }
        saveRec(who, next)
        return next
      })
    },
    [who],
  )

  const view = useMemo(() => stage, [stage])
  if (!view) return <StageMap rec={rec} name={name} onPick={(s) => { setStage(s); setRound((r) => r + 1) }} onBack={onBack} />
  return (
    <Battle
      key={`${view.id}-${round}`}
      stage={view}
      onDone={(r) => done(view.id, r)}
      onExit={(nextStage) => {
        // 결과 화면에서: 다음/다시(스테이지) · 고르기(null) — 위 ✕ 버튼은 이벤트가 넘어온다
        if (nextStage && nextStage.id) {
          setStage(nextStage)
          setRound((r) => r + 1)
        } else setStage(null)
      }}
    />
  )
}
