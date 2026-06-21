import { useEffect, useState } from 'react'
import { hasSnapshot, loadSnapshot } from '../../utils/persistence.js'

export default function MainMenu({ onNewGame, onManageQuestions, onResume }) {
  const [savedInfo, setSavedInfo] = useState(null)

  useEffect(() => {
    if (hasSnapshot()) {
      const snap = loadSnapshot()
      if (snap) {
        setSavedInfo({
          playerCount: snap.players?.length || 0,
          round: snap.currentRound || 1,
          turnLimit: snap.turnLimit,
          savedAt: snap.savedAt,
        })
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-2">🎲</div>
        <h1 className="text-4xl font-extrabold text-amber-900">부르마블</h1>
        <p className="text-amber-700 mt-1">5학년 교실용 학습 보드게임</p>

        <div className="mt-8 space-y-3">
          {savedInfo && (
            <button
              onClick={onResume}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 shadow transition"
            >
              ▶️ 이어하기
              <div className="text-xs font-normal opacity-80 mt-1">
                {savedInfo.playerCount}인 · 라운드 {savedInfo.round}
                {savedInfo.turnLimit ? `/${savedInfo.turnLimit}` : ''}
                {savedInfo.savedAt &&
                  ` · ${new Date(savedInfo.savedAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}`}
              </div>
            </button>
          )}
          <button
            onClick={onNewGame}
            className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 shadow transition"
          >
            🎮 새 게임 시작
          </button>
          <button
            onClick={onManageQuestions}
            className="w-full py-4 bg-white border-2 border-amber-600 text-amber-700 rounded-xl font-bold text-lg hover:bg-amber-50 transition"
          >
            📚 문제 관리
          </button>
        </div>
      </div>
    </div>
  )
}
