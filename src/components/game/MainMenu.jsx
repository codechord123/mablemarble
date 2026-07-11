import { useEffect, useState } from 'react'
import { hasSnapshot, loadSnapshot } from '../../utils/persistence.js'
import Logo from '../ui/Logo.jsx'
import GameButton from '../ui/GameButton.jsx'

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
      <div className="max-w-md w-full mx-auto bg-white/85 backdrop-blur rounded-[2rem] card-soft ring-1 ring-amber-900/5 px-8 pt-7 pb-9 text-center">
        <Logo globeSize={130} className="mb-2" />

        <div className="mt-7 space-y-5">
          {savedInfo && (
            <GameButton color="green" onClick={onResume} className="w-full py-4 text-lg">
              ▶️ 이어하기
              <div className="text-xs font-semibold opacity-90 mt-0.5">
                {savedInfo.playerCount}인 · 라운드 {savedInfo.round}
                {savedInfo.turnLimit ? `/${savedInfo.turnLimit}` : ''}
              </div>
            </GameButton>
          )}
          <GameButton color="orange" onClick={onNewGame} className="w-full py-4 text-xl">
            🎮 새 게임 시작
          </GameButton>
          <GameButton color="blue" onClick={onManageQuestions} className="w-full py-4 text-lg">
            📚 문제 관리
          </GameButton>
        </div>

        <p className="text-amber-700/70 mt-7 text-sm font-medium">5학년 교실용 학습 보드게임</p>
      </div>
    </div>
  )
}
