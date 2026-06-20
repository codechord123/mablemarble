import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { getTileCoord, BOARD_SIZE } from '../../utils/boardConfig.js'

const CELL = 100 / 7
const HALF = CELL / 2
const HOP_MS = 180

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
  const bobControls = useAnimation()
  const prevPos = useRef(player.position)

  useEffect(() => {
    const path = buildPath(prevPos.current, player.position)
    if (path.length === 0) return

    const lefts = []
    const tops = []
    for (let i = 0; i < path.length; i++) {
      const { x, y } = getTileCoord(path[i])
      lefts.push(`${x * CELL + HALF}%`)
      tops.push(`${y * CELL + HALF}%`)
    }

    const duration = Math.max(0.45, (path.length * HOP_MS) / 1000)

    controls.start({
      left: lefts,
      top: tops,
      transition: { duration, ease: 'easeInOut' },
    })

    // 각 hop마다 점프 아치 + 회전 — keyframe 2개씩 (상승/하강)
    const arcKeys = []
    const rotKeys = []
    const times = []
    for (let i = 0; i < path.length; i++) {
      const baseT = i / path.length
      const midT = (i + 0.5) / path.length
      const endT = (i + 1) / path.length
      arcKeys.push(0, -18, 0)
      rotKeys.push(0, 25 * ((i % 2) ? -1 : 1), 0)
      times.push(baseT, midT, endT)
    }
    bobControls.start({
      y: arcKeys,
      rotate: rotKeys,
      transition: { duration, ease: 'linear', times },
    })

    prevPos.current = player.position
  }, [player.position, controls, bobControls])

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
      {/* 그림자 — 캐릭터가 점프하면 작아짐 */}
      <motion.div
        animate={{ scale: [1, 0.6, 1], opacity: [0.35, 0.2, 0.35] }}
        transition={{ duration: HOP_MS / 1000, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
        className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1 h-1.5 w-6 bg-black/30 rounded-full blur-[1px]"
      />
      {/* 캐릭터 점프/회전 */}
      <motion.div animate={bobControls}>
        <div
          className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full border-[3px] border-white shadow-xl ring-2 ring-amber-900/30 ${player.color} flex items-center justify-center text-base sm:text-lg`}
        >
          {player.avatar || '●'}
        </div>
      </motion.div>
    </motion.div>
  )
}
