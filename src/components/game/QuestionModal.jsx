import { useState } from 'react'
import { motion } from 'framer-motion'

const PROMPT_LABEL = {
  purchase: '💰 구매를 위해 풀어주세요',
  'skip-toll': '🎯 통행료 면제 도전!',
}

export default function QuestionModal({ question, intent, player, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')

  const canSubmit =
    question.type === 'short_answer' ? text.trim().length > 0 : selected !== null

  const submit = () => {
    if (!canSubmit) return
    onSubmit(question.type === 'short_answer' ? text : selected)
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full"
      >
        <div className="flex items-center gap-2 text-sm">
          <div className={`h-3 w-3 rounded-full ${player.color}`} />
          <span className="text-amber-900 font-bold">{player.name}</span>
          <span className="text-amber-600 ml-auto">
            {question.category} · 난이도 {'★'.repeat(question.difficulty)}
          </span>
        </div>
        <div className="text-amber-700 text-sm mt-2">{PROMPT_LABEL[intent]}</div>

        <div className="text-xl sm:text-2xl font-bold text-amber-900 mt-3 mb-5">
          {question.question}
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
                {c}
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

        {question.type === 'short_answer' && (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
            placeholder="답을 입력하세요"
            className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 outline-none text-lg"
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
