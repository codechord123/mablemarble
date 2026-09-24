import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QUESTION_TIME_BY_DIFFICULTY } from '../../utils/boardConfig.js'
import { sfx } from '../../utils/sounds.js'
import MathText from '../ui/MathText.jsx'
import FractionInput, { detectInputMode } from '../ui/FractionInput.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import GameButton from '../ui/GameButton.jsx'
import ShapeDiagram from '../ui/ShapeDiagram.jsx'
import AnimalFace from '../ui/AnimalFace.jsx'

// 무엇을 걸고 푸는 문제인지에 따라 머리띠 색과 제목을 바꾼다.
const INTENT = {
  purchase: { title: '땅 사기 도전', icon: '💰', from: '#10b981', to: '#047857' },
  upgrade: { title: '건물 짓기 도전', icon: '🏗️', from: '#38bdf8', to: '#1d4ed8' },
  'skip-toll': { title: '통행료 면제 도전', icon: '🎯', from: '#a78bfa', to: '#6d28d9' },
  'bonus-question': { title: '보너스 문제', icon: '⭐', from: '#fbbf24', to: '#d97706' },
  'escape-island': { title: '무인도 탈출 도전', icon: '🏝️', from: '#22d3ee', to: '#0e7490' },
}
const DEFAULT_INTENT = { title: '문제 도전', icon: '📝', from: '#fb923c', to: '#c2410c' }

export const TIMEOUT_SENTINEL = '__TIMEOUT__'

// 둥근 타이머 — 남은 시간만큼 테가 줄고, 절반·4분의 1 아래로 가면 색이 바뀐다
function TimerRing({ remaining, total, urgent }) {
  const R = 20
  const C = 2 * Math.PI * R
  const pct = Math.max(0, remaining / total)
  const color = pct > 0.5 ? '#ffffff' : pct > 0.25 ? '#fde047' : '#fecaca'
  return (
    <div className={`relative h-14 w-14 shrink-0 ${urgent ? 'tick-urgent' : ''}`} aria-label={`남은 시간 ${remaining}초`}>
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
        <motion.circle
          cx="24" cy="24" r={R} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-black tabular-nums text-white drop-shadow">
        {remaining}
      </span>
    </div>
  )
}

export default function QuestionModal({ question, intent, player, onSubmit }) {
  const total = QUESTION_TIME_BY_DIFFICULTY[question.difficulty] || 30
  const [remaining, setRemaining] = useState(total)
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [fractionValue, setFractionValue] = useState({ str: '', valid: false })
  const [confirmSkip, setConfirmSkip] = useState(false)
  const submittedRef = useRef(false)

  // 단답형 입력 모드 자동 감지 (정수/분수/대분수/일반 텍스트)
  const inputMode = useMemo(() => {
    if (question.type !== 'short_answer') return null
    return question.inputMode || detectInputMode(question.answer)
  }, [question.id, question.type, question.answer, question.inputMode])

  useEffect(() => {
    submittedRef.current = false
    setRemaining(total)
    setSelected(null)
    setText('')
    setFractionValue({ str: '', valid: false })
  }, [question.id, total])

  useEffect(() => {
    if (remaining <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true
        onSubmit(TIMEOUT_SENTINEL)
      }
      return
    }
    // 남은 시간 5초 이하 — 매초 긴박한 틱 (아직 제출 전일 때만)
    if (remaining <= 5 && !submittedRef.current) sfx.tickUrgent()
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onSubmit])

  const urgent = remaining <= 5

  const canSubmit = (() => {
    if (question.type === 'short_answer') {
      if (inputMode === 'text') return text.trim().length > 0
      return fractionValue.valid
    }
    return selected !== null
  })()

  const submit = () => {
    if (!canSubmit || submittedRef.current) return
    submittedRef.current = true
    if (question.type === 'short_answer') {
      onSubmit(inputMode === 'text' ? text : fractionValue.str)
    } else {
      onSubmit(selected)
    }
  }

  const theme = INTENT[intent] || DEFAULT_INTENT

  return (
    <div className="fixed inset-0 z-40 bg-sky-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.6, rotateX: 35, opacity: 0, y: 40 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 230, damping: 19 }}
        style={{ transformPerspective: 900 }}
        className={`question-card bg-white rounded-[1.75rem] max-w-2xl w-full relative max-h-[96dvh] overflow-y-auto overscroll-contain ${
          urgent ? 'ring-4 ring-rose-400/80' : ''
        }`}
      >
        <ConfirmDialog
          open={confirmSkip}
          title="문제 건너뛰기"
          description="이 문제를 건너뛰면 오답으로 처리됩니다. 정말 건너뛸까요?"
          confirmLabel="건너뛰기"
          variant="danger"
          onConfirm={() => {
            setConfirmSkip(false)
            if (submittedRef.current) return
            submittedRef.current = true
            onSubmit(TIMEOUT_SENTINEL)
          }}
          onCancel={() => setConfirmSkip(false)}
        />

        {/* 머리띠 — 누가, 무엇을 걸고, 얼마나 남았는지 */}
        <div
          className="question-banner relative px-4 sm:px-6 pt-4 sm:pt-5 pb-7 sm:pb-8 text-white"
          style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
        >
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full ${player.color} border-[3px] border-white shadow-lg flex items-center justify-center`}>
              <AnimalFace emoji={player.avatar} className="w-[92%] h-[92%]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-bold text-white/85 truncate">{player.name}</div>
              <div className="text-lg sm:text-2xl font-black leading-tight drop-shadow-sm">
                {theme.icon} {theme.title}
              </div>
            </div>
            <TimerRing remaining={remaining} total={total} urgent={urgent} />
            <button
              onClick={() => setConfirmSkip(true)}
              aria-label="문제 건너뛰기"
              title="문제 건너뛰기"
              className="self-start -mr-1 -mt-1 h-8 w-8 shrink-0 rounded-full bg-black/15 hover:bg-black/25 text-white/90 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-bold">
            <span className="px-2.5 py-1 rounded-full bg-white/20 ring-1 ring-white/30">{question.category}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 ring-1 ring-white/30 tracking-tight">
              난이도 <span className="text-yellow-200">{'★'.repeat(question.difficulty)}</span>
              <span className="text-white/35">{'★'.repeat(Math.max(0, 3 - question.difficulty))}</span>
            </span>
          </div>
        </div>

        {/* 본문 — 머리띠 위로 살짝 겹쳐 올린 카드 */}
        <div className="relative -mt-4 bg-white rounded-t-[1.5rem] px-5 sm:px-8 pt-5 sm:pt-7">
        <div className="question-text text-[1.25rem] sm:text-3xl font-bold text-slate-800 mb-3 leading-[1.75] break-keep tabular-nums">
          <MathText>{question.question}</MathText>
        </div>

        {question.figure && (
          <div className="question-figure mb-3 sm:mb-5 flex justify-center">
            <div className="bg-amber-50/70 rounded-2xl px-3 py-2 ring-1 ring-amber-200">
              <ShapeDiagram figure={question.figure} />
            </div>
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            {question.choices.map((c, i) => {
              const active = selected === i
              return (
                <motion.button
                  key={i}
                  onClick={() => { if (!active) sfx.select(); setSelected(i) }}
                  whileTap={{ scale: 0.97 }}
                  animate={active ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`w-full px-4 py-3.5 sm:p-5 rounded-2xl border-2 text-left transition-colors text-lg sm:text-xl flex items-center font-semibold text-slate-800 ${
                    active
                      ? 'border-amber-500 bg-amber-50 shadow-[0_4px_0_#f59e0b]'
                      : 'border-slate-200 bg-white shadow-[0_4px_0_#e2e8f0] hover:border-amber-300'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-xl mr-3 font-black text-base flex-shrink-0 transition-colors ${
                    active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 break-keep tabular-nums"><MathText>{c}</MathText></span>
                  {active && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="ml-2 text-amber-500 text-xl"
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            {['O', 'X'].map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`p-8 sm:p-10 rounded-2xl border-2 text-5xl sm:text-6xl font-black transition ${
                  selected === i
                    ? 'border-amber-500 bg-amber-50 shadow-[0_5px_0_#f59e0b]'
                    : 'border-slate-200 bg-white shadow-[0_5px_0_#e2e8f0] hover:border-amber-300'
                } ${c === 'O' ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {question.type === 'short_answer' && inputMode === 'text' && (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
            placeholder="답을 입력하세요"
            className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none text-lg"
          />
        )}

        {question.type === 'short_answer' && inputMode !== 'text' && (
          <FractionInput
            key={question.id}
            mode={inputMode}
            onValueChange={(str, valid) => setFractionValue({ str, valid })}
            onEnter={submit}
          />
        )}

        {/* 제출 버튼은 창 아래에 붙여 둔다. 작은 폰에서 창이 넘쳐도 버튼은 늘 보이고
            내용만 스크롤된다. (창 자체의 아래 여백은 이 띠가 대신 가진다) */}
        <div className="sticky bottom-0 -mx-5 sm:-mx-8 px-5 sm:px-8 pt-3 sm:pt-5 pb-5 sm:pb-8 mt-1 bg-white shadow-[0_-10px_14px_-12px_rgba(69,26,3,0.25)]">
          <GameButton
            color={canSubmit ? 'orange' : 'gray'}
            onClick={submit}
            disabled={!canSubmit}
            className="w-full py-3.5 text-lg"
          >
            정답 제출
          </GameButton>
        </div>
        </div>
      </motion.div>
    </div>
  )
}
