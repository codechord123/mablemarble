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
    <div className="min-h-[100dvh] hero-bg safe-padded flex flex-col items-center justify-center px-5 py-8 overflow-hidden">
      <Logo size="clamp(150px, 26vh, 260px)" className="menu-hero mb-5" />

      <div className="menu-panel max-w-sm w-full rounded-[2rem] px-6 pt-6 pb-5 text-center">
        <div className="space-y-4">
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

        <p className="text-sky-900/70 mt-5 text-sm font-semibold">교실용 학습 보드게임</p>
      </div>
    </div>
  )
}
