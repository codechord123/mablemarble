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
    <div className="min-h-screen app-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full mx-auto bg-white/90 backdrop-blur rounded-[1.75rem] card-soft ring-1 ring-amber-900/5 p-8 text-center">
        <div className="text-6xl mb-3 float-soft inline-block drop-shadow-sm">🎲</div>
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 bg-clip-text text-transparent">
          부르마블
        </h1>
        <p className="text-amber-700/90 mt-2 font-medium">5학년 교실용 학습 보드게임</p>

        <div className="mt-8 space-y-3">
          {savedInfo && (
            <button
              onClick={onResume}
              className="w-full py-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
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
            className="w-full py-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl font-bold text-lg hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            🎮 새 게임 시작
          </button>
          <button
            onClick={onManageQuestions}
            className="w-full py-4 bg-white border-2 border-amber-500/60 text-amber-700 rounded-2xl font-bold text-lg hover:bg-amber-50 hover:border-amber-500 transition-all"
          >
            📚 문제 관리
          </button>
        </div>
      </div>
    </div>
  )
}
