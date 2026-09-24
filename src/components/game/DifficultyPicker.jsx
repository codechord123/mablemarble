// 난이도 골라 도전 — 땅 사기·건물 짓기·통행료 면제 전에 뜬다.
// 어려운 문제를 고를수록 할인·면제 폭이 커진다. 틀리면 보상은 없다.

import { motion } from 'framer-motion'
import { QUESTION_TIME_BY_DIFFICULTY, BUILDING_LABELS } from '../../utils/boardConfig.js'
import { DIFFICULTY_DISCOUNT, TOLL_CHALLENGE, purchaseCost, upgradeCost } from '../../utils/rules.js'
import AnimalFace from '../ui/AnimalFace.jsx'

const LEVELS = [
  { d: 1, name: '쉬움', color: '#10b981', deep: '#047857' },
  { d: 2, name: '보통', color: '#f59e0b', deep: '#b45309' },
  { d: 3, name: '어려움', color: '#ef4444', deep: '#b91c1c' },
]

const TITLE = {
  purchase: (a) => `${a.tile.name} 땅 사기`,
  upgrade: (a, lvl) => `${a.tile.name} ${BUILDING_LABELS[lvl + 1]} 짓기`,
  'skip-toll': (a) => `${a.tile.name} 통행료 ${a.toll.toLocaleString()}원 면제 도전`,
}

export default function DifficultyPicker({ action, player, ownership, roundEvent, onPick, onCancel }) {
  const level = ownership[action.tile.id]?.houses ?? 0

  const reward = (d) => {
    if (action.type === 'skip-toll') {
      return { main: TOLL_CHALLENGE[d].label, afford: true }
    }
    const base = action.type === 'purchase'
      ? purchaseCost(action.tile, roundEvent, 1)
      : upgradeCost(action.tile, level, roundEvent, 1)
    const cost = action.type === 'purchase'
      ? purchaseCost(action.tile, roundEvent, d)
      : upgradeCost(action.tile, level, roundEvent, d)
    const off = DIFFICULTY_DISCOUNT[d]
    return {
      main: `${cost.toLocaleString()}원`,
      strike: off ? `${base.toLocaleString()}원` : null,
      note: off ? `${Math.round(off * 100)}% 할인` : '정가',
      afford: player.money >= cost,
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-sky-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="question-card bg-white rounded-[1.75rem] max-w-lg w-full overflow-hidden"
      >
        <div className="question-banner relative px-5 pt-5 pb-6 text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)' }}>
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 shrink-0 rounded-full ${player.color} border-[3px] border-white shadow-lg flex items-center justify-center`}>
              <AnimalFace emoji={player.avatar} className="w-[92%] h-[92%]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white/85">{TITLE[action.type]?.(action, level)}</div>
              <div className="text-xl sm:text-2xl font-black">난이도를 골라 도전!</div>
            </div>
          </div>
          <div className="mt-2 text-xs sm:text-sm text-white/85 font-semibold">
            어려운 문제를 맞힐수록 보상이 커져요. 틀리면 보상은 없어요.
          </div>
        </div>

        <div className="p-4 sm:p-5 -mt-3 bg-white rounded-t-[1.5rem] relative grid gap-2.5">
          {LEVELS.map(({ d, name, color, deep }) => {
            const r = reward(d)
            return (
              <button
                key={d}
                type="button"
                disabled={!r.afford}
                onClick={() => onPick(d)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition active:translate-y-[3px] disabled:opacity-40 disabled:active:translate-y-0"
                style={{ borderColor: color, boxShadow: `0 4px 0 ${deep}`, background: `${color}14` }}
              >
                <div className="shrink-0 text-center w-16">
                  <div className="text-lg leading-none" style={{ color }}>{'★'.repeat(d)}<span className="text-slate-300">{'★'.repeat(3 - d)}</span></div>
                  <div className="text-sm font-black mt-1" style={{ color: deep }}>{name}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-black text-slate-800 tabular-nums">
                    {r.strike && <span className="text-sm text-slate-400 line-through mr-1.5">{r.strike}</span>}
                    {r.main}
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    {r.note ? `${r.note} · ` : ''}제한 시간 {QUESTION_TIME_BY_DIFFICULTY[d]}초
                    {!r.afford && ' · 돈이 모자라요'}
                  </div>
                </div>
              </button>
            )
          })}
          <button type="button" onClick={onCancel} className="mt-1 py-2 text-sm font-bold text-slate-400 hover:text-slate-600">
            그만두기
          </button>
        </div>
      </motion.div>
    </div>
  )
}
