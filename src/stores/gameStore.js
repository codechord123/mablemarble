import { create } from 'zustand'
import { rollDice, applyMove, getTile, calculateToll, nextUpgradeCost, totalPurchaseCost } from '../utils/gameEngine.js'
import { pickQuestion, isCorrect } from '../utils/questionPicker.js'
import { applyCardEffect } from '../utils/goldenKeyEngine.js'
import { drawGoldenKeyCard } from '../data/goldenKeyCards.js'
import {
  START_MONEY,
  MAX_CONSECUTIVE_DOUBLES,
  TILE_TYPES,
  ISLAND_TURNS,
  INITIAL_WELFARE_POOL,
  ISLAND_ESCAPE_FAIL_PENALTY,
} from '../utils/boardConfig.js'
import { GAME_MODES, DEFAULT_MODE } from '../data/gameModes.js'
import { useQuestionStore } from './questionStore.js'
import { sfx } from '../utils/sounds.js'
import { persistSnapshot, loadSnapshot, clearSnapshot, persistLastSetup } from '../utils/persistence.js'

const emptyStats = () => ({ answered: 0, correct: 0, byCategory: {} })

function recordAnswer(stats, category, correct) {
  const cat = category || '기타'
  const prev = stats.byCategory[cat] || { answered: 0, correct: 0 }
  return {
    answered: stats.answered + 1,
    correct: stats.correct + (correct ? 1 : 0),
    byCategory: {
      ...stats.byCategory,
      [cat]: { answered: prev.answered + 1, correct: prev.correct + (correct ? 1 : 0) },
    },
  }
}

const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

const initialState = {
  players: [],
  currentTurn: 0,
  phase: 'setup', // setup|rolling|tile|question|result|golden-key|space-pick|gameover
  lastRoll: null,
  ownership: {},
  welfarePool: INITIAL_WELFARE_POOL,  // G2: 시드 자금
  usedQuestions: [],
  currentQuestion: null,
  pendingAction: null,
  lastResult: null,
  currentCard: null,
  extraTurnReason: null,  // G3: 'double' | 'card' — 추가 턴 토스트용
  poolJustReset: false,   // G6: 문제 풀 리셋 알림
  currentRound: 1,        // 턴 제한용 라운드 카운터
  turnLimit: null,        // null = 무제한
  startMoney: START_MONEY,
  modeId: DEFAULT_MODE,
  recentCardIds: [],      // 황금열쇠 최근 3장 — 연속 중복 방지
  persistError: false,    // localStorage 저장 실패 토스트용
  hotelFirstBuilt: false, // T17: 첫 호텔 건설 안내 (한 게임에 한 번)
}

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerConfigs, modeId = DEFAULT_MODE) {
    // playerConfigs: 문자열 배열(이름만) 또는 {name, avatar} 객체 배열
    const normalized = playerConfigs.map((p) =>
      typeof p === 'string' ? { name: p, avatar: null } : p,
    )
    const mode = GAME_MODES[modeId] || GAME_MODES[DEFAULT_MODE]
    clearSnapshot()
    // T23: 마지막 설정 저장 — 같은 친구들로 다시 시작 기능
    persistLastSetup({ players: normalized, modeId: mode.id })
    set({
      ...initialState,
      modeId: mode.id,
      startMoney: mode.startMoney,
      turnLimit: mode.turnLimit,
      players: normalized.map((p, i) => ({
        id: i,
        name: p.name,
        avatar: p.avatar || '●',
        color: COLORS[i % COLORS.length],
        position: 0,
        money: mode.startMoney,
        alive: true,
        consecutiveDoubles: 0,
        islandTurnsLeft: 0,
        extraTurnGranted: false,
        stats: emptyStats(),
      })),
      phase: 'rolling',
    })
  },

  rollAndMove() {
    sfx.dice()
    const { players, currentTurn } = get()
    const roll = rollDice()
    let moved = applyMove(players[currentTurn], roll.total)
    if (getTile(moved.position).type === TILE_TYPES.ISLAND) {
      moved = { ...moved, islandTurnsLeft: ISLAND_TURNS }
    }
    const updated = [...players]
    updated[currentTurn] = moved
    set({ players: updated, lastRoll: roll, phase: 'tile' })
    return { roll, tile: getTile(moved.position) }
  },

  // ─── 칸 액션 진입점 ───
  attemptPurchase(tile, buildLevel = 0) {
    get()._askQuestion({ type: 'purchase', tile, buildLevel })
  },

  attemptSkipToll(tile, toll) {
    get()._askQuestion({ type: 'skip-toll', tile, toll })
  },

  payToll(tile, toll) {
    const { players, currentTurn, ownership } = get()
    const owner = ownership[tile.id]
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money - toll }
    updated[owner.ownerId] = { ...updated[owner.ownerId], money: updated[owner.ownerId].money + toll }
    set({ players: updated })
    get()._resolveTurn()
  },

  payTax(amount) {
    const { players, currentTurn, welfarePool } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money - amount }
    set({ players: updated, welfarePool: welfarePool + amount })
    get()._resolveTurn()
  },

  claimWelfare() {
    const { players, currentTurn, welfarePool } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money + welfarePool }
    set({ players: updated, welfarePool: 0 })
    get()._resolveTurn()
  },

  skipTile() {
    get()._resolveTurn()
  },

  // ─── 건물 업그레이드 ───
  upgradeBuilding(tile) {
    const { players, currentTurn, ownership } = get()
    const owner = ownership[tile.id]
    if (!owner || owner.ownerId !== currentTurn) return
    const cost = nextUpgradeCost(tile, owner.houses)
    if (cost == null) return
    if (players[currentTurn].money < cost) return

    const updated = [...players]
    updated[currentTurn] = {
      ...updated[currentTurn],
      money: updated[currentTurn].money - cost,
    }
    sfx.coin()
    const newLevel = owner.houses + 1
    set({
      players: updated,
      ownership: { ...ownership, [tile.id]: { ...owner, houses: newLevel } },
      hotelFirstBuilt: newLevel === 3 && !get().hotelFirstBuilt ? true : get().hotelFirstBuilt,
    })
    get()._resolveTurn()
  },

  clearHotelHint() {
    set({ hotelFirstBuilt: false })
  },

  // ─── 황금열쇠 ───
  drawCard() {
    sfx.card()
    const { recentCardIds } = get()
    const card = drawGoldenKeyCard(recentCardIds)
    const nextRecent = [...recentCardIds, card.id].slice(-3)
    set({ phase: 'golden-key', currentCard: card, recentCardIds: nextRecent })
  },

  confirmCard(success) {
    const card = get().currentCard
    if (!card) return

    // 미션 카드 — 사용자가 성공/포기를 직접 선언
    if (card.effect?.type === 'mission') {
      const { players, currentTurn } = get()
      const updated = [...players]
      const delta = success ? card.effect.winAmount : -card.effect.loseAmount
      updated[currentTurn] = {
        ...updated[currentTurn],
        money: updated[currentTurn].money + delta,
      }
      success ? sfx.correct() : sfx.wrong()
      set({
        players: updated,
        currentCard: null,
        phase: 'result',
        lastResult: {
          correct: !!success,
          message: success
            ? `${card.title}: 성공! +${card.effect.winAmount.toLocaleString()}원`
            : `${card.title}: 포기 -${card.effect.loseAmount.toLocaleString()}원`,
          explanation: card.description,
          postAction: 'end-turn',
        },
      })
      return
    }

    const result = applyCardEffect(card, get())

    // 보너스 문제: 문제 모달로
    if (result.bonusQuestion) {
      const { usedQuestions } = get()
      const pool = useQuestionStore.getState().activeQuestions
      const { question: q, poolReset } = pickQuestion(2, usedQuestions, pool)
      set({
        phase: 'question',
        currentQuestion: q,
        pendingAction: {
          type: 'bonus-question',
          winAmount: result.bonusQuestion.winAmount,
          loseAmount: result.bonusQuestion.loseAmount,
        },
        usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
        currentCard: null,
        poolJustReset: poolReset || get().poolJustReset,
      })
      return
    }

    // 추가 턴
    if (result.extraTurn) {
      const { players, currentTurn } = get()
      const updated = [...players]
      updated[currentTurn] = { ...updated[currentTurn], extraTurnGranted: true }
      set({
        players: updated,
        currentCard: null,
        phase: 'result',
        lastResult: {
          correct: true,
          message: `${card.title} — 한 번 더 굴립니다!`,
          explanation: card.description,
          postAction: 'roll-again',
        },
      })
      return
    }

    // 우주여행 카드 → 도시 선택 모달로
    if (result.triggerSpace) {
      set({
        players: result.players,
        currentCard: null,
        phase: 'space-pick',
      })
      return
    }

    // 머니/이동 카드 — 결과만 보여주고 endTurn
    set({
      players: result.players,
      currentCard: null,
      phase: 'result',
      lastResult: {
        correct: true,
        message: `${card.title}: ${result.message}`,
        explanation: card.description,
        postAction: 'end-turn',
      },
    })
  },

  // ─── 무인도 ───
  attemptIslandEscape() {
    const { usedQuestions } = get()
    const pool = useQuestionStore.getState().activeQuestions
    const { question: q, poolReset } = pickQuestion(2, usedQuestions, pool)
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction: { type: 'escape-island' },
      usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
      poolJustReset: poolReset || get().poolJustReset,
    })
  },

  skipIslandTurn() {
    const { players, currentTurn } = get()
    const updated = [...players]
    const left = Math.max(0, (updated[currentTurn].islandTurnsLeft || 0) - 1)
    updated[currentTurn] = { ...updated[currentTurn], islandTurnsLeft: left }
    set({ players: updated })
    get().endTurn()
  },

  // ─── 우주여행 ───
  goToSpacePick() {
    set({ phase: 'space-pick' })
  },

  pickSpaceDestination(tileId) {
    const { players, currentTurn } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], position: tileId }
    set({ players: updated, phase: 'tile' })
  },

  cancelSpacePick() {
    set({ phase: 'tile' })
  },

  // ─── 문제 흐름 ───
  _askQuestion(pendingAction) {
    const { usedQuestions } = get()
    const pool = useQuestionStore.getState().activeQuestions
    const { question: q, poolReset } = pickQuestion(
      pendingAction.tile?.difficulty || 2,
      usedQuestions,
      pool,
    )
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction,
      usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
      poolJustReset: poolReset || get().poolJustReset,
    })
  },

  submitAnswer(answer) {
    const { currentQuestion, pendingAction, players, currentTurn, ownership } = get()
    const isTimeout = answer === '__TIMEOUT__'
    const correct = isCorrect(currentQuestion, answer)
    correct ? sfx.correct() : sfx.wrong()
    let message = ''
    let postAction = 'end-turn'
    let updatedPlayers = [...players]
    let updatedOwnership = ownership

    // 통계 기록 (탈출/구매/통행료/보너스 모두 포함)
    updatedPlayers[currentTurn] = {
      ...updatedPlayers[currentTurn],
      stats: recordAnswer(
        updatedPlayers[currentTurn].stats || emptyStats(),
        currentQuestion.category,
        correct,
      ),
    }

    if (pendingAction.type === 'purchase') {
      if (correct) {
        const tile = pendingAction.tile
        const level = pendingAction.buildLevel || 0
        const cost = totalPurchaseCost(tile, level)
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - cost,
        }
        updatedOwnership = {
          ...ownership,
          [tile.id]: { ownerId: currentTurn, houses: level },
        }
        const buildLabel = level > 0 ? ` (콘도/아파트/호텔 단계 ${level})` : ''
        message = `${tile.name}${buildLabel} 구매 성공! (-${cost.toLocaleString()}원)`
      } else {
        message = '구매 실패 — 다음 기회에!'
      }
    } else if (pendingAction.type === 'skip-toll') {
      if (correct) {
        message = `통행료 ${pendingAction.toll.toLocaleString()}원 면제!`
      } else {
        const { tile, toll } = pendingAction
        const owner = ownership[tile.id]
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - toll,
        }
        updatedPlayers[owner.ownerId] = {
          ...updatedPlayers[owner.ownerId],
          money: updatedPlayers[owner.ownerId].money + toll,
        }
        message = `오답 — 통행료 ${toll.toLocaleString()}원 지불`
      }
    } else if (pendingAction.type === 'bonus-question') {
      const delta = correct ? pendingAction.winAmount : -pendingAction.loseAmount
      updatedPlayers[currentTurn] = {
        ...updatedPlayers[currentTurn],
        money: updatedPlayers[currentTurn].money + delta,
      }
      message = correct
        ? `+${pendingAction.winAmount.toLocaleString()}원 보너스!`
        : `-${pendingAction.loseAmount.toLocaleString()}원`
    } else if (pendingAction.type === 'escape-island') {
      if (correct) {
        updatedPlayers[currentTurn] = { ...updatedPlayers[currentTurn], islandTurnsLeft: 0 }
        message = '탈출 성공! 한 번 굴려보세요.'
        postAction = 'roll-again'
      } else {
        // G4: 탈출 실패 패널티 추가
        const left = Math.max(0, (updatedPlayers[currentTurn].islandTurnsLeft || 0) - 1)
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          islandTurnsLeft: left,
          money: updatedPlayers[currentTurn].money - ISLAND_ESCAPE_FAIL_PENALTY,
        }
        message = left === 0
          ? `탈출 실패 -${ISLAND_ESCAPE_FAIL_PENALTY}원… 그래도 갇힘 기간 종료!`
          : `탈출 실패 -${ISLAND_ESCAPE_FAIL_PENALTY}원… 다음에 다시!`
      }
    }

    // 시간 초과 시 메시지 앞에 명시 (학생 혼동 방지)
    const finalMessage = isTimeout ? `⏰ 시간 초과! ${message}` : message

    // T17: 정답 구매로 호텔(Lv3) 첫 건설 시 안내 플래그
    const builtHotel =
      pendingAction.type === 'purchase' &&
      correct &&
      (pendingAction.buildLevel || 0) === 3
    const hotelFirstBuilt = builtHotel && !get().hotelFirstBuilt
      ? true
      : get().hotelFirstBuilt

    set({
      players: updatedPlayers,
      ownership: updatedOwnership,
      phase: 'result',
      currentQuestion: null,
      pendingAction: null,
      lastResult: {
        correct,
        timeout: isTimeout,
        message: finalMessage,
        explanation: currentQuestion.explanation,
        question: currentQuestion,
        postAction,
      },
      hotelFirstBuilt,
    })
  },

  closeResult() {
    const post = get().lastResult?.postAction
    set({ lastResult: null })
    if (post === 'roll-again') {
      set({ phase: 'rolling', lastRoll: null })
      return
    }
    get()._resolveTurn()
  },

  // ─── 파산/승리 판정 — 전체 플레이어 스캔 ───
  _resolveTurn() {
    const { players, currentTurn, ownership } = get()
    let updated = [...players]
    let updatedOwnership = ownership
    let anyBankrupt = false

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].money < 0 && updated[i].alive) {
        updated[i] = { ...updated[i], alive: false }
        anyBankrupt = true
        // 해당 플레이어의 도시 일괄 해제
        updatedOwnership = Object.fromEntries(
          Object.entries(updatedOwnership).filter(([, v]) => v.ownerId !== i),
        )
      }
    }
    if (anyBankrupt) sfx.bankrupt()

    const aliveCount = updated.filter((p) => p.alive).length
    if (aliveCount <= 1) {
      sfx.victory()
      clearSnapshot()
      set({ players: updated, ownership: updatedOwnership, phase: 'gameover' })
      return
    }

    set({ players: updated, ownership: updatedOwnership })
    get().endTurn()
  },

  endTurn() {
    const { players, currentTurn, lastRoll, currentRound, turnLimit } = get()
    const player = players[currentTurn]
    const updated = [...players]

    const doubleAgain =
      lastRoll?.isDouble && player.consecutiveDoubles + 1 < MAX_CONSECUTIVE_DOUBLES
    const extra = player.extraTurnGranted

    if (player.alive && (doubleAgain || extra)) {
      updated[currentTurn] = {
        ...player,
        consecutiveDoubles: doubleAgain ? player.consecutiveDoubles + 1 : player.consecutiveDoubles,
        extraTurnGranted: false,
      }
      set({
        players: updated,
        phase: 'rolling',
        lastRoll: null,
        extraTurnReason: doubleAgain ? 'double' : 'card',
      })
      if (!persistSnapshot(get()) && !get().persistError) {
      set({ persistError: true })
    }
      return
    }

    updated[currentTurn] = { ...player, consecutiveDoubles: 0, extraTurnGranted: false }
    let next = (currentTurn + 1) % players.length
    let safety = players.length
    while (!updated[next].alive && safety-- > 0) {
      next = (next + 1) % players.length
    }

    // 라운드 wrap 감지 — next가 currentTurn보다 같거나 작으면 한 바퀴 돈 것
    const wrapped = next <= currentTurn
    const newRound = wrapped ? currentRound + 1 : currentRound

    // 턴 제한 도달 시 게임 종료
    if (turnLimit && newRound > turnLimit) {
      sfx.victory()
      clearSnapshot()
      set({
        players: updated,
        currentTurn: next,
        currentRound: newRound,
        phase: 'gameover',
        lastRoll: null,
        extraTurnReason: null,
      })
      return
    }

    set({
      players: updated,
      currentTurn: next,
      currentRound: newRound,
      phase: 'rolling',
      lastRoll: null,
      extraTurnReason: null,
    })
    if (!persistSnapshot(get()) && !get().persistError) {
      set({ persistError: true })
    }
  },

  clearExtraTurnToast() {
    set({ extraTurnReason: null })
  },

  clearPoolResetToast() {
    set({ poolJustReset: false })
  },

  clearPersistError() {
    set({ persistError: false })
  },

  // 이어하기 — localStorage에서 스냅샷 복구
  resumeGame() {
    const snap = loadSnapshot()
    if (!snap) return false
    set({
      ...initialState,
      players: snap.players,
      currentTurn: snap.currentTurn,
      ownership: snap.ownership || {},
      welfarePool: snap.welfarePool ?? INITIAL_WELFARE_POOL,
      usedQuestions: snap.usedQuestions || [],
      currentRound: snap.currentRound || 1,
      turnLimit: snap.turnLimit ?? null,
      startMoney: snap.startMoney ?? START_MONEY,
      modeId: snap.modeId || DEFAULT_MODE,
      phase: 'rolling',
    })
    return true
  },

  restart() {
    clearSnapshot()
    set({ ...initialState })
  },
}))

export { TILE_TYPES, calculateToll }
