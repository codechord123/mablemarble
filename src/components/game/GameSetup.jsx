import { useEffect, useState } from 'react'
import { useQuestionStore, SAMPLE_SET_ID } from '../../stores/questionStore.js'

export default function GameSetup({ onStart, onBack }) {
  const [names, setNames] = useState(['플레이어1', '플레이어2'])

  const sets = useQuestionStore((s) => s.sets)
  const selectedSetId = useQuestionStore((s) => s.selectedSetId)
  const activeQuestions = useQuestionStore((s) => s.activeQuestions)
  const refresh = useQuestionStore((s) => s.refresh)
  const selectSet = useQuestionStore((s) => s.selectSet)

  useEffect(() => { refresh() }, [refresh])

  const updateName = (i, value) => {
    const next = [...names]
    next[i] = value
    setNames(next)
  }

  const canStart = names.filter((n) => n.trim()).length >= 2 && activeQuestions.length > 0

  const handleSetChange = (e) => {
    const raw = e.target.value
    selectSet(raw === SAMPLE_SET_ID ? SAMPLE_SET_ID : Number(raw))
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-6">
        {onBack && (
          <button onClick={onBack} className="text-amber-700 hover:underline mb-3 text-sm font-semibold">
            ← 메인 메뉴
          </button>
        )}
        <h2 className="text-2xl font-bold text-amber-900 mb-1">게임 설정</h2>
        <p className="text-sm text-amber-700 mb-4">2~5명 입력 후 시작!</p>

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
          <div className="text-xs text-gray-500 mt-1">
            현재 활성: {activeQuestions.length}문제
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-amber-900">플레이어</label>
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
                  className="px-3 text-rose-500 hover:bg-rose-50 rounded"
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
    </div>
  )
}
