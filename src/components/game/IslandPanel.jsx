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
        <button
          onClick={onEscapeAttempt}
          className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow hover:bg-emerald-700"
        >
          🎯 문제로 탈출 시도
        </button>
        <button
          onClick={onSkipTurn}
          className="px-5 py-2 bg-gray-400 text-white rounded-lg font-bold shadow hover:bg-gray-500"
        >
          한 턴 쉬기
        </button>
      </div>
    </div>
  )
}
