// 보드 가운데 5x5 영역.
// 예전에는 아바타 하나와 반투명 로고만 있는 장식 공간이었다. 보드 면적의 절반을
// 비워 두고 정작 매 턴 쓰는 주사위는 보드 밖 별도 카드에 있어서, 아이 시선이
// '보드 중앙 → 화면 아래'로 매번 크게 점프했다.
// 지금은 세로 모드에서 이 자리가 무대(stage)다. 굴리고, 사고, 짓는 일이
// 전부 여기서 일어나므로 시선이 보드를 벗어나지 않는다.

import { motion } from 'framer-motion'
import AnimalFace from '../ui/AnimalFace.jsx'

export default function BoardCenter({ player, lastRoll, currentRound, turnLimit, stage }) {
  const progress = turnLimit ? Math.min(100, (currentRound / turnLimit) * 100) : null

  return (
    <div
      className={`col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center text-center min-h-0 ${
        stage ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      // 가장자리는 비워 둔다 — 칸 옆(가운데 쪽)에 세운 건물이 서는 자리
      style={{ padding: 'clamp(10px, 5cqi, 48px)' }}
    >
      {/* 차례 표시 — 무대가 있을 때는 한 줄로 압축해 자리를 내준다 */}
      {player && (
        <motion.div
          key={player.id}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={stage ? 'flex items-center gap-1.5' : 'flex flex-col items-center gap-1'}
        >
          <div
            className={`rounded-full ${player.color} flex items-center justify-center shadow-md border-2 border-white ${
              stage ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-10 w-10 sm:h-12 sm:w-12'
            }`}
          >
            <AnimalFace emoji={player.avatar} className="w-[86%] h-[86%]" />
          </div>
          <div className="text-amber-900 font-bold tile-text-name">
            {player.name}
            {stage && <span className="text-amber-700 font-semibold"> 차례</span>}
          </div>
          {!stage && <div className="text-amber-700 tile-text-meta">차례</div>}
        </motion.div>
      )}

      {/* 라운드 — 유일한 표시 자리. 예전에는 사이드바에도 같은 숫자가 있었다. */}
      <div className="mt-1 flex flex-col items-center gap-0.5">
        <div className="px-2 py-0.5 bg-amber-200/60 rounded-full text-amber-900 tile-text-meta font-bold">
          라운드 {currentRound}
          {turnLimit ? ` / ${turnLimit}` : ''}
        </div>
        {progress !== null && (
          <div className="h-1 w-16 bg-amber-200/70 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {stage ? (
        <div className="board-stage mt-1 min-h-0">{stage}</div>
      ) : (
        lastRoll && (
          <div className="mt-2 text-amber-800 tile-text-name font-bold">
            🎲 {lastRoll.d1} + {lastRoll.d2} = {lastRoll.total}
          </div>
        )
      )}
    </div>
  )
}
