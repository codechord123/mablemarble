import { useEffect, useState } from 'react'
import { hasSnapshot, loadSnapshot } from '../../utils/persistence.js'
import Logo from '../ui/Logo.jsx'
import GameButton from '../ui/GameButton.jsx'
import Toast from '../ui/Toast.jsx'
import { useAccount, logoutMe, clearNotice } from '../../account/store.js'
import { goToLogin } from '../../account/site.js'

export default function MainMenu({ onNewGame, onManageQuestions, onResume, onDrill, onReview }) {
  const [savedInfo, setSavedInfo] = useState(null)
  const me = useAccount((s) => s.me)
  const checking = useAccount((s) => s.checking)
  const notice = useAccount((s) => s.notice)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(clearNotice, 3500)
    return () => clearTimeout(t)
  }, [notice])

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
        {/* 내 계정 — 역사게임과 같은 아이디. 로그인하면 틀린 문제가 내 오답 노트에 모인다 */}
        <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl bg-white/70 px-3 py-2 text-left ring-1 ring-amber-900/10">
          {me ? (
            <>
              <span className="min-w-0 truncate text-sm font-extrabold text-amber-950">
                🎒 {me.name || me.username}
                <span className="ml-1 text-xs font-bold text-amber-700">로그인됨</span>
              </span>
              <button onClick={() => logoutMe()} className="shrink-0 text-xs font-bold text-gray-500 underline">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-amber-800">
                {checking ? '로그인 확인 중…' : '로그인하면 오답 노트가 생겨요'}
              </span>
              <button
                onClick={goToLogin}
                disabled={checking}
                className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-white shadow disabled:opacity-50"
              >
                🔑 학생 로그인
              </button>
            </>
          )}
        </div>
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
          {onDrill && (
            <GameButton color="violet" onClick={onDrill} className="w-full py-4 text-lg">
              🧮 분수 곱셈 수련장
              <div className="text-xs font-semibold opacity-90 mt-0.5">혼자 연습하고 레벨 올리기</div>
            </GameButton>
          )}
          {me && onReview && (
            <GameButton color="red" onClick={onReview} className="w-full py-4 text-lg">
              📒 오답 다시 풀기
              <div className="text-xs font-semibold opacity-90 mt-0.5">내가 틀린 문제만 모아서</div>
            </GameButton>
          )}
          <GameButton color="blue" onClick={onManageQuestions} className="w-full py-4 text-lg">
            📚 문제 관리
          </GameButton>
        </div>

        <p className="text-sky-900/70 mt-5 text-sm font-semibold">교실용 학습 보드게임</p>
      </div>
      <Toast show={!!notice} color="bg-violet-600">{notice}</Toast>

    </div>
  )
}
