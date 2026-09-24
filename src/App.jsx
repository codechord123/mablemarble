import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useGameStore } from './stores/gameStore.js'
import { getTile } from './utils/gameEngine.js'
import useViewport from './hooks/useViewport.js'
import Board from './components/board/Board.jsx'
import PlayerCard from './components/game/PlayerCard.jsx'
import DiceRoller from './components/game/DiceRoller.jsx'
import TurnAnnouncement from './components/game/TurnAnnouncement.jsx'
import BigEvent from './components/game/BigEvent.jsx'
import { duckMusic } from './utils/bgm.js'
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
import CoinIcon from './components/ui/CoinIcon.jsx'
import Toast from './components/ui/Toast.jsx'
import ConfirmDialog from './components/ui/ConfirmDialog.jsx'
import { loadLastSetup } from './utils/persistence.js'

const QuestionManager = lazy(() => import('./components/questions/QuestionManager.jsx'))

function FullScreenSpinner({ label = '불러오는 중…' }) {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center">
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
  const attemptUpgrade = useGameStore((s) => s.attemptUpgrade)
  const salaryReceived = useGameStore((s) => s.salaryReceived)
  const clearSalaryToast = useGameStore((s) => s.clearSalaryToast)
  const extraTurnReason = useGameStore((s) => s.extraTurnReason)
  const poolJustReset = useGameStore((s) => s.poolJustReset)
  const clearExtraTurnToast = useGameStore((s) => s.clearExtraTurnToast)
  const clearPoolResetToast = useGameStore((s) => s.clearPoolResetToast)
  const currentRound = useGameStore((s) => s.currentRound)
  const turnLimit = useGameStore((s) => s.turnLimit)
  const resumeGame = useGameStore((s) => s.resumeGame)
  const persistError = useGameStore((s) => s.persistError)
  const clearPersistError = useGameStore((s) => s.clearPersistError)
  const hotelFirstBuilt = useGameStore((s) => s.hotelFirstBuilt)
  const clearHotelHint = useGameStore((s) => s.clearHotelHint)

  const { isLandscape } = useViewport()
  const [view, setView] = useState('menu')
  const bigEvent = useGameStore((s) => s.bigEvent)
  const clearBigEvent = useGameStore((s) => s.clearBigEvent)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [showBoardHint, setShowBoardHint] = useState(false)
  // 말이 목적지에 실제로 도착했는지. 도착 전에 '살까요?'를 물으면
  // 결과가 말보다 먼저 와서 움직임이 가짜처럼 보인다.
  const [moveSettled, setMoveSettled] = useState(true)
  const lastAnnouncedTurn = useRef(-1)

  useEffect(() => {
    if (!extraTurnReason) return
    const t = setTimeout(clearExtraTurnToast, 1500)
    return () => clearTimeout(t)
  }, [extraTurnReason, clearExtraTurnToast])

  useEffect(() => {
    if (!salaryReceived) return
    const t = setTimeout(clearSalaryToast, 2200)
    return () => clearTimeout(t)
  }, [salaryReceived, clearSalaryToast])

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

  // T17: 첫 호텔 건설 안내 (게임당 1회)
  useEffect(() => {
    if (!hotelFirstBuilt) return
    const t = setTimeout(clearHotelHint, 4000)
    return () => clearTimeout(t)
  }, [hotelFirstBuilt, clearHotelHint])

  useEffect(() => {
    if (phase === 'setup' || phase === 'gameover') {
      lastAnnouncedTurn.current = -1
      setShowAnnouncement(false)
      return
    }
    // 통행료·파산 연출이 도는 중이면 끝난 뒤에 알린다 — 두 연출이 겹치지 않게
    if (bigEvent) return
    if (lastAnnouncedTurn.current !== currentTurn) {
      lastAnnouncedTurn.current = currentTurn
      setShowAnnouncement(true)
      const t = setTimeout(() => setShowAnnouncement(false), 1000) // T2: 1.5s → 1.0s
      return () => clearTimeout(t)
    }
  }, [currentTurn, phase, bigEvent])

  // T10: 첫 게임에서 보드 클릭 안내 (한 번만)
  useEffect(() => {
    if (phase !== 'rolling') return
    if (currentRound !== 1) return
    if (currentTurn !== 0) return
    try {
      if (localStorage.getItem('boomarble_seen_board_hint')) return
      setShowBoardHint(true)
      localStorage.setItem('boomarble_seen_board_hint', '1')
      const t = setTimeout(() => setShowBoardHint(false), 5000)
      return () => clearTimeout(t)
    } catch { /* ignore */ }
  }, [phase, currentRound, currentTurn])

  useEffect(() => {
    if (phase !== 'tile') {
      setMoveSettled(true)
      return
    }
    setMoveSettled(false)
    // 말의 착지 콜백이 정확한 시점을 알려 주지만, 제자리 이동 등으로 콜백이
    // 오지 않는 경우를 대비해 이동 거리 기준 상한을 둔다. 판이 멈추면 안 된다.
    const steps = Math.min(lastRoll?.total ?? 0, 20)
    const cap = Math.max(500, steps * 180) + 400
    const t = setTimeout(() => setMoveSettled(true), cap)
    return () => clearTimeout(t)
  }, [phase, currentTurn, lastRoll])

  // 문제를 푸는 동안에는 배경음악을 작게 줄인다
  useEffect(() => {
    duckMusic(phase === 'question')
  }, [phase])

  // 설정 화면은 세로로 길어서 '게임 시작!'을 누르려면 아래로 스크롤해야 한다.
  // 그 스크롤 위치가 그대로 남아 게임에 들어오면 보드 윗줄(출발 칸 — 시작 시
  // 말 전원이 모여 있는 곳)이 화면 위로 잘린다. 진입 시 맨 위로 되돌린다.
  useEffect(() => {
    if (phase === 'setup' || phase === 'gameover') return
    window.scrollTo({ top: 0, behavior: 'auto' })
    // 게임에 들어올 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === 'setup'])

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
    const lastSetup = loadLastSetup()
    const handleRematch = lastSetup
      ? () => initGame(lastSetup.players, lastSetup.modeId)
      : null
    return (
      <GameOverScreen
        players={players}
        ownership={ownership}
        onRestart={() => { restart(); setView('menu') }}
        onRematch={handleRematch}
      />
    )
  }

  const current = players[currentTurn]
  const currentTile = current ? getTile(current.position) : null

  const handleTileAction = (action) => {
    if (action.type === 'attempt-purchase') return attemptPurchase(currentTile)
    if (action.type === 'attempt-skip-toll') return attemptSkipToll(currentTile, action.toll)
    if (action.type === 'pay-toll') return payToll(currentTile, action.toll)
    if (action.type === 'pay-tax') return payTax(action.amount)
    if (action.type === 'claim-welfare') return claimWelfare()
    if (action.type === 'draw-card') return drawCard()
    if (action.type === 'space-pick') return goToSpacePick()
    if (action.type === 'upgrade') return attemptUpgrade(currentTile)
    if (action.type === 'skip') return skipTile()
  }

  const onIsland = phase === 'rolling' && current?.islandTurnsLeft > 0

  return (
    <div className="min-h-screen game-bg safe-padded">
      <MuteToggle />
      <TurnAnnouncement player={current} show={showAnnouncement} />
      <BigEvent event={bigEvent} onDone={clearBigEvent} />
      <Toast show={!!extraTurnReason} color="bg-rose-500">
        {extraTurnReason === 'double' ? '🎲 더블! 한 번 더 굴리기' : '⚡ 카드 효과 — 한 번 더!'}
      </Toast>
      <Toast show={salaryReceived > 0} color="bg-emerald-600">
        🏁 출발 통과! +{salaryReceived.toLocaleString()}원 월급
      </Toast>
      <Toast show={poolJustReset} color="bg-sky-500" position="bottom">
        🔁 문제 풀이 다시 시작됩니다 (모든 문제 출제 완료)
      </Toast>
      <Toast show={persistError} color="bg-rose-500" position="bottom">
        ⚠️ 자동 저장 실패 — 새로고침 시 진행 상황이 사라집니다
      </Toast>
      <Toast show={hotelFirstBuilt} color="bg-rose-600" position="bottom">
        🏨 첫 호텔 완성! 호텔 도시는 통행료가 가장 비싸요
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

      {/* 액션 패널 콘텐츠 (보드 옆 또는 아래에 렌더) */}
      {(() => {
        const actionContent = (
          <>
            {phase === 'rolling' && !onIsland && (
              <DiceRoller lastRoll={lastRoll} onRoll={rollAndMove} disabled={showAnnouncement || !!bigEvent} />
            )}
            {phase === 'rolling' && onIsland && (
              <IslandPanel
                player={current}
                onEscapeAttempt={attemptIslandEscape}
                onSkipTurn={skipIslandTurn}
              />
            )}
            {phase === 'tile' && currentTile && (
              moveSettled ? (
                <TileActionPanel
                  tile={currentTile}
                  player={current}
                  players={players}
                  ownership={ownership}
                  lastRoll={lastRoll}
                  onAction={handleTileAction}
                />
              ) : (
                // 말이 가는 동안은 주사위 결과만. 도착하면 선택지가 뜬다.
                <div className="t-display text-amber-900 tabular-nums">
                  {lastRoll ? `${lastRoll.d1} + ${lastRoll.d2} = ${lastRoll.total}` : ''}
                </div>
              )
            )}
            {phase === 'question' && <div className="text-amber-700 text-sm">문제에 답해 주세요…</div>}
            {phase === 'result' && <div className="text-amber-700 text-sm">결과 확인 중…</div>}
            {phase === 'golden-key' && <div className="text-amber-700 text-sm">카드 확인 중…</div>}
            {phase === 'space-pick' && <div className="text-amber-700 text-sm">목적지 선택 중…</div>}
          </>
        )


        const sidebarInfo = (
          <>
            {/* 떠 있는 토스트였을 때는 '사회복지 풀' 금액을 336x48px 덮었다 */}
            {showBoardHint && (
              <div className="surface-quiet px-3 py-2 t-body text-amber-800 text-center">
                💡 보드의 칸을 탭하면 통행료와 정보를 볼 수 있어요
              </div>
            )}

            <div
              className={`grid gap-2 sm:gap-3 content-start ${
                isLandscape
                  ? 'grid-cols-1'
                  : players.length >= 4
                    ? 'grid-cols-2 sm:grid-cols-5'
                    : 'grid-cols-2 sm:grid-cols-3'
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
              <div className="surface-quiet px-3 py-2.5 flex items-baseline justify-between">
                <div className="t-label">사회복지 풀</div>
                <div className="t-title text-amber-900 flex items-center gap-1">
                  <CoinIcon size={15} /> {welfarePool.toLocaleString()}원
                </div>
              </div>
            )}

            <button
              onClick={() => setConfirmEnd(true)}
              className="w-full py-2 t-body font-semibold text-white/85 bg-sky-950/15 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition"
            >
              게임 종료
            </button>
          </>
        )

        const makeBoard = (centerStage) => (
          <Board
            players={players}
            ownership={ownership}
            currentPlayer={current}
            lastRoll={lastRoll}
            currentRound={currentRound}
            turnLimit={turnLimit}
            isLandscape={isLandscape}
            centerStage={centerStage}
            onTokenLanded={() => setMoveSettled(true)}
          />
        )

        if (isLandscape) {
          // 가로: 보드(좌) | 액션+사이드(우) — 액션 패널이 위에 고정, 나머지는 스크롤
          return (
            <div className="flex flex-row gap-3 sm:gap-4 mx-auto p-2 sm:p-3 max-w-[120rem] items-start">
              <div className="flex-1 min-w-0 flex flex-col items-center">
                {makeBoard(actionContent)}
              </div>
              <aside
                className="w-72 lg:w-80 xl:w-96 flex-shrink-0 flex flex-col gap-2 sm:gap-3"
                style={{ maxHeight: 'calc(100vh - 1rem)' }}
              >
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 sm:space-y-3 min-h-0">
                  {sidebarInfo}
                </div>
              </aside>
            </div>
          )
        }

        // 세로: 주사위·액션이 보드 중앙 무대 안으로 들어간다.
        // 별도 액션 패널이 사라져 보드가 커지고, 굴리기→말 이동을 한자리에서 본다.
        return (
          <div className="flex flex-col gap-3 sm:gap-4 mx-auto p-2 sm:p-4 pb-32 max-w-3xl items-center">
            {makeBoard(actionContent)}
            <aside className="w-full max-w-2xl space-y-2 sm:space-y-3">
              {sidebarInfo}
            </aside>
          </div>
        )
      })()}
    </div>
  )
}
