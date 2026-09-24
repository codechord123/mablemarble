import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BOARD, getTileCoord, tileCenterPct, GRID_TEMPLATE } from '../../utils/boardConfig.js'
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
  centerStage,
  onTokenLanded,
  moveDelay = 0,
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
      {/* 테이블 원근 → 금테 판(기울어짐) → 펠트 바닥 → 칸.
          말과 가운데 무대는 판 위에 세워서 '실물 보드'처럼 보이게 한다. */}
      {/* 판을 눕히면 먼 쪽이 줄어들어 위에 약 9% 빈 공간이 생긴다.
          틀은 그만큼 낮게 잡고, 정사각형 판은 바닥에 붙여 위로 넘치게 둔다. */}
      <div
        className="board-container board-scene relative w-full"
        style={{ ...sizeStyle, aspectRatio: '1 / 0.91' }}
      >
        <div className="board-plane absolute inset-x-0 bottom-0 aspect-square p-1.5 sm:p-3">
        <div className="board-felt relative h-full w-full p-0.5 sm:p-1.5 preserve-3d">
        <div
          className="grid gap-[2px] sm:gap-1 h-full w-full preserve-3d"
          style={{ gridTemplateColumns: GRID_TEMPLATE, gridTemplateRows: GRID_TEMPLATE }}
        >
          {/* 가운데 지도 액자 — 칸보다 먼저 그려서 건물이 액자 위에 선다 */}
          <div className="board-inset" style={{ gridColumn: '2 / 7', gridRow: '2 / 7' }} aria-hidden="true" />

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
                className="p-0 min-h-0 min-w-0 border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md"
                aria-label={`${tile.name || tile.type} 칸`}
              >
                <Tile
                  tile={tile}
                  owner={owner}
                  ownerInfo={info}
                  edge={
                    (x === 0 || x === 6) && (y === 0 || y === 6)
                      ? null
                      : y === 0 ? 'top' : y === 6 ? 'bottom' : x === 0 ? 'left' : 'right'
                  }

                />
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

        {/* 말·착지 링 층. 칸과 같은 평면에서 겹쳐 깜빡이지 않게 1px 띄운다. */}
        <div
          className="absolute inset-0.5 sm:inset-1.5 pointer-events-none preserve-3d"
          style={{ transform: 'translateZ(1px)' }}
        >
          <AnimatePresence>
            {landing && (
              <div
                key={landing.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${tileCenterPct(landing.tileId).left}%`,
                  top: `${tileCenterPct(landing.tileId).top}%`,
                  width: `${tileCenterPct(landing.tileId).size}%`,
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
              startDelay={p.id === currentPlayer?.id ? moveDelay : 0}
            />
          ))}
        </div>
        </div>
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
