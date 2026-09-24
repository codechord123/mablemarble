import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QUESTION_TIME_BY_DIFFICULTY } from '../../utils/boardConfig.js'
import { sfx } from '../../utils/sounds.js'
import MathText from '../ui/MathText.jsx'
import FractionInput, { detectInputMode } from '../ui/FractionInput.jsx'
import ConfirmDialog from '../ui/ConfirmDialog.jsx'
import GameButton from '../ui/GameButton.jsx'
import ShapeDiagram from '../ui/ShapeDiagram.jsx'

const PROMPT_LABEL = {
  purchase: '💰 땅 구매를 위해 풀어주세요',
  upgrade: '🏗️ 건물 짓기 — 한 단계 업그레이드',
  'skip-toll': '🎯 통행료 면제 도전!',
  'bonus-question': '⭐ 보너스 문제',
  'escape-island': '🏝️ 무인도 탈출 시도',
}

export const TIMEOUT_SENTINEL = '__TIMEOUT__'

function CountdownBar({ remaining, total }) {
  const pct = Math.max(0, (remaining / total) * 100)
  const color =
    pct > 50 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className={`h-full ${color}`}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'linear' }}
      />
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

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className={`bg-white rounded-[1.75rem] shadow-2xl px-5 pt-5 sm:px-8 sm:pt-8 max-w-2xl w-full relative max-h-[96dvh] overflow-y-auto overscroll-contain transition-shadow ${
          urgent ? 'ring-4 ring-rose-400/70' : 'ring-1 ring-amber-900/5'
        }`}
      >
        <button
          onClick={() => setConfirmSkip(true)}
          aria-label="문제 건너뛰기"
          title="문제 건너뛰기"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-lg"
        >
          ✕
        </button>
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
        <CountdownBar remaining={remaining} total={total} />
        <div className="flex items-center mt-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${player.color}`} />
            <span className="text-amber-900 font-bold">{player.name}</span>
          </div>
          <span className="text-amber-600 ml-auto">
            {question.category} · 난이도 {'★'.repeat(question.difficulty)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-amber-700 text-sm">{PROMPT_LABEL[intent] || ''}</div>
          <div className={`text-sm font-extrabold inline-flex items-center ${urgent ? 'text-rose-600 tick-urgent' : 'text-amber-700'}`}>
            ⏱ {remaining}초
          </div>
        </div>

        <div className="text-[1.3rem] sm:text-3xl font-bold text-amber-900 mt-3 sm:mt-4 mb-3 leading-[1.75] break-keep tabular-nums">
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
                  className={`w-full p-4 sm:p-5 rounded-xl border-2 text-left transition-colors text-lg sm:text-xl flex items-center ${
                    active
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full mr-3 font-bold text-sm flex-shrink-0 transition-colors ${
                    active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-amber-700'
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
                className={`p-8 sm:p-10 rounded-xl border-2 text-5xl sm:text-6xl font-extrabold transition ${
                  selected === i
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
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
      </motion.div>
    </div>
  )
}
