export default function PlayerCard({ player, isCurrent }) {
  return (
    <div
      className={`p-3 rounded-xl border-2 transition-all ${
        isCurrent
          ? 'border-amber-500 bg-white shadow-xl scale-105'
          : 'border-transparent bg-white/60 opacity-70'
      } ${!player.alive ? 'grayscale opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div className={`h-7 w-7 rounded-full ${player.color} flex items-center justify-center text-base shadow`}>
          {player.avatar || '●'}
        </div>
        <span className="font-bold text-amber-900 truncate">{player.name}</span>
      </div>
      <div className="text-amber-700 text-sm mt-1">💰 {player.money.toLocaleString()}원</div>
      {player.islandTurnsLeft > 0 && (
        <div className="text-xs text-sky-600 mt-0.5">🏝️ 무인도 {player.islandTurnsLeft}턴</div>
      )}
      {!player.alive && <div className="text-red-500 text-xs mt-1">파산</div>}
    </div>
  )
}
