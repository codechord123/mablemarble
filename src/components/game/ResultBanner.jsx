import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MathText from '../ui/MathText.jsx'
import { shakeEl } from '../../utils/juice.js'
import { burstAt, cheer, shake } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'

export function formatAnswer(q) {
  if (!q) return ''
  if (q.type === 'multiple_choice') return q.choices[q.answer] ?? ''
  if (q.type === 'true_false') return q.answer === 0 ? 'O' : 'X'
  return String(q.answer).split(/[,，]/)[0].trim()
}

export default function ResultBanner({ result, onClose }) {
  const cardRef = useRef(null)
  const stampRef = useRef(null)
  const win = result && result.correct && !result.timeout
  const streak = result?.streak || (win ? 1 : 0)
  // 길게 이어 오던 연속 정답이 끊겼을 때만 알려 준다
  const broken = result && !win && (result.prevStreak || 0) >= 3 ? result.prevStreak : 0

  useEffect(() => {
    if (!result) return
    if (win) {
      // 연속으로 맞힐수록 축하가 커진다 (2연속 양옆 대포, 5연속부터 불꽃놀이)
      cheer(streak)
      // ⭕ 도장이 찍히는 순간 그 자리에서 별이 튄다
      const t = setTimeout(() => burstAt(stampRef.current, { count: 24 + Math.min(40, streak * 8), velocity: 18, scalar: 0.9, shapes: ['star'] }), 220)
      return () => clearTimeout(t)
    }
    // 진입 스프링이 자리잡은 뒤 흔들어 transform 충돌 없이 매끈하게.
    // 뒤의 화면도 쿵 하고 흔들린다.
    const t = setTimeout(() => {
      shakeEl(cardRef.current)
      shake(document.querySelector('.board-scene'), { px: 7, duration: 380 })
    }, 260)
    return () => clearTimeout(t)
  }, [result, win]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          {/* 화면 색 플래시 — 정답 초록 / 오답·시간초과 빨강 */}
          <div
            className={`absolute inset-0 pointer-events-none juice-flash ${
              win ? 'bg-emerald-400' : 'bg-rose-500'
            }`}
          />
          <motion.div
            ref={cardRef}
            initial={{ scale: 0.6, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.6, y: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="relative bg-white rounded-[1.75rem] shadow-2xl ring-1 ring-amber-900/5 p-6 sm:p-8 max-w-xl w-full text-center max-h-[95vh] overflow-y-auto"
          >
            <div ref={stampRef} className={`text-7xl sm:text-8xl mb-2 inline-block ${
              win ? 'juice-stamp' : ''
            } ${
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
            {win && !result.combo && streak >= 2 && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 380, damping: 14 }}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 font-black text-base"
              >
                🔥 {streak}연속 정답! 한 번 더 맞히면 콤보 보너스
              </motion.div>
            )}
            {broken > 0 && (
              <div className="mt-2 text-sm font-bold text-gray-500">💨 {broken}연속 정답 기록이 끊겼어요. 다시 시작!</div>
            )}
            {result.combo && (
              <motion.div
                initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 380, damping: 14 }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-lg shadow-[0_4px_0_#9a3412]"
              >
                🔥 {result.combo.streak}연속 정답! 콤보 +{result.combo.bonus.toLocaleString()}원
              </motion.div>
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
            <GameButton
              color={win ? 'green' : 'amber'}
              onClick={onClose}
              className="mt-5 w-full py-3.5 sm:py-4 text-lg sm:text-xl"
            >
              확인
            </GameButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
