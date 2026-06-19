import { BOARD, getTileCoord } from '../../utils/boardConfig.js'
import Tile from './Tile.jsx'
import PlayerToken from './PlayerToken.jsx'

export default function Board({ players, ownership }) {
  return (
    <div className="relative aspect-square w-full max-w-2xl bg-amber-100 p-2 rounded-2xl shadow-lg">
      <div className="grid grid-cols-7 grid-rows-7 gap-1 h-full w-full">
        {BOARD.map((tile) => {
          const { x, y } = getTileCoord(tile.id)
          const ownerInfo = ownership[tile.id]
          const owner = ownerInfo ? players[ownerInfo.ownerId] : null
          return (
            <div key={tile.id} style={{ gridColumn: x + 1, gridRow: y + 1 }}>
              <Tile tile={tile} owner={owner} ownerInfo={ownerInfo} />
            </div>
          )
        })}
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex items-center justify-center pointer-events-none">
          <div className="text-4xl sm:text-6xl font-extrabold text-amber-900/20 select-none">
            부르마블
          </div>
        </div>
      </div>
      <div className="absolute inset-2 pointer-events-none">
        {players.filter((p) => p.alive).map((p, i) => (
          <PlayerToken key={p.id} player={p} index={i} />
        ))}
      </div>
    </div>
  )
}
