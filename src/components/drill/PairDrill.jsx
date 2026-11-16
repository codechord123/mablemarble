// 짝꿍 수 계산 훈련 — 소수 마을 장사를 열기 전에 50문제를 맞힌다.
// 곱하면 10·100·1000·1이 되는 짝꿍을 찾아 교환·결합·분배법칙으로 빠르게 곱하기.
// 틀리면 학습지처럼 풀이 단계를 보여 주고, 맞힌 문제만 센다. 진행은 저장된다(중간에 나가도 이어서).

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { grade, show } from '../../utils/decimalGame.js'
import { makePairProblem, PAIR_CARD, PAIR_GOAL, KIND_NAME } from '../../utils/pairCalc.js'
import { sfx } from '../../utils/sounds.js'
import { cheer, shake } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini } from '../ui/MuteToggle.jsx'

function Keypad({ onKey, disabled }) {
  const keys = ['7', '8', '9', '⌫', '4', '5', '6', '.', '1', '2', '3', '0']
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onKey(k)}
          aria-label={k === '.' ? '소수점' : k === '⌫' ? '지우기' : k}
          className={`h-12 rounded-xl text-2xl font-black shadow-[0_3px_0_rgba(0,0,0,0.15)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
            k === '.' ? 'bg-amber-300 text-amber-950' : k === '⌫' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 ring-1 ring-slate-200'
          }`}
        >
          {k === '.' ? '●' : k}
        </button>
      ))}
    </div>
  )
}

export default function PairDrill({ done: start = 0, used: startUsed = [], onProgress, onExit, onComplete, onLog }) {
  const [done, setDone] = useState(start)
  const [used, setUsed] = useState(() => new Set(startUsed))
  const [q, setQ] = useState(() => makePairProblem(start, { used: new Set(startUsed) }))
  const [input, setInput] = useState('')
  const [state, setState] = useState('ask') // ask | right | wrong
  const [tries, setTries] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showCard, setShowCard] = useState(start < 3)
  const finished = done >= PAIR_GOAL

  useEffect(() => {
    if (import.meta.env.DEV) window.__pairProblem = q
  }, [q])

  function next(nDone, nUsed) {
    setQ(makePairProblem(nDone, { used: nUsed }))
    setInput('')
    setTries(0)
    setState('ask')
  }

  function key(k) {
    if (state !== 'ask') return
    setInput((s) => {
      if (k === '⌫') return s.slice(0, -1)
      if (k === '.') return s.includes('.') || s.length >= 10 ? s : (s || '0') + '.'
      if (s.length >= 10) return s
      return s === '0' ? k : s + k
    })
  }

  function submit() {
    if (state !== 'ask' || !input) return
    const r = grade(q, input)
    if (r === 'invalid') return
    if (r === 'correct') {
      const nDone = done + (tries === 0 ? 1 : 0) // 처음에 맞힌 것만 센다
      const nUsed = new Set(used).add(q.text)
      const s = tries === 0 ? streak + 1 : 0
      setStreak(s)
      setDone(nDone)
      setUsed(nUsed)
      setState('right')
      sfx.correct()
      onLog?.({ l: 'pair', q: q.text, r: tries === 0 ? 1 : 2 })
      if (s && s % 5 === 0) cheer(Math.min(6, s / 5 + 1))
      onProgress?.({ done: nDone, used: [...nUsed] })
      if (done < PAIR_GOAL && nDone >= PAIR_GOAL) { // 50번째를 막 맞혔을 때만 (더 연습할 땐 계속)
        setTimeout(() => {
          sfx.victory()
          cheer(6)
          onComplete?.()
        }, 600)
        return
      }
      setTimeout(() => next(nDone, nUsed), 700)
      return
    }
    sfx.wrong()
    setStreak(0)
    shake(document.getElementById('pair-card'), { px: 7, duration: 320 })
    setTries((t) => t + 1)
    setState('wrong')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (state === 'wrong' && e.key === 'Enter') return retry()
      if (state !== 'ask') return
      if (/^[0-9]$/.test(e.key)) key(e.key)
      else if (e.key === '.' || e.key === ',') key('.')
      else if (e.key === 'Backspace') key('⌫')
      else if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 틀린 뒤: 풀이를 보고 같은 문제를 다시 (이번엔 세지 않음)
  function retry() {
    setInput('')
    setState('ask')
  }

  const pct = Math.round((Math.min(done, PAIR_GOAL) / PAIR_GOAL) * 100)
  // 틀렸을 때는 방법만 — 첫 단계(짝꿍 찾기·쪼개기·빌려 오기)까지만, 답은 안 보여 준다
  const hint = useMemo(() => (q.kind === 'direct' ? '짝꿍끼리 곱하면 10 · 100 · 1000 · 1 중 하나로 딱 떨어져요' : q.steps[0]), [q])

  return (
    <div className="min-h-[100dvh] pair-bg safe-padded px-3 pt-3 pb-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExit} className="h-9 w-9 shrink-0 rounded-full bg-black/10 font-black text-slate-700" aria-label="나가기 (저장돼요)">✕</button>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-black text-teal-950">🤝 짝꿍 수 계산 훈련 <span className="text-teal-800/70">{Math.min(done, PAIR_GOAL)} / {PAIR_GOAL}</span></div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-white/70 ring-1 ring-teal-900/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500" animate={{ width: `${pct}%` }} />
            </div>
          </div>
          {streak >= 2 && <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-sm font-black text-white combo-flame">🔥{streak}</span>}
          <SoundMini />
        </div>

        <button type="button" onClick={() => setShowCard((v) => !v)} className="mt-2 w-full rounded-xl bg-white/70 px-3 py-1.5 text-left text-xs font-black text-teal-900 ring-1 ring-teal-900/10">
          🔎 짝꿍 수 {showCard ? '접기 ▲' : '보기 ▼'} <span className="font-bold text-teal-800/70">곱하면 10·100·1000·1로 딱 떨어지는 두 수</span>
        </button>
        <AnimatePresence>
          {showCard && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-1.5 grid grid-cols-4 gap-1">
                {PAIR_CARD.map((c) => (
                  <div key={c} className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/90 px-1 py-1 text-center text-[11px] font-black tabular-nums text-slate-700">
                    {c.split(' = ')[0]}
                    <div className="text-amber-600">= {c.split(' = ')[1]}</div>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] font-bold text-teal-900/80">짝꿍을 찾아 동그라미! 순서를 바꾸고(교환) 괄호로 묶어(결합) 짝꿍부터 곱해요. 짝꿍이 없으면 10·100·2처럼 가까운 수를 빌려 와요(분배).</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div id="pair-card" className="mt-3 rounded-[1.5rem] bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-teal-800">{KIND_NAME[q.kind]}</span>
            <span className="text-slate-400">처음에 맞힌 문제만 세요</span>
          </div>
          <div key={q.text} className="pair-expr mt-3 text-center font-black text-slate-800 tabular-nums">{q.text} =</div>
          <div className={`mx-auto mt-2 flex h-14 max-w-[16rem] items-center justify-center rounded-2xl border-4 text-3xl font-black tabular-nums ${
            state === 'right' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : state === 'wrong' ? 'border-rose-300 bg-rose-50 text-rose-500 line-through' : input ? 'border-teal-400 bg-teal-50 text-slate-900' : 'border-dashed border-slate-300 text-slate-300'
          }`}>
            {state === 'right' ? `${show(q.answer)} ⭕` : input || '?'}
          </div>

          {state === 'wrong' && (
            <div className="mt-3 rounded-2xl bg-amber-50 p-3">
              <div className="text-sm font-black text-amber-800">💡 이렇게 해 볼까요?</div>
              <div className="mt-1 text-[0.95rem] font-bold leading-relaxed text-amber-950">{hint}</div>
              <GameButton color="violet" onClick={retry} className="mt-2 w-full py-2.5">알겠어요! 다시 풀기</GameButton>
            </div>
          )}

          <div className="mt-3">
            <Keypad onKey={key} disabled={state !== 'ask'} />
          </div>
          <GameButton color={input && state === 'ask' ? 'green' : 'gray'} disabled={!input || state !== 'ask'} onClick={submit} className="mt-2 w-full py-3 text-xl">
            확인
          </GameButton>
        </div>

        {finished && (
          <div className="mt-3 rounded-2xl bg-emerald-500 p-4 text-center font-black text-white shadow-lg">
            🎉 짝꿍 계산 50문제 통과! 이제 장사를 할 수 있어요
          </div>
        )}
      </div>
    </div>
  )
}
