import AnimatedNumber from '../ui/AnimatedNumber.jsx'

export default function PlayerCard({ player, isCurrent }) {
  const stats = player.stats || { answered: 0, correct: 0 }
  const accuracy = stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null

  return (
    <div
      className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 ${
        isCurrent
          ? 'border-amber-400 bg-white breathe-ring scale-[1.02]'
          : 'border-amber-900/5 bg-white/70 card-soft opacity-80'
      } ${!player.alive ? 'grayscale opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full ${player.color} flex items-center justify-center text-base sm:text-lg shadow-sm ring-2 ring-white flex-shrink-0`}>
          {player.avatar || '●'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-amber-900 truncate text-sm sm:text-base leading-tight">{player.name}</div>
          <div className="text-amber-700 text-xs sm:text-sm leading-tight font-semibold tabular-nums">
            💰 <AnimatedNumber value={player.money} />원
          </div>
        </div>
      </div>
      {(accuracy !== null || player.islandTurnsLeft > 0) && (
        <div className="flex items-center justify-between mt-1.5 text-[10px] sm:text-xs">
          {accuracy !== null && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              ✅ {stats.correct}/{stats.answered}
              <span className="text-emerald-500">·</span>
              {accuracy}%
            </span>
          )}
          {player.islandTurnsLeft > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 font-semibold">
              🏝️ {player.islandTurnsLeft}
            </span>
          )}
        </div>
      )}
      {!player.alive && <div className="text-red-500 text-xs mt-0.5 font-bold">💥 파산</div>}
    </div>
  )
}
