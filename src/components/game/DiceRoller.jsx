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

// 예전에는 평면 그림이 빙글 돌았다. 지금은 정육면체가 두 축으로 구르다가
// 나온 눈이 앞을 향하게 멈춘다. 살짝 비스듬히 세워 두어 윗면·옆면이 함께
// 보이므로 멈춰 있을 때도 입체로 읽힌다. 두 주사위는 시차를 두고 멈춘다.
function Die({ value, rolling, delay = 0 }) {
  const reduce = useReducedMotion()
  const [rot, setRot] = useState(() => TARGET[value || 1])
  const rotRef = useRef(rot)

  useEffect(() => {
    if (rolling) {
      // 굴리는 동안: 결과를 아직 모르므로 크게 여러 바퀴 돌린다
      const next = { x: rotRef.current.x + 720 + 180, y: rotRef.current.y + 540 + 90 }
      rotRef.current = next
      setRot(next)
    } else if (value) {
      const t = TARGET[value]
      const next = { x: forwardTo(rotRef.current.x, t.x, 1), y: forwardTo(rotRef.current.y, t.y, 1) }
      rotRef.current = next
      setRot(next)
    }
  }, [rolling, value])

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="die-stage"
        animate={
          reduce
            ? {}
            : rolling
              ? { y: [0, -34, -12, -26, 0], scale: [1, 1.1, 1.04, 1.06, 1] }
              : { y: 0, scaleX: [1.18, 0.95, 1.03, 1], scaleY: [0.84, 1.07, 0.98, 1] }
        }
        transition={{
          duration: rolling ? 1.15 : 0.5,
          ease: rolling ? 'easeOut' : [0.34, 1.56, 0.64, 1],
          delay: rolling ? 0 : delay + 0.35,
        }}
        style={{ transformOrigin: '50% 100%' }}
      >
        <div className="die-tilt">
          <motion.div
            className="die-cube"
            animate={{ rotateX: rot.x, rotateY: rot.y }}
            transition={
              reduce
                ? { duration: 0 }
                : rolling
                  ? { duration: 1.15, ease: [0.2, 0.7, 0.4, 1] }
                  : { duration: 0.75, ease: [0.22, 1.4, 0.4, 1], delay }
            }
          >
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
      <motion.div
        animate={
          reduce
            ? {}
            : rolling
              ? { scaleX: [1, 0.5, 0.75, 0.6, 1], opacity: [0.65, 0.3, 0.5, 0.35, 0.65] }
              : { scaleX: [1.45, 0.92, 1], opacity: [0.85, 0.6, 0.65] }
        }
        transition={{ duration: rolling ? 1.15 : 0.45, delay: rolling ? 0 : delay + 0.35 }}
        className="die-shadow"
      />
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
      {showResult ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 420, damping: 18 }}
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
