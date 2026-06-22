import { AnimatePresence, motion } from 'framer-motion'
import MathText from '../ui/MathText.jsx'

function formatAnswer(q) {
  if (!q) return ''
  if (q.type === 'multiple_choice') return q.choices[q.answer] ?? ''
  if (q.type === 'true_false') return q.answer === 0 ? 'O' : 'X'
  // short_answer: 첫 번째 형식만 노출 (대분수↔가분수 같은 다중 답안의 대표값)
  return String(q.answer).split(/[,，]/)[0].trim()
}

export default function ResultBanner({ result, onClose }) {
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
            className="bg-white rounded-3xl p-6 max-w-md w-full text-center"
          >
            <div className={`text-6xl mb-2 ${
              result.timeout ? 'text-orange-500' : result.correct ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {result.timeout ? '⏰' : result.correct ? '⭕' : '❌'}
            </div>
            <div className="text-3xl font-extrabold text-amber-900">
              {result.timeout ? '시간 초과!' : result.correct ? '정답!' : '오답!'}
            </div>
            {result.message && (
              <div className="text-amber-700 mt-2 font-semibold">
                <MathText>{result.message}</MathText>
              </div>
            )}
            {!result.correct && result.question && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-sm text-emerald-700 font-semibold">정답: </span>
                <span className="text-lg font-bold text-emerald-800">
                  <MathText>{formatAnswer(result.question)}</MathText>
                </span>
              </div>
            )}
            {result.explanation && (
              <div className="text-sm text-gray-700 mt-3 p-3 bg-amber-50 rounded-lg text-left">
                💡 <MathText>{result.explanation}</MathText>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition"
            >
              확인
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
