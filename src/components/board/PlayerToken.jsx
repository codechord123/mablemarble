import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { getTileCoord, BOARD_SIZE } from '../../utils/boardConfig.js'

const CELL = 100 / 7
const HALF = CELL / 2
const HOP_MS = 180

// 5명 펜타곤 분산 (각 토큰의 칸 안 위치 오프셋, % 단위)
// 단일 셀 안에서 토큰들이 겹치지 않게 배치
const POSITIONS = [
  { dx: 0, dy: -2.0 },    // 0: 위
  { dx: 1.9, dy: -0.6 },  // 1: 오른쪽 위
  { dx: 1.2, dy: 1.6 },   // 2: 오른쪽 아래
  { dx: -1.2, dy: 1.6 },  // 3: 왼쪽 아래
  { dx: -1.9, dy: -0.6 }, // 4: 왼쪽 위
]

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

    // 각 hop마다 점프 아치 + 약한 회전 (이동 중에만)
    const arcKeys = []
    const rotKeys = []
    const times = []
    for (let i = 0; i < path.length; i++) {
      const baseT = i / path.length
      const midT = (i + 0.5) / path.length
      const endT = (i + 1) / path.length
      arcKeys.push(0, -14, 0)
      rotKeys.push(0, 18 * (i % 2 ? -1 : 1), 0)
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
  const pos = POSITIONS[index % POSITIONS.length]

  return (
    <motion.div
      initial={{ left: `${start.x * CELL + HALF}%`, top: `${start.y * CELL + HALF}%` }}
      animate={controls}
      style={{ zIndex: 20 + index }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      {/* 펜타곤 분산 — 각 셀 안에서 위치 차이 */}
      <div
        className="relative"
        style={{ transform: `translate(${pos.dx * 4}px, ${pos.dy * 4}px)` }}
      >
        {/* 정적 그림자 — 무한 애니메이션 제거 (성능 / 발열 개선) */}
        <div className="absolute left-1/2 top-full -translate-x-1/2 h-1 w-5 sm:w-6 bg-black/25 rounded-full blur-[1px]" />

        {/* 캐릭터 점프/회전 (이동 중에만) */}
        <motion.div animate={bobControls}>
          <div
            className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white shadow-lg ring-1 ring-amber-900/40 ${player.color} flex items-center justify-center text-sm sm:text-base`}
          >
            {player.avatar || '●'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
