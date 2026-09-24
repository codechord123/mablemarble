import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
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

// 진짜 정육면체 주사위. 마주 보는 면의 합이 7이 되도록 배치한다.
// 각 면이 앞으로 오려면 정육면체를 얼마나 돌려야 하는지(도 단위).
const SIDES = [
  { v: 1, face: 'translateZ(var(--half))', to: { x: 0, y: 0 } },
  { v: 6, face: 'rotateY(180deg) translateZ(var(--half))', to: { x: 0, y: 180 } },
  { v: 3, face: 'rotateY(90deg) translateZ(var(--half))', to: { x: 0, y: -90 } },
  { v: 4, face: 'rotateY(-90deg) translateZ(var(--half))', to: { x: 0, y: 90 } },
  { v: 5, face: 'rotateX(90deg) translateZ(var(--half))', to: { x: -90, y: 0 } },
  { v: 2, face: 'rotateX(-90deg) translateZ(var(--half))', to: { x: 90, y: 0 } },
]
const TARGET = Object.fromEntries(SIDES.map((s) => [s.v, s.to]))

function Pips({ value }) {
  return (
    <div className="die-pips">
      {PIPS[value].map((on, i) => (
        <span key={i} className={on ? `die-pip ${value === 1 ? 'die-pip-big' : ''}` : ''} />
      ))}
    </div>
  )
}

// 현재 각도에서 앞으로(+) 최소 turns바퀴 더 돈 뒤 target 각도에 멈추는 값
function forwardTo(current, target, turns) {
  let v = target
  while (v < current + turns * 360) v += 360
  return v
}

// 굴림 한 번의 길이(초). 결과는 굴리기를 누르는 순간 정해지고, 주사위는 이 시간
// 동안 한 번에 굴러서 그 눈이 앞을 향하게 멈춘다.
// (예전에는 결과를 모른 채 먼저 한 번 돌고, 결과가 나오면 다시 한 바퀴 돌아
//  '두 번 던져진' 것처럼 보였다.)
export const ROLL_S = 1.3
// 두 번째 주사위는 살짝 늦게 멈춘다
const STAGGER_S = 0.1
// 누른 뒤 두 주사위가 모두 멈추고 합이 뜨기까지(ms) — App이 말 출발 시점에 쓴다
export const DICE_SETTLE_MS = Math.round((ROLL_S + STAGGER_S + 0.15) * 1000)

// 살짝 비스듬히 세워 두어 윗면·옆면이 함께 보이므로 멈춰 있을 때도 입체로 읽힌다.
function Die({ value, roll, delay = 0 }) {
  const reduce = useReducedMotion()
  const cube = useAnimation()
  const stage = useAnimation()
  const shadow = useAnimation()
  const rotRef = useRef(TARGET[value || 1])
  const lastRoll = useRef(roll)

  useEffect(() => {
    cube.set({ rotateX: rotRef.current.x, rotateY: rotRef.current.y })
  }, [cube])

  useEffect(() => {
    if (!roll || roll === lastRoll.current || !value) return
    lastRoll.current = roll
    const t = TARGET[value]
    // 여러 바퀴 돈 뒤 나온 눈에서 정확히 멈춘다 — 한 번의 연속 동작
    const next = { x: forwardTo(rotRef.current.x, t.x, 3), y: forwardTo(rotRef.current.y, t.y, 2) }
    rotRef.current = next
    if (reduce) {
      cube.set({ rotateX: next.x, rotateY: next.y })
      return
    }
    cube.start({
      rotateX: next.x,
      rotateY: next.y,
      transition: { duration: ROLL_S, ease: [0.12, 0.62, 0.28, 1], delay },
    })
    // 던져 올림 → 떨어짐 → 작게 한 번 튐 → 착지하며 눌림
    const times = [0, 0.28, 0.52, 0.66, 0.8, 0.9, 1]
    stage.start({
      y: [0, -40, -4, -16, 0, -3, 0],
      scaleX: [1, 1, 1, 1, 1.18, 0.96, 1],
      scaleY: [1, 1, 1, 1, 0.84, 1.05, 1],
      transition: { duration: ROLL_S + 0.1, times, delay, ease: 'easeInOut' },
    })
    shadow.start({
      scaleX: [1, 0.45, 0.95, 0.7, 1.4, 0.95, 1],
      opacity: [0.65, 0.25, 0.6, 0.4, 0.9, 0.6, 0.65],
      transition: { duration: ROLL_S + 0.1, times, delay },
    })
  }, [roll, value, delay, reduce, cube, stage, shadow])

  return (
    <div className="flex flex-col items-center">
      <motion.div className="die-stage" animate={stage} style={{ transformOrigin: '50% 100%' }}>
        <div className="die-tilt">
          <motion.div className="die-cube" animate={cube}>
            {/* 모서리를 둥글린 면 사이 빈틈을 메우는 속심 */}
            <span className="die-core" style={{ transform: 'rotateX(90deg)' }} />
            <span className="die-core" style={{ transform: 'rotateY(90deg)' }} />
            <span className="die-core" />
            {SIDES.map((sd) => (
              <div key={sd.v} className="die-side" style={{ transform: sd.face }}>
                <Pips value={sd.v} />
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* 바닥 그림자 — 주사위가 뜨면 작아지고, 닿는 순간 확 퍼진다 */}
      <motion.div animate={shadow} initial={{ opacity: 0.65 }} className="die-shadow" />
    </div>
  )
}

// showResult: 굴린 뒤 말이 이동하는 동안. 버튼 대신 눈의 합을 보여 준다.
export default function DiceRoller({ lastRoll, onRoll, disabled, showResult = false }) {
  const [rolling, setRolling] = useState(false)
  const rollingRef = useRef(false)
  const rowRef = useRef(null)

  const handleClick = () => {
    if (rollingRef.current || disabled) return
    rollingRef.current = true
    setRolling(true)
    // 누르는 순간 결과가 정해지고 주사위는 그 눈을 향해 한 번에 굴러간다
    onRoll()
    // 두 주사위가 바닥에 닿는 순간 한 번 울린다
    setTimeout(() => impactEl(rowRef.current, { px: 4 }), Math.round((ROLL_S * 0.8 + STAGGER_S) * 1000))
    setTimeout(() => {
      rollingRef.current = false
      setRolling(false)
    }, DICE_SETTLE_MS)
  }

  return (
    <div className="dice-roller">
      <div ref={rowRef} className="flex gap-3">
        {[lastRoll?.d1, lastRoll?.d2].map((v, i) => (
          <Die key={i} value={v} roll={lastRoll} delay={i * STAGGER_S} />
        ))}
      </div>
      {showResult ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: ROLL_S + STAGGER_S, type: 'spring', stiffness: 420, damping: 18 }}
          className="t-display text-amber-900 tabular-nums whitespace-nowrap"
        >
          {lastRoll ? `${lastRoll.d1} + ${lastRoll.d2} = ${lastRoll.total}` : ''}
          {lastRoll?.isDouble && <span className="ml-1 text-rose-600">더블!</span>}
        </motion.div>
      ) : (
        <GameButton
          color="orange"
          onClick={handleClick}
          disabled={disabled || rolling}
          className="px-6 py-3 text-lg whitespace-nowrap"
        >
          🎲 굴리기
        </GameButton>
      )}
    </div>
  )
}
