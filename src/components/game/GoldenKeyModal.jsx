import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import GameButton from '../ui/GameButton.jsx'
import { burstAt } from '../../utils/fx.js'
import { sfx } from '../../utils/sounds.js'

// 황금열쇠 — 뒷면(열쇠 무늬)이 보이게 날아와서 잠깐 반짝인 뒤 휙 뒤집혀 내용이 나온다.
// 기다리기 싫으면 뒷면을 눌러 바로 뒤집을 수 있다.
export default function GoldenKeyModal({ card, onConfirm }) {
  const isMission = card?.effect?.type === 'mission'
  const reduce = useReducedMotion()
  const [flipped, setFlipped] = useState(!!reduce)
  const cardRef = useRef(null)

  useEffect(() => {
    if (!card || reduce) return
    setFlipped(false)
    const t = setTimeout(() => setFlipped(true), 1100)
    return () => clearTimeout(t)
  }, [card, reduce])

  useEffect(() => {
    if (!flipped || reduce) return
    sfx.flip()
    // 다 뒤집혀 앞면이 보이는 순간 반짝
    const t = setTimeout(
      () => burstAt(cardRef.current, { count: 50, velocity: 22, colors: isMission ? ['#f9a8d4', '#c4b5fd', '#fff'] : undefined }),
      320,
    )
    return () => clearTimeout(t)
  }, [flipped, reduce, isMission])

  const frame = isMission ? 'from-pink-300 to-violet-500' : 'from-yellow-300 to-amber-500'

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
          style={{ perspective: 1200 }}
        >
          {/* 날아오기 — 위에서 비스듬히 던져져 들어온다 */}
          <motion.div
            ref={cardRef}
            initial={reduce ? { opacity: 0 } : { y: -320, rotate: -14, scale: 0.55, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 170, damping: 17 }}
            className="relative max-w-sm w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* 뒤집기 */}
            <motion.div
              initial={false}
              animate={reduce ? { rotateY: 180 } : flipped ? { rotateY: 180, scale: [1, 1.12, 1] } : { rotateY: 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.7, ease: [0.3, 1.25, 0.5, 1] }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* 앞면 (내용) — 처음엔 뒤를 보고 있다 */}
              <div
                className={`rounded-3xl shadow-2xl p-1 bg-gradient-to-br ${frame}`}
                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                aria-hidden={!flipped}
              >
                <div className="bg-white rounded-[20px] p-6 text-center">
                  <div className="text-sm font-bold text-amber-700 tracking-widest">
                    {isMission ? '🎪 미션 카드' : '🔑 황금열쇠'}
                  </div>
                  <div className="text-7xl my-3">{card.emoji}</div>
                  <div className="text-2xl font-extrabold text-amber-900">{card.title}</div>
                  <div className="mt-2 text-amber-700 text-sm">{card.description}</div>

                  {isMission ? (
                    <div className="mt-6 flex gap-2">
                      <GameButton color="green" onClick={() => onConfirm(true)} disabled={!flipped} className="flex-1 py-3">
                        ✅ 성공!
                      </GameButton>
                      <GameButton color="gray" onClick={() => onConfirm(false)} disabled={!flipped} className="flex-1 py-3">
                        😅 포기
                      </GameButton>
                    </div>
                  ) : (
                    <GameButton color="yellow" onClick={() => onConfirm()} disabled={!flipped} className="mt-6 w-full py-3">
                      효과 적용
                    </GameButton>
                  )}
                </div>
              </div>

              {/* 뒷면 — 열쇠 무늬. 누르면 바로 뒤집힌다. */}
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className={`gk-back absolute inset-0 rounded-3xl shadow-2xl ${isMission ? 'is-mission' : ''}`}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                aria-label="카드 뒤집기"
                tabIndex={flipped ? -1 : 0}
              >
                <span className="gk-back-inner">
                  <span className="gk-back-icon">{isMission ? '🎪' : '🔑'}</span>
                  <span className="gk-back-title">{isMission ? '미션 카드' : '황금열쇠'}</span>
                  <span className="gk-back-hint">눌러서 뒤집기</span>
                </span>
                <span className="gk-shine" aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
