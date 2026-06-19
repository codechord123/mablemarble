import { useEffect, useRef, useState } from 'react'
import { useGameStore } from './stores/gameStore.js'
import Board from './components/board/Board.jsx'
import PlayerCard from './components/game/PlayerCard.jsx'
import DiceRoller from './components/game/DiceRoller.jsx'
import TurnAnnouncement from './components/game/TurnAnnouncement.jsx'
import GameSetup from './components/game/GameSetup.jsx'

export default function App() {
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const phase = useGameStore((s) => s.phase)
  const lastRoll = useGameStore((s) => s.lastRoll)
  const ownership = useGameStore((s) => s.ownership)
  const initGame = useGameStore((s) => s.initGame)
  const rollAndMove = useGameStore((s) => s.rollAndMove)
  const endTurn = useGameStore((s) => s.endTurn)

  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [currentTile, setCurrentTile] = useState(null)
  const lastAnnouncedTurn = useRef(-1)

  // 턴 시작 시 1.5초 풀스크린 안내 (같은 플레이어 더블 재굴림 시는 미발동)
  useEffect(() => {
    if (phase === 'setup') {
      lastAnnouncedTurn.current = -1
      return
    }
    if (lastAnnouncedTurn.current !== currentTurn) {
      lastAnnouncedTurn.current = currentTurn
      setShowAnnouncement(true)
      const t = setTimeout(() => setShowAnnouncement(false), 1500)
      return () => clearTimeout(t)
    }
  }, [currentTurn, phase])

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <GameSetup onStart={initGame} />
      </div>
    )
  }

  const current = players[currentTurn]

  const handleRoll = () => {
    const { tile } = rollAndMove()
    setCurrentTile(tile)
  }

  const handleNext = () => {
    setCurrentTile(null)
    endTurn()
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-6">
      <TurnAnnouncement player={current} show={showAnnouncement} />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_14rem] gap-6">
        <div className="flex flex-col items-center gap-4">
          <Board players={players} ownership={ownership} />

          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-md w-full max-w-2xl min-h-[140px] flex flex-col items-center justify-center gap-3">
            {phase === 'rolling' && (
              <DiceRoller
                lastRoll={lastRoll}
                onRoll={handleRoll}
                disabled={showAnnouncement}
                color={current?.color?.replace('bg-', 'bg-').concat(' hover:opacity-90')}
              />
            )}

            {phase === 'tile' && currentTile && (
              <div className="flex flex-col items-center gap-2">
                <div className="text-amber-900 font-bold text-lg">
                  🎲 {lastRoll?.d1} + {lastRoll?.d2} = {lastRoll?.total}
                  {lastRoll?.isDouble && <span className="ml-2 text-rose-600">더블! 한 번 더</span>}
                </div>
                <div className="text-amber-700">
                  <strong className="text-amber-900">{current.name}</strong> → {currentTile.name || currentTile.type}
                </div>
                <button
                  onClick={handleNext}
                  className="mt-2 px-6 py-2 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 font-bold"
                >
                  {lastRoll?.isDouble ? '계속' : '다음 턴'}
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:w-56 content-start">
          {players.map((p, i) => (
            <PlayerCard key={p.id} player={p} isCurrent={i === currentTurn} />
          ))}
        </aside>
      </div>
    </div>
  )
}
