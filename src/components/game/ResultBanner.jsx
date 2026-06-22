import { AnimatePresence, motion } from 'framer-motion'
import MathText from '../ui/MathText.jsx'

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
            <div className={`text-6xl mb-2 ${result.correct ? 'text-emerald-500' : 'text-rose-500'}`}>
              {result.correct ? '⭕' : '❌'}
            </div>
            <div className="text-3xl font-extrabold text-amber-900">
              {result.correct ? '정답!' : '오답!'}
            </div>
            {result.message && (
              <div className="text-amber-700 mt-2 font-semibold">
                <MathText>{result.message}</MathText>
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
