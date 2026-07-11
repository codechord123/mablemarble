import GameButton from '../ui/GameButton.jsx'

export default function IslandPanel({ player, onEscapeAttempt, onSkipTurn }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-2xl">🏝️ 무인도에 갇혔습니다</div>
      <div className="text-amber-700">
        남은 갇힘 턴: <strong>{player.islandTurnsLeft}턴</strong>
      </div>
      <div className="text-sm text-amber-600 text-center max-w-md">
        퀴즈를 풀어 즉시 탈출하거나, 한 턴을 쉬며 기다릴 수 있어요.
      </div>
      <div className="flex gap-2">
        <GameButton color="green" onClick={onEscapeAttempt} className="px-5 py-2.5 text-sm whitespace-nowrap">
          🎯 문제로 탈출 시도
        </GameButton>
        <GameButton color="gray" onClick={onSkipTurn} className="px-5 py-2.5 text-sm whitespace-nowrap">
          한 턴 쉬기
        </GameButton>
      </div>
    </div>
  )
}
