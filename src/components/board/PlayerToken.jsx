import { motion } from 'framer-motion'
import { getTileCoord } from '../../utils/boardConfig.js'

const CELL = 100 / 7
const HALF = CELL / 2

export default function PlayerToken({ player, index }) {
  const { x, y } = getTileCoord(player.position)
  const dx = (index % 2 === 0 ? -1 : 1) * Math.ceil(index / 2) * 6
  const dy = (index < 3 ? -1 : 1) * 4

  return (
    <motion.div
      initial={false}
      animate={{ left: `${x * CELL + HALF}%`, top: `${y * CELL + HALF}%` }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      style={{ marginLeft: dx, marginTop: dy, zIndex: 20 + index }}
      className={`absolute h-5 w-5 sm:h-7 sm:w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ring-2 ring-amber-900/30 ${player.color}`}
    />
  )
}
