import GameButton from '../ui/GameButton.jsx'

export default function IslandPanel({ player, onEscapeAttempt, onSkipTurn }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-2xl font-extrabold text-sky-900">🏝️ 무인도에 갇혔어요</div>
      <div className="text-amber-700">
        남은 턴: <strong>{player.islandTurnsLeft}턴</strong>
      </div>
      <div className="text-sm text-amber-600 text-center max-w-md">
        문제를 맞히면 바로 탈출! 아니면 한 턴 쉬어요.
      </div>
      <div className="flex gap-2">
        <GameButton color="green" onClick={onEscapeAttempt} className="px-5 py-2.5 text-sm">
          🎯 문제로 탈출
        </GameButton>
        <GameButton color="gray" onClick={onSkipTurn} className="px-5 py-2.5 text-sm">
          한 턴 쉬기
        </GameButton>
      </div>
    </div>
  )
}
