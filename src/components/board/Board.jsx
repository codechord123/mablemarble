import { useState } from 'react'
import { BOARD, getTileCoord } from '../../utils/boardConfig.js'
import Tile from './Tile.jsx'
import PlayerToken from './PlayerToken.jsx'
import BoardCenter from './BoardCenter.jsx'
import TileInfoModal from './TileInfoModal.jsx'

export default function Board({
  players,
  ownership,
  currentPlayer,
  lastRoll,
  currentRound,
  turnLimit,
  isLandscape,
}) {
  const [selectedTile, setSelectedTile] = useState(null)

  // 디바이스 적응:
  // - 가로 모드: 화면 높이 기준 (컨트롤 자리 빼고)
  // - 세로 모드: 화면 너비 기준
  // - 절대 최대: 56rem (= 896px)
  const sizeStyle = isLandscape
    ? { maxWidth: 'min(calc(100vh - 11rem), 100%, 56rem)' }
    : { maxWidth: 'min(95vw, calc(100vh - 24rem), 56rem)' }

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
          />
        </div>

        <div className="absolute inset-1.5 sm:inset-2 pointer-events-none">
          {players.filter((p) => p.alive).map((p, i) => (
            <PlayerToken key={p.id} player={p} index={i} />
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
