import { useState } from 'react'

export default function GameSetup({ onStart }) {
  const [names, setNames] = useState(['플레이어1', '플레이어2'])

  const updateName = (i, value) => {
    const next = [...names]
    next[i] = value
    setNames(next)
  }

  const canStart = names.filter((n) => n.trim()).length >= 2

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-amber-900 mb-1">게임 설정</h2>
      <p className="text-sm text-amber-700 mb-4">2~5명 입력 후 시작!</p>

      <div className="space-y-2">
        {names.map((name, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none"
              maxLength={10}
            />
            {names.length > 2 && (
              <button
                onClick={() => setNames(names.filter((_, j) => j !== i))}
                className="px-3 text-red-500 hover:bg-red-50 rounded"
                aria-label="플레이어 제거"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {names.length < 5 && (
        <button
          onClick={() => setNames([...names, `플레이어${names.length + 1}`])}
          className="mt-3 text-amber-600 hover:underline text-sm"
        >
          + 플레이어 추가
        </button>
      )}

      <button
        onClick={() => onStart(names.map((n) => n.trim()).filter(Boolean))}
        disabled={!canStart}
        className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        게임 시작!
      </button>
    </div>
  )
}
