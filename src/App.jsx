import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGameStore } from './stores/gameStore.js'
import { getTile } from './utils/gameEngine.js'
import useViewport from './hooks/useViewport.js'
import Board from './components/board/Board.jsx'
import PlayerCard from './components/game/PlayerCard.jsx'
import DiceRoller from './components/game/DiceRoller.jsx'
import TurnAnnouncement from './components/game/TurnAnnouncement.jsx'
import GameSetup from './components/game/GameSetup.jsx'
import TileActionPanel from './components/game/TileActionPanel.jsx'
import QuestionModal from './components/game/QuestionModal.jsx'
import ResultBanner from './components/game/ResultBanner.jsx'
import GameOverScreen from './components/game/GameOverScreen.jsx'
import MainMenu from './components/game/MainMenu.jsx'
import GoldenKeyModal from './components/game/GoldenKeyModal.jsx'
import IslandPanel from './components/game/IslandPanel.jsx'
import SpaceTravelModal from './components/game/SpaceTravelModal.jsx'
import MuteToggle from './components/ui/MuteToggle.jsx'
import Toast from './components/ui/Toast.jsx'
import ConfirmDialog from './components/ui/ConfirmDialog.jsx'

const QuestionManager = lazy(() => import('./components/questions/QuestionManager.jsx'))

function FullScreenSpinner({ label = '불러오는 중…' }) {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-amber-700 font-bold animate-pulse">{label}</div>
    </div>
  )
}

export default function App() {
  const players = useGameStore((s) => s.players)
  const currentTurn = useGameStore((s) => s.currentTurn)
  const phase = useGameStore((s) => s.phase)
  const lastRoll = useGameStore((s) => s.lastRoll)
  const ownership = useGameStore((s) => s.ownership)
  const welfarePool = useGameStore((s) => s.welfarePool)
  const currentQuestion = useGameStore((s) => s.currentQuestion)
  const pendingAction = useGameStore((s) => s.pendingAction)
  const lastResult = useGameStore((s) => s.lastResult)
  const currentCard = useGameStore((s) => s.currentCard)

  const initGame = useGameStore((s) => s.initGame)
  const rollAndMove = useGameStore((s) => s.rollAndMove)
  const attemptPurchase = useGameStore((s) => s.attemptPurchase)
  const attemptSkipToll = useGameStore((s) => s.attemptSkipToll)
  const payToll = useGameStore((s) => s.payToll)
  const payTax = useGameStore((s) => s.payTax)
  const claimWelfare = useGameStore((s) => s.claimWelfare)
  const skipTile = useGameStore((s) => s.skipTile)
  const submitAnswer = useGameStore((s) => s.submitAnswer)
  const closeResult = useGameStore((s) => s.closeResult)
  const restart = useGameStore((s) => s.restart)
  const drawCard = useGameStore((s) => s.drawCard)
  const confirmCard = useGameStore((s) => s.confirmCard)
  const goToSpacePick = useGameStore((s) => s.goToSpacePick)
  const pickSpaceDestination = useGameStore((s) => s.pickSpaceDestination)
  const cancelSpacePick = useGameStore((s) => s.cancelSpacePick)
  const attemptIslandEscape = useGameStore((s) => s.attemptIslandEscape)
  const skipIslandTurn = useGameStore((s) => s.skipIslandTurn)
  const upgradeBuilding = useGameStore((s) => s.upgradeBuilding)
  const extraTurnReason = useGameStore((s) => s.extraTurnReason)
  const poolJustReset = useGameStore((s) => s.poolJustReset)
  const clearExtraTurnToast = useGameStore((s) => s.clearExtraTurnToast)
  const clearPoolResetToast = useGameStore((s) => s.clearPoolResetToast)
  const currentRound = useGameStore((s) => s.currentRound)
  const turnLimit = useGameStore((s) => s.turnLimit)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const persistError = useGameStore((s) => s.persistError)
  const clearPersistError = useGameStore((s) => s.clearPersistError)

  const { isLandscape } = useViewport()
  const [view, setView] = useState('menu')
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const lastAnnouncedTurn = useRef(-1)

  useEffect(() => {
    if (!extraTurnReason) return
    const t = setTimeout(clearExtraTurnToast, 1500)
    return () => clearTimeout(t)
  }, [extraTurnReason, clearExtraTurnToast])

  useEffect(() => {
    if (!poolJustReset) return
    const t = setTimeout(clearPoolResetToast, 2500)
    return () => clearTimeout(t)
  }, [poolJustReset, clearPoolResetToast])

  useEffect(() => {
    if (!persistError) return
    const t = setTimeout(clearPersistError, 4000)
    return () => clearTimeout(t)
  }, [persistError, clearPersistError])

  useEffect(() => {
    if (phase === 'setup' || phase === 'gameover') {
      lastAnnouncedTurn.current = -1
      setShowAnnouncement(false)
      return
    }
    if (lastAnnouncedTurn.current !== currentTurn) {
      lastAnnouncedTurn.current = currentTurn
      setShowAnnouncement(true)
      const t = setTimeout(() => setShowAnnouncement(false), 1500)
      return () => clearTimeout(t)
    }
  }, [currentTurn, phase])

  // 메뉴 라우팅
  if (phase === 'setup') {
    if (view === 'menu') {
      return (
        <MainMenu
          onNewGame={() => setView('setup')}
          onManageQuestions={() => setView('questions')}
          onResume={() => { resumeGame() }}
        />
      )
    }
    if (view === 'questions') {
      return (
        <Suspense fallback={<FullScreenSpinner label="문제 관리 페이지 불러오는 중…" />}>
          <QuestionManager onBack={() => setView('menu')} />
        </Suspense>
      )
    }
    return <GameSetup onStart={initGame} onBack={() => setView('menu')} />
  }

  if (phase === 'gameover') {
    return (
      <GameOverScreen
        players={players}
        ownership={ownership}
        onRestart={() => { restart(); setView('menu') }}
      />
    )
  }

  const current = players[currentTurn]
  const currentTile = current ? getTile(current.position) : null

  const handleTileAction = (action) => {
    if (action.type === 'attempt-purchase') return attemptPurchase(currentTile, action.buildLevel || 0)
    if (action.type === 'attempt-skip-toll') return attemptSkipToll(currentTile, action.toll)
    if (action.type === 'pay-toll') return payToll(currentTile, action.toll)
    if (action.type === 'pay-tax') return payTax(action.amount)
    if (action.type === 'claim-welfare') return claimWelfare()
    if (action.type === 'draw-card') return drawCard()
    if (action.type === 'space-pick') return goToSpacePick()
    if (action.type === 'upgrade') return upgradeBuilding(currentTile)
    if (action.type === 'skip') return skipTile()
  }

  const onIsland = phase === 'rolling' && current?.islandTurnsLeft > 0

  return (
    <div className="min-h-screen bg-amber-50 safe-padded">
      <MuteToggle />
      <TurnAnnouncement player={current} show={showAnnouncement} />
      <Toast show={!!extraTurnReason} color="bg-rose-500">
        {extraTurnReason === 'double' ? '🎲 더블! 한 번 더 굴리기' : '⚡ 카드 효과 — 한 번 더!'}
      </Toast>
      <Toast show={poolJustReset} color="bg-sky-500" position="bottom">
        🔁 문제 풀이 다시 시작됩니다 (모든 문제 출제 완료)
      </Toast>
      <Toast show={persistError} color="bg-rose-500" position="bottom">
        ⚠️ 자동 저장 실패 — 새로고침 시 진행 상황이 사라집니다
      </Toast>

      {phase === 'question' && currentQuestion && (
        <QuestionModal
          question={currentQuestion}
          intent={pendingAction?.type}
          player={current}
          onSubmit={submitAnswer}
        />
      )}

      <ResultBanner result={lastResult} onClose={closeResult} />

      {phase === 'golden-key' && currentCard && (
        <GoldenKeyModal card={currentCard} onConfirm={confirmCard} />
      )}

      {phase === 'space-pick' && (
        <SpaceTravelModal onPick={pickSpaceDestination} onCancel={cancelSpacePick} />
      )}

      <ConfirmDialog
        open={confirmEnd}
        title="게임 종료"
        description="지금 게임을 종료하면 현재 자산 기준으로 우승자를 가립니다."
        confirmLabel="종료"
        variant="danger"
        onConfirm={() => {
          setConfirmEnd(false)
          useGameStore.setState({ phase: 'gameover' })
        }}
        onCancel={() => setConfirmEnd(false)}
      />

      {/* 가로 모드: 보드(좌) + 사이드바(우) — 사이드바 폭은 화면 크기에 비례
          세로 모드: 보드(상) + 사이드바(하) */}
      <div
        className={`mx-auto p-2 sm:p-4 ${
          isLandscape
            ? 'flex flex-row gap-3 sm:gap-4 max-w-[120rem] items-start'
            : 'flex flex-col gap-3 sm:gap-4 max-w-3xl items-center'
        }`}
      >
        <div className={`flex flex-col items-center gap-3 ${isLandscape ? 'flex-1 min-w-0' : 'w-full'}`}>
          <Board
            players={players}
            ownership={ownership}
            currentPlayer={current}
            lastRoll={lastRoll}
            currentRound={currentRound}
            turnLimit={turnLimit}
            isLandscape={isLandscape}
          />

          <div className="bg-white/85 backdrop-blur rounded-2xl p-3 sm:p-4 shadow-md w-full max-w-2xl min-h-[140px] flex flex-col items-center justify-center gap-2">
            {phase === 'rolling' && !onIsland && (
              <DiceRoller lastRoll={lastRoll} onRoll={rollAndMove} disabled={showAnnouncement} />
            )}
            {phase === 'rolling' && onIsland && (
              <IslandPanel
                player={current}
                onEscapeAttempt={attemptIslandEscape}
                onSkipTurn={skipIslandTurn}
              />
            )}
            {phase === 'tile' && currentTile && (
              <TileActionPanel
                tile={currentTile}
                player={current}
                players={players}
                ownership={ownership}
                lastRoll={lastRoll}
                onAction={handleTileAction}
              />
            )}
            {phase === 'question' && <div className="text-amber-700 text-sm">문제에 답해 주세요…</div>}
            {phase === 'result' && <div className="text-amber-700 text-sm">결과 확인 중…</div>}
            {phase === 'golden-key' && <div className="text-amber-700 text-sm">카드 확인 중…</div>}
            {phase === 'space-pick' && <div className="text-amber-700 text-sm">목적지 선택 중…</div>}
          </div>
        </div>

        <aside
          className={`space-y-2 sm:space-y-3 ${
            isLandscape ? 'w-56 lg:w-64 xl:w-72 flex-shrink-0' : 'w-full max-w-2xl'
          }`}
        >
          {/* 라운드 카운터 — 진행률 바 포함 */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-baseline justify-between">
              <div className="text-xs text-amber-700 font-bold">라운드</div>
              <div className="text-base font-extrabold text-amber-900">
                {currentRound}
                {turnLimit && <span className="text-xs text-amber-700"> / {turnLimit}</span>}
              </div>
            </div>
            {turnLimit && (
              <div className="mt-1.5 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${Math.min(100, (currentRound / turnLimit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          <div
            className={`grid gap-2 sm:gap-3 content-start ${
              isLandscape ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            }`}
          >
            {players.map((p, i) => {
              const isOddLast = !isLandscape && i === players.length - 1 && players.length % 2 === 1
              return (
                <div key={p.id} className={isOddLast ? 'col-span-2 sm:col-span-1' : ''}>
                  <PlayerCard player={p} isCurrent={i === currentTurn} />
                </div>
              )
            })}
          </div>

          {welfarePool > 0 && (
            <div className="p-3 bg-pink-100 rounded-xl border-2 border-pink-300 text-center">
              <div className="text-xs text-pink-700 font-bold">사회복지 풀</div>
              <div className="text-base font-extrabold text-pink-800">
                💰 {welfarePool.toLocaleString()}원
              </div>
            </div>
          )}

          <button
            onClick={() => setConfirmEnd(true)}
            className="w-full py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
          >
            🏁 게임 종료
          </button>
        </aside>
      </div>
    </div>
  )
}
