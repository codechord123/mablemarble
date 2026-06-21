import { useEffect, useState } from 'react'
import { useQuestionStore, SAMPLE_SET_ID } from '../../stores/questionStore.js'
import { AVATARS, DEFAULT_AVATAR, nextAvailableAvatar } from '../../data/avatars.js'
import { GAME_MODES, DEFAULT_MODE } from '../../data/gameModes.js'

const initialPlayers = () => [
  { name: '플레이어1', avatar: AVATARS[0] },
  { name: '플레이어2', avatar: AVATARS[1] },
]

export default function GameSetup({ onStart, onBack }) {
  const [players, setPlayers] = useState(initialPlayers)
  const [modeId, setModeId] = useState(DEFAULT_MODE)

  const sets = useQuestionStore((s) => s.sets)
  const selectedSetId = useQuestionStore((s) => s.selectedSetId)
  const activeQuestions = useQuestionStore((s) => s.activeQuestions)
  const refresh = useQuestionStore((s) => s.refresh)
  const selectSet = useQuestionStore((s) => s.selectSet)

  useEffect(() => { refresh() }, [refresh])

  const usedAvatars = players.map((p) => p.avatar)

  const updatePlayer = (i, patch) => {
    setPlayers((curr) => {
      const next = [...curr]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }

  const cycleAvatar = (i) => {
    const current = players[i].avatar
    const next = nextAvailableAvatar(usedAvatars, current)
    updatePlayer(i, { avatar: next })
  }

  const pickAvatar = (i, avatar) => {
    if (usedAvatars.includes(avatar) && avatar !== players[i].avatar) return
    updatePlayer(i, { avatar })
  }

  const removePlayer = (i) => {
    setPlayers((curr) => curr.filter((_, j) => j !== i))
  }

  const addPlayer = () => {
    setPlayers((curr) => {
      const used = curr.map((p) => p.avatar)
      const avatar = AVATARS.find((a) => !used.includes(a)) || DEFAULT_AVATAR
      return [...curr, { name: `플레이어${curr.length + 1}`, avatar }]
    })
  }

  const validPlayers = players.filter((p) => p.name.trim()).length >= 2
  const canStart = validPlayers && activeQuestions.length > 0

  const handleSetChange = (e) => {
    const raw = e.target.value
    selectSet(raw === SAMPLE_SET_ID ? SAMPLE_SET_ID : Number(raw))
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full mx-auto bg-white rounded-2xl shadow-xl p-6">
        {onBack && (
          <button onClick={onBack} className="text-amber-700 hover:underline mb-3 text-sm font-semibold">
            ← 메인 메뉴
          </button>
        )}
        <h2 className="text-2xl font-bold text-amber-900 mb-1">게임 설정</h2>
        <p className="text-sm text-amber-700 mb-4">2~5명, 캐릭터·이름 선택 후 시작!</p>

        <div className="mb-5">
          <label className="block text-sm font-bold text-amber-900 mb-2">게임 모드</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(GAME_MODES).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setModeId(mode.id)}
                className={`p-2 rounded-xl border-2 text-left transition ${
                  modeId === mode.id
                    ? 'border-amber-500 bg-amber-50 shadow'
                    : 'border-gray-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="font-bold text-amber-900 text-sm">{mode.label}</div>
                <div className="text-[10px] text-amber-700 mt-0.5 leading-snug">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-bold text-amber-900 mb-1">문제 세트</label>
          <select
            value={selectedSetId}
            onChange={handleSetChange}
            className="w-full p-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none bg-white"
          >
            <option value={SAMPLE_SET_ID}>기본 샘플 (30문제 · 사회/수학/과학/국어)</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.count}문제)
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">현재 활성: {activeQuestions.length}문제</div>
        </div>

        <label className="block text-sm font-bold text-amber-900 mb-2">플레이어</label>
        <div className="space-y-3">
          {players.map((p, i) => (
            <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => cycleAvatar(i)}
                  className="h-12 w-12 rounded-full bg-white shadow border-2 border-amber-300 flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition"
                  title="클릭하여 다른 캐릭터로 변경"
                >
                  {p.avatar}
                </button>
                <input
                  value={p.name}
                  onChange={(e) => updatePlayer(i, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none bg-white"
                  maxLength={10}
                  placeholder="이름"
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="px-3 text-rose-500 hover:bg-rose-50 rounded"
                    aria-label="플레이어 제거"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {AVATARS.map((a) => {
                  const taken = usedAvatars.includes(a) && a !== p.avatar
                  const selected = a === p.avatar
                  return (
                    <button
                      key={a}
                      onClick={() => pickAvatar(i, a)}
                      disabled={taken}
                      className={`h-8 w-8 rounded-full text-lg transition ${
                        selected
                          ? 'bg-amber-500 ring-2 ring-amber-700 scale-110'
                          : taken
                            ? 'bg-gray-200 opacity-30 cursor-not-allowed'
                            : 'bg-white hover:bg-amber-100'
                      }`}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {players.length < 5 && (
          <button onClick={addPlayer} className="mt-3 text-amber-600 hover:underline text-sm">
            + 플레이어 추가
          </button>
        )}

        <button
          onClick={() => onStart(players.filter((p) => p.name.trim()), modeId)}
          disabled={!canStart}
          className="mt-6 w-full py-3 bg-amber-600 text-white rounded-xl font-bold shadow hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          게임 시작!
        </button>
      </div>
    </div>
  )
}
