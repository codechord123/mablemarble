import { useEffect, useRef, useState } from 'react'
import { useGameStore } from './stores/gameStore.js'
import { getTile } from './utils/gameEngine.js'
import Board from './components/board/Board.jsx'
import PlayerCard from './components/game/PlayerCard.jsx'
import DiceRoller from './components/game/DiceRoller.jsx'
import TurnAnnouncement from './components/game/TurnAnnouncement.jsx'
import GameSetup from './components/game/GameSetup.jsx'
import TileActionPanel from './components/game/TileActionPanel.jsx'
import QuestionModal from './components/game/QuestionModal.jsx'
import ResultBanner from './components/game/ResultBanner.jsx'
import GameOverScreen from './components/game/GameOverScreen.jsx'

export default function App() {
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const phase = useGameStore((s) => s.phase)
  const lastRoll = useGameStore((s) => s.lastRoll)
  const ownership = useGameStore((s) => s.ownership)
  const welfarePool = useGameStore((s) => s.welfarePool)
  const currentQuestion = useGameStore((s) => s.currentQuestion)
  const pendingAction = useGameStore((s) => s.pendingAction)
  const lastResult = useGameStore((s) => s.lastResult)

  const initGame = useGameStore((s) => s.initGame)
  const rollAndMove = useGameStore((s) => s.rollAndMove)
  const attemptPurchase = useGameStore((s) => s.attemptPurchase)
  const attemptSkipToll = useGameStore((s) => s.attemptSkipToll)
  const payToll = useGameStore((s) => s.payToll)
  const payTax = useGameStore((s) => s.payTax)
  const claimWelfare = useGameStore((s) => s.claimWelfare)
  const skipTile = useGameStore((s) => s.skipTile)
  const submitAnswer = useGameStore((s) => s.submitAnswer)
  const closeResult = useGameStore((s) => s.closeResult)
  const restart = useGameStore((s) => s.restart)

  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const lastAnnouncedTurn = useRef(-1)

  // 턴 안내: currentTurn 변경 시에만 발동 (더블 재굴림 시 미발동)
  useEffect(() => {
    if (phase === 'setup' || phase === 'gameover') {
      lastAnnouncedTurn.current = -1
      setShowAnnouncement(false)
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

  if (phase === 'gameover') {
    return <GameOverScreen players={players} ownership={ownership} onRestart={restart} />
  }

  const current = players[currentTurn]
  const currentTile = current ? getTile(current.position) : null

  const handleTileAction = (action) => {
    if (action.type === 'attempt-purchase') return attemptPurchase(currentTile)
    if (action.type === 'attempt-skip-toll') return attemptSkipToll(currentTile, action.toll)
    if (action.type === 'pay-toll') return payToll(currentTile, action.toll)
    if (action.type === 'pay-tax') return payTax(action.amount)
    if (action.type === 'claim-welfare') return claimWelfare()
    if (action.type === 'skip') return skipTile()
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-6">
      <TurnAnnouncement player={current} show={showAnnouncement} />

      {phase === 'question' && currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          intent={pendingAction?.type}
          player={current}
          onSubmit={submitAnswer}
        />
      )}

      <ResultBanner result={lastResult} onClose={closeResult} />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_14rem] gap-6">
        <div className="flex flex-col items-center gap-4">
          <Board players={players} ownership={ownership} />

          <div className="bg-white/80 backdrop-blur rounded-2xl p-4 shadow-md w-full max-w-2xl min-h-[160px] flex flex-col items-center justify-center gap-3">
            {phase === 'rolling' && (
              <DiceRoller lastRoll={lastRoll} onRoll={rollAndMove} disabled={showAnnouncement} />
            )}
            {phase === 'tile' && currentTile && (
              <TileActionPanel
                tile={currentTile}
                player={current}
                players={players}
                ownership={ownership}
                lastRoll={lastRoll}
                onAction={handleTileAction}
              />
            )}
            {phase === 'question' && (
              <div className="text-amber-700 text-sm">문제에 답해 주세요…</div>
            )}
            {phase === 'result' && (
              <div className="text-amber-700 text-sm">결과 확인 중…</div>
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 content-start">
            {players.map((p, i) => (
              <PlayerCard key={p.id} player={p} isCurrent={i === currentTurn} />
            ))}
          </div>
          {welfarePool > 0 && (
            <div className="p-3 bg-pink-100 rounded-xl border-2 border-pink-300 text-center">
              <div className="text-xs text-pink-700 font-bold">사회복지 풀</div>
              <div className="text-lg font-extrabold text-pink-800">
                💰 {welfarePool.toLocaleString()}원
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
