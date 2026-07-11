import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// 주사위 눈 패턴 (3x3 그리드)
const PIPS = {
  1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
  3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
  5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  6: [1, 0, 1, 1, 0, 1, 1, 0, 1],
}

function DiceFace({ value }) {
  const pattern = PIPS[value] || PIPS[1]
  return (
    <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-xl border border-amber-300 p-2 grid grid-cols-3 grid-rows-3 gap-1">
      {pattern.map((on, i) => (
        <div key={i} className="flex items-center justify-center">
          {on ? (
            <span className="block h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-900 rounded-full shadow-inner" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function Die({ value, rolling }) {
  const [shown, setShown] = useState(value || 1)

  useEffect(() => {
    if (!rolling) {
      if (value) setShown(value)
      return
    }
    const i = setInterval(() => setShown(Math.ceil(Math.random() * 6)), 70)
    return () => clearInterval(i)
  }, [rolling, value])

  return (
    <motion.div
      animate={rolling
        ? { rotate: [0, 180, 360, 540, 720, 900], scale: [1, 1.15, 1, 1.15, 1, 1] }
        : { rotate: 0, scale: [0.85, 1.15, 1] }
      }
      transition={{
        duration: rolling ? 1.2 : 0.4,
        ease: rolling ? 'easeOut' : [0.34, 1.56, 0.64, 1],
      }}
    >
      <DiceFace value={shown} />
    </motion.div>
  )
}

export default function DiceRoller({ lastRoll, onRoll, disabled }) {
  const [rolling, setRolling] = useState(false)
  const rollingRef = useRef(false)

  const handleClick = () => {
    if (rollingRef.current || disabled) return
    rollingRef.current = true
    setRolling(true)
    setTimeout(() => {
      rollingRef.current = false
      setRolling(false)
      onRoll()
    }, 1200)
  }

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <div className="flex gap-3">
        {[lastRoll?.d1, lastRoll?.d2].map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <Die value={v} rolling={rolling} />
            {/* 바닥 그림자 — 주사위가 떠 있는 느낌을 주어 입체감 강조 */}
            <div
              className={`h-1.5 rounded-full bg-amber-900/15 blur-[2px] mt-1 transition-all ${
                rolling ? 'w-8 opacity-40' : 'w-12 opacity-70'
              }`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleClick}
        disabled={disabled || rolling}
        className="px-5 py-3 whitespace-nowrap bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl font-extrabold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95 hover:shadow-amber-500/30"
      >
        🎲 굴리기
      </button>
    </div>
  )
}
