// 보드 가운데 5x5 영역. 현재 플레이어/주사위/라운드를 한눈에 보여줌.

import { motion } from 'framer-motion'

export default function BoardCenter({ player, lastRoll, currentRound, turnLimit }) {
  return (
    <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center text-center pointer-events-none">
      <div className="text-amber-900/30 font-extrabold tile-text-name">부르마블</div>

      {player && (
        <motion.div
          key={player.id}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-2 flex flex-col items-center gap-1"
        >
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${player.color} flex items-center justify-center text-xl sm:text-2xl shadow-lg border-2 border-white`}>
            {player.avatar || '●'}
          </div>
          <div className="text-amber-900 font-bold tile-text-name">{player.name}</div>
          <div className="text-amber-700 tile-text-meta">차례</div>
        </motion.div>
      )}

      {lastRoll && (
        <div className="mt-2 text-amber-800 tile-text-name font-bold">
          🎲 {lastRoll.d1} + {lastRoll.d2} = {lastRoll.total}
        </div>
      )}

      <div className="mt-1 px-2 py-0.5 bg-amber-200/60 rounded-full text-amber-900 tile-text-meta font-bold">
        라운드 {currentRound}{turnLimit ? ` / ${turnLimit}` : ''}
      </div>
    </div>
  )
}
