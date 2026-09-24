import { useEffect, useRef } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { getTileCoord, BOARD_SIZE } from '../../utils/boardConfig.js'
import AnimalFace from '../ui/AnimalFace.jsx'

const CELL = 100 / 7
const HALF = CELL / 2
const HOP_MS = 180
const HOP_H = 16 // 점프 높이(px)

// 5명 펜타곤 분산 (각 토큰의 칸 안 위치 오프셋, % 단위)
// 단일 셀 안에서 토큰들이 겹치지 않게 배치
// 전체를 위로 1.2 올려 칸 이름표 줄을 비워 둔다 (출발 칸에 5명이 모일 때 가림 방지)
const POSITIONS = [
  { dx: 0, dy: -3.2 },    // 0: 위
  { dx: 1.9, dy: -1.8 },  // 1: 오른쪽 위
  { dx: 1.2, dy: 0.4 },   // 2: 오른쪽 아래
  { dx: -1.2, dy: 0.4 },  // 3: 왼쪽 아래
  { dx: -1.9, dy: -1.8 }, // 4: 왼쪽 위
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

export default function PlayerToken({ player, index, onLanded }) {
  const controls = useAnimation()
  const bobControls = useAnimation()
  const shadowControls = useAnimation()
  const reduce = useReducedMotion()
  const prevPos = useRef(player.position)
  const landedRef = useRef(onLanded)
  landedRef.current = onLanded

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

    if (reduce) {
      prevPos.current = player.position
      return
    }

    // 칸마다 한 번씩 튀어 오르는 호핑.
    // 예전에는 높이만 바뀌는 아치였다. 고무공처럼 보이려면 이륙에서 늘어나고
    // 착지에서 눌리는 스쿼시&스트레치, 그리고 높이에 반응하는 그림자가 있어야 한다.
    // 그림자가 가만히 있으면 아무리 높이 띄워도 '떠 있다'로 읽히지 않는다.
    const y = []
    const sx = []
    const sy = []
    const rot = []
    const times = []
    const shadowScale = []
    const shadowOpacity = []

    const push = (t, yy, xs, ys, rr, ss, so) => {
      times.push(t); y.push(yy); sx.push(xs); sy.push(ys)
      rot.push(rr); shadowScale.push(ss); shadowOpacity.push(so)
    }

    for (let i = 0; i < path.length; i++) {
      const t0 = i / path.length
      const span = 1 / path.length
      const at = (f) => t0 + span * f
      const dir = i % 2 ? -1 : 1

      // 첫 hop에서만 시작점을 찍는다. 이후 hop의 시작 = 이전 hop의 착지라 중복된다.
      if (i === 0) push(0, 0, 1.18, 0.82, 0, 1, 0.9)
      push(at(0.22), -HOP_H * 0.6, 0.9, 1.14, 10 * dir, 0.78, 0.6)
      push(at(0.5), -HOP_H, 1, 1, 15 * dir, 0.55, 0.32)
      push(at(0.78), -HOP_H * 0.6, 0.92, 1.1, 10 * dir, 0.78, 0.6)
      push(at(1), 0, 1.18, 0.82, 0, 1.1, 0.95)
    }

    // 마지막 칸에 닿는 순간의 반동. 이게 없으면 이동이 '멈춘다'가 아니라 '사라진다'.
    bobControls
      .start({ y, scaleX: sx, scaleY: sy, rotate: rot, transition: { duration, ease: 'linear', times } })
      .then(() => {
        landedRef.current?.(player.position)
        return bobControls.start({
          y: [0, -7, 0],
          scaleX: [1.24, 0.95, 1],
          scaleY: [0.78, 1.07, 1],
          rotate: 0,
          transition: { duration: 0.3, ease: 'easeOut' },
        })
      })
      .catch(() => {})

    shadowControls
      .start({ scaleX: shadowScale, opacity: shadowOpacity, transition: { duration, ease: 'linear', times } })
      .then(() =>
        shadowControls.start({
          scaleX: [1.25, 0.95, 1],
          opacity: [1, 0.75, 0.8],
          transition: { duration: 0.3, ease: 'easeOut' },
        }),
      )
      .catch(() => {})

    prevPos.current = player.position
  }, [player.position, controls, bobControls, shadowControls, reduce])

  const start = getTileCoord(prevPos.current)
  const pos = POSITIONS[index % POSITIONS.length]

  return (
    <motion.div
      initial={{ left: `${start.x * CELL + HALF}%`, top: `${start.y * CELL + HALF}%` }}
      animate={controls}
      style={{ zIndex: 20 + index }}
      className="absolute -translate-x-1/2 -translate-y-1/2 preserve-3d"
    >
      {/* 펜타곤 분산 — 각 셀 안에서 위치 차이 */}
      <div
        className="relative preserve-3d"
        style={{ transform: `translate(${pos.dx * 4}px, ${pos.dy * 4}px)` }}
      >
        {/* 그림자 — 점프 높이에 맞춰 작아지고 흐려진다. 무게감의 핵심. */}
        <motion.div
          animate={shadowControls}
          initial={{ scaleX: 1, opacity: 0.8 }}
          className="absolute left-1/2 top-full -translate-x-1/2 h-1 w-5 sm:w-6 bg-black/30 rounded-full blur-[1px] origin-center"
        />

        {/* 캐릭터 점프/회전 (이동 중에만). 보드가 기울어진 만큼 되돌려 칸 위에 세운다. */}
        <div className="stand-up">
        <motion.div animate={bobControls} style={{ transformOrigin: '50% 100%' }}>
          <div
            className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-white shadow-lg ring-1 ring-amber-900/40 ${player.color} flex items-center justify-center text-sm sm:text-base`}
          >
            <AnimalFace emoji={player.avatar} className="w-[86%] h-[86%]" />
          </div>
        </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
