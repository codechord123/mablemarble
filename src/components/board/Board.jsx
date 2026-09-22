import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BOARD, getTileCoord } from '../../utils/boardConfig.js'
import Tile from './Tile.jsx'
import PlayerToken from './PlayerToken.jsx'
import BoardCenter from './BoardCenter.jsx'
import TileInfoModal from './TileInfoModal.jsx'

const CELL = 100 / 7

export default function Board({
  players,
  ownership,
  currentPlayer,
  lastRoll,
  currentRound,
  turnLimit,
  isLandscape,
  centerStage,
  onTokenLanded,
}) {
  const [selectedTile, setSelectedTile] = useState(null)
  // 말이 착지한 칸에서 한 번 퍼지는 링. 도착을 움직임으로 알린다.
  const [landing, setLanding] = useState(null)
  const landingKey = useRef(0)

  const handleLanded = (tileId) => {
    setLanding({ tileId, key: ++landingKey.current })
    onTokenLanded?.(tileId)
  }

  // 디바이스 적응:
  // - 가로 모드: 화면 높이 기준
  // - 세로 모드: 화면 너비 기준. 주사위·액션이 보드 중앙 무대로 들어가면서
  //   아래에 두던 액션 패널이 사라져 보드에 세로 공간을 더 줄 수 있게 됐다.
  const sizeStyle = isLandscape
    ? { maxWidth: 'min(calc(100vh - 2rem), 100%, 56rem)' }
    : centerStage
      ? { maxWidth: 'min(95vw, calc(100vh - 16rem), 56rem)' }
      : { maxWidth: 'min(95vw, calc(100vh - 28rem), 56rem)' }

  const ownerOf = (tileId) => {
    const info = ownership[tileId]
    return info ? players[info.ownerId] : null
  }

  return (
    <>
      <div
        className="board-container relative aspect-square w-full bg-amber-100 p-1.5 sm:p-2 rounded-2xl shadow-lg"
        style={sizeStyle}
      >
        <div className="grid grid-cols-7 grid-rows-7 gap-1 h-full w-full">
          {BOARD.map((tile) => {
            const { x, y } = getTileCoord(tile.id)
            const info = ownership[tile.id]
            const owner = ownerOf(tile.id)
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => setSelectedTile(tile.id)}
                style={{ gridColumn: x + 1, gridRow: y + 1 }}
                className="p-0 border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
                aria-label={`${tile.name || tile.type} 칸`}
              >
                <Tile tile={tile} owner={owner} ownerInfo={info} />
              </button>
            )
          })}

          <BoardCenter
            player={currentPlayer}
            lastRoll={lastRoll}
            currentRound={currentRound}
            turnLimit={turnLimit}
            stage={centerStage}
          />
        </div>

        <div className="absolute inset-1.5 sm:inset-2 pointer-events-none">
          <AnimatePresence>
            {landing && (
              <div
                key={landing.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${getTileCoord(landing.tileId).x * CELL + CELL / 2}%`,
                  top: `${getTileCoord(landing.tileId).y * CELL + CELL / 2}%`,
                  width: `${CELL}%`,
                  aspectRatio: '1',
                }}
              >
                <motion.span
                  initial={{ scale: 0.35, opacity: 0.9 }}
                  animate={{ scale: 1.75, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  onAnimationComplete={() => setLanding(null)}
                  className="block h-full w-full rounded-full border-[3px] border-amber-500"
                />
              </div>
            )}
          </AnimatePresence>

          {players.filter((p) => p.alive).map((p, i) => (
            <PlayerToken
              key={p.id}
              player={p}
              index={i}
              onLanded={p.id === currentPlayer?.id ? handleLanded : undefined}
            />
          ))}
        </div>
      </div>

      {selectedTile != null && (
        <TileInfoModal
          tile={BOARD[selectedTile]}
          owner={ownerOf(selectedTile)}
          ownerInfo={ownership[selectedTile]}
          onClose={() => setSelectedTile(null)}
        />
      )}
    </>
  )
}
