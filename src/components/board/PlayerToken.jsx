import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { getTileCoord, BOARD_SIZE } from '../../utils/boardConfig.js'

const CELL = 100 / 7
const HALF = CELL / 2
const HOP_MS = 130

// 시계방향 단계별 hop. 멀리 가는 경우 자동으로 짧은 경로(역방향) 선택.
function buildPath(from, to) {
  if (from === to) return []
  const forward = (to - from + BOARD_SIZE) % BOARD_SIZE
  const backward = (from - to + BOARD_SIZE) % BOARD_SIZE
  const dir = forward <= backward ? 1 : -1
  const steps = Math.min(forward, backward)
  const path = []
  let curr = from
  for (let i = 0; i < steps; i++) {
    curr = (curr + dir + BOARD_SIZE) % BOARD_SIZE
    path.push(curr)
  }
  return path
}

export default function PlayerToken({ player, index }) {
  const controls = useAnimation()
  const prevPos = useRef(player.position)

  useEffect(() => {
    const path = buildPath(prevPos.current, player.position)
    if (path.length === 0) return

    const lefts = []
    const tops = []
    const scales = []
    const ys = []
    for (let i = 0; i < path.length; i++) {
      const { x, y } = getTileCoord(path[i])
      lefts.push(`${x * CELL + HALF}%`)
      tops.push(`${y * CELL + HALF}%`)
      scales.push(i === path.length - 1 ? 1.25 : 1)
      ys.push(-6)
    }

    controls.start({
      left: lefts,
      top: tops,
      transition: { duration: Math.max(0.35, (path.length * HOP_MS) / 1000), ease: 'linear' },
    })

    prevPos.current = player.position
  }, [player.position, controls])

  const start = getTileCoord(prevPos.current)
  const dx = (index % 2 === 0 ? -1 : 1) * Math.ceil(index / 2) * 6
  const dy = (index < 3 ? -1 : 1) * 4

  return (
    <motion.div
      initial={{ left: `${start.x * CELL + HALF}%`, top: `${start.y * CELL + HALF}%` }}
      animate={controls}
      style={{ marginLeft: dx, marginTop: dy, zIndex: 20 + index }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        animate={{ y: [0, -5, 0], scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, repeatType: 'mirror', duration: 0.4 }}
        className={`h-5 w-5 sm:h-7 sm:w-7 rounded-full border-2 border-white shadow-lg ring-2 ring-amber-900/30 ${player.color}`}
      />
    </motion.div>
  )
}
