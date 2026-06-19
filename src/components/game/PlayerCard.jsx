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
        <div className={`h-4 w-4 rounded-full ${player.color}`} />
        <span className="font-bold text-amber-900 truncate">{player.name}</span>
      </div>
      <div className="text-amber-700 text-sm mt-1">💰 {player.money.toLocaleString()}원</div>
      {!player.alive && <div className="text-red-500 text-xs mt-1">파산</div>}
    </div>
  )
}
