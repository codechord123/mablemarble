import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import MathText from '../ui/MathText.jsx'

function formatAnswer(q) {
  if (!q) return ''
  if (q.type === 'multiple_choice') return q.choices[q.answer] ?? ''
  if (q.type === 'true_false') return q.answer === 0 ? 'O' : 'X'
  return String(q.answer).split(/[,，]/)[0].trim()
}

function fireCheerConfetti() {
  // T5 응원 컨페티 — 정답 시 가벼운 축하 (모든 학생에게 시각적 보상)
  confetti({
    particleCount: 60,
    spread: 80,
    origin: { y: 0.4 },
    colors: ['#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6'],
    scalar: 0.9,
  })
}

export default function ResultBanner({ result, onClose }) {
  useEffect(() => {
    if (result?.correct && !result?.timeout) {
      fireCheerConfetti()
    }
  }, [result])

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, y: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full text-center max-h-[95vh] overflow-y-auto"
          >
            <div className={`text-7xl sm:text-8xl mb-2 ${
              result.timeout ? 'text-orange-500' : result.correct ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {result.timeout ? '⏰' : result.correct ? '⭕' : '❌'}
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-amber-900">
              {result.timeout ? '시간 초과!' : result.correct ? '정답!' : '오답!'}
            </div>
            {result.message && (
              <div className="text-amber-700 mt-3 text-lg sm:text-xl font-semibold">
                <MathText>{result.message}</MathText>
              </div>
            )}
            {!result.correct && result.question && (
              <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                <div className="text-sm sm:text-base text-emerald-700 font-bold">정답</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mt-1">
                  <MathText>{formatAnswer(result.question)}</MathText>
                </div>
              </div>
            )}
            {result.explanation && (
              <div className="text-sm sm:text-base text-gray-700 mt-4 p-4 bg-amber-50 rounded-xl text-left">
                💡 <MathText>{result.explanation}</MathText>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-3 sm:py-4 bg-amber-600 text-white rounded-xl font-bold text-lg sm:text-xl hover:bg-amber-700 transition"
            >
              확인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
