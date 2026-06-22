import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { QUESTION_TIME_BY_DIFFICULTY } from '../../utils/boardConfig.js'
import MathText from '../ui/MathText.jsx'
import FractionInput, { detectInputMode } from '../ui/FractionInput.jsx'

const PROMPT_LABEL = {
  purchase: '💰 구매를 위해 풀어주세요',
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
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onSubmit])

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
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full relative"
      >
        <button
          onClick={() => {
            if (submittedRef.current) return
            submittedRef.current = true
            onSubmit(TIMEOUT_SENTINEL)
          }}
          aria-label="문제 건너뛰기"
          title="문제 건너뛰기 (시간 초과 처리)"
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
        >
          ✕
        </button>
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
          <div className={`text-sm font-extrabold ${remaining <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-700'}`}>
            ⏱ {remaining}초
          </div>
        </div>

        <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-3 mb-5">
          <MathText>{question.question}</MathText>
        </div>

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {question.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full p-3 rounded-xl border-2 text-left transition ${
                  selected === i
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
              >
                <span className="font-bold mr-2 text-amber-700">{i + 1}.</span>
                <MathText>{c}</MathText>
              </button>
            ))}
          </div>
        )}

        {question.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-3">
            {['O', 'X'].map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`p-6 rounded-xl border-2 text-4xl font-extrabold transition ${
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

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          정답 제출
        </button>
      </motion.div>
    </div>
  )
}
