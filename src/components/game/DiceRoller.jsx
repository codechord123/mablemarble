import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { impactEl } from '../../utils/juice.js'
import GameButton from '../ui/GameButton.jsx'

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
    <div className="die-face bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-xl border border-amber-300 p-[10%] grid grid-cols-3 grid-rows-3 gap-[6%]">
      {pattern.map((on, i) => (
        <div key={i} className="flex items-center justify-center">
          {on ? (
            <span className="block h-[78%] w-[78%] bg-amber-900 rounded-full shadow-inner" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

// 예전에는 평면에서 rotate만 돌아 '아이콘이 빙빙 도는' 느낌이었다.
// 원근(perspective) 안에서 두 축으로 구르고, 떨어졌다가 눌리며 멈춰야
// 주사위가 실제로 굴러간 것처럼 읽힌다. 두 주사위는 살짝 시차를 두고 멈춘다.
function Die({ value, rolling, delay = 0 }) {
  const [shown, setShown] = useState(value || 1)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!rolling) {
      if (value) setShown(value)
      return
    }
    const i = setInterval(() => setShown(Math.ceil(Math.random() * 6)), 60)
    return () => clearInterval(i)
  }, [rolling, value])

  const tumble = {
    rotateX: [0, 400, 780, 1140],
    rotateY: [0, 220, 410, 560],
    y: [0, -30, -10, 0],
    scale: [1, 1.08, 1.03, 1],
  }
  // 착지: 납작하게 눌렸다가 되돌아온다
  const settle = {
    rotateX: 0,
    rotateY: 0,
    y: 0,
    scaleX: [1.24, 0.94, 1.05, 1],
    scaleY: [0.78, 1.09, 0.97, 1],
  }

  return (
    <div className="flex flex-col items-center" style={{ perspective: 560 }}>
      <motion.div
        style={{ transformStyle: 'preserve-3d' }}
        animate={reduce ? {} : rolling ? tumble : settle}
        transition={{
          duration: rolling ? 1.15 : 0.45,
          ease: rolling ? 'easeOut' : [0.34, 1.56, 0.64, 1],
          delay: rolling ? 0 : delay,
        }}
      >
        <DiceFace value={shown} />
      </motion.div>

      {/* 바닥 그림자 — 주사위가 뜨면 작아지고, 닿는 순간 확 퍼진다 */}
      <motion.div
        animate={
          reduce
            ? {}
            : rolling
              ? { scaleX: 0.5, opacity: 0.3 }
              : { scaleX: [1.45, 0.92, 1], opacity: [0.85, 0.6, 0.65] }
        }
        transition={{ duration: rolling ? 0.35 : 0.45, delay: rolling ? 0 : delay }}
        className="h-1.5 w-12 rounded-full bg-amber-900/30 blur-[2px] mt-1.5 origin-center"
      />
    </div>
  )
}

export default function DiceRoller({ lastRoll, onRoll, disabled }) {
  const [rolling, setRolling] = useState(false)
  const rollingRef = useRef(false)
  const rowRef = useRef(null)

  const handleClick = () => {
    if (rollingRef.current || disabled) return
    rollingRef.current = true
    setRolling(true)
    setTimeout(() => {
      rollingRef.current = false
      setRolling(false)
      onRoll()
      // 두 번째 주사위가 멈추는 타이밍에 맞춰 바닥이 한 번 울린다
      setTimeout(() => impactEl(rowRef.current, { px: 4 }), 120)
    }, 1200)
  }

  return (
    <div className="dice-roller">
      <div ref={rowRef} className="flex gap-3">
        {[lastRoll?.d1, lastRoll?.d2].map((v, i) => (
          <Die key={i} value={v} rolling={rolling} delay={i * 0.09} />
        ))}
      </div>
      <GameButton
        color="orange"
        onClick={handleClick}
        disabled={disabled || rolling}
        className="px-6 py-3 text-lg whitespace-nowrap"
      >
        🎲 굴리기
      </GameButton>
    </div>
  )
}
