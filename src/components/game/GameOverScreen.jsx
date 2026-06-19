import { motion } from 'framer-motion'

export default function GameOverScreen({ players, ownership, onRestart }) {
  // 자산 = 보유 현금 + 보유 도시 가격 합. 동률 시 alive 우선.
  const tilesByOwner = {}
  for (const info of Object.values(ownership)) {
    tilesByOwner[info.ownerId] = (tilesByOwner[info.ownerId] || 0) + 1
  }

  const ranked = [...players]
    .map((p) => ({ ...p, tileCount: tilesByOwner[p.id] || 0 }))
    .sort((a, b) => (b.alive - a.alive) || (b.money - a.money))

  const winner = ranked[0]

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="text-6xl">🏆</div>
        <div className="text-3xl font-extrabold text-amber-900 mt-2">게임 종료!</div>
        <div className="mt-4 text-xl">
          우승: <strong className="text-amber-700">{winner.name}</strong>
        </div>

        <div className="mt-6 space-y-2">
          {ranked.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl border-2 ${
                i === 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-500 w-6">{i + 1}위</span>
                <span className={`h-3 w-3 rounded-full ${p.color}`} />
                <span className="font-bold">{p.name}</span>
                {!p.alive && <span className="text-rose-500 text-xs">파산</span>}
              </div>
              <div className="text-sm text-gray-700">
                💰 {p.money.toLocaleString()} · 🏘️ {p.tileCount}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700"
        >
          다시 시작
        </button>
      </motion.div>
    </div>
  )
}
