import { create } from 'zustand'
import { rollDice, applyMove, getTile, calculateToll, nextUpgradeCost } from '../utils/gameEngine.js'
import { pickQuestion, isCorrect } from '../utils/questionPicker.js'
import { applyCardEffect } from '../utils/goldenKeyEngine.js'
import { drawGoldenKeyCard } from '../data/goldenKeyCards.js'
import {
  START_MONEY,
  MAX_CONSECUTIVE_DOUBLES,
  TILE_TYPES,
  ISLAND_TURNS,
} from '../utils/boardConfig.js'
import { useQuestionStore } from './questionStore.js'
import { sfx } from '../utils/sounds.js'

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
  welfarePool: 0,
  usedQuestions: [],
  currentQuestion: null,
  pendingAction: null,
  lastResult: null,
  currentCard: null,
}

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerNames) {
    set({
      ...initialState,
      players: playerNames.map((name, i) => ({
        id: i,
        name,
        color: COLORS[i % COLORS.length],
        position: 0,
        money: START_MONEY,
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
  attemptPurchase(tile) {
    get()._askQuestion({ type: 'purchase', tile })
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
    set({
      players: updated,
      ownership: { ...ownership, [tile.id]: { ...owner, houses: owner.houses + 1 } },
    })
    get()._resolveTurn()
  },

  // ─── 황금열쇠 ───
  drawCard() {
    sfx.card()
    set({ phase: 'golden-key', currentCard: drawGoldenKeyCard() })
  },

  confirmCard() {
    const card = get().currentCard
    if (!card) return
    const result = applyCardEffect(card, get())

    // 보너스 문제: 문제 모달로
    if (result.bonusQuestion) {
      const { usedQuestions } = get()
      const pool = useQuestionStore.getState().activeQuestions
      const q = pickQuestion(2, usedQuestions, pool)
      set({
        phase: 'question',
        currentQuestion: q,
        pendingAction: {
          type: 'bonus-question',
          winAmount: result.bonusQuestion.winAmount,
          loseAmount: result.bonusQuestion.loseAmount,
        },
        usedQuestions: [...usedQuestions, q.id],
        currentCard: null,
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
    const q = pickQuestion(2, usedQuestions, pool)
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction: { type: 'escape-island' },
      usedQuestions: [...usedQuestions, q.id],
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
    const q = pickQuestion(pendingAction.tile?.difficulty || 2, usedQuestions, pool)
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction,
      usedQuestions: [...usedQuestions, q.id],
    })
  },

  submitAnswer(answer) {
    const { currentQuestion, pendingAction, players, currentTurn, ownership } = get()
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
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - tile.price,
        }
        updatedOwnership = { ...ownership, [tile.id]: { ownerId: currentTurn, houses: 0 } }
        message = `${tile.name} 구매 성공! (-${tile.price.toLocaleString()}원)`
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
        const left = Math.max(0, (updatedPlayers[currentTurn].islandTurnsLeft || 0) - 1)
        updatedPlayers[currentTurn] = { ...updatedPlayers[currentTurn], islandTurnsLeft: left }
        message = left === 0 ? '탈출 실패… 하지만 갇힘 기간 종료!' : '탈출 실패…'
      }
    }

    set({
      players: updatedPlayers,
      ownership: updatedOwnership,
      phase: 'result',
      currentQuestion: null,
      pendingAction: null,
      lastResult: {
        correct,
        message,
        explanation: currentQuestion.explanation,
        question: currentQuestion,
        postAction,
      },
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

  // ─── 파산/승리 판정 ───
  _resolveTurn() {
    const { players, currentTurn, ownership } = get()
    let updated = [...players]
    let updatedOwnership = ownership

    if (updated[currentTurn].money < 0 && updated[currentTurn].alive) {
      sfx.bankrupt()
      updated[currentTurn] = { ...updated[currentTurn], alive: false }
      updatedOwnership = Object.fromEntries(
        Object.entries(ownership).filter(([, v]) => v.ownerId !== currentTurn),
      )
    }

    const aliveCount = updated.filter((p) => p.alive).length
    if (aliveCount <= 1) {
      sfx.victory()
      set({ players: updated, ownership: updatedOwnership, phase: 'gameover' })
      return
    }

    set({ players: updated, ownership: updatedOwnership })
    get().endTurn()
  },

  endTurn() {
    const { players, currentTurn, lastRoll } = get()
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
      set({ players: updated, phase: 'rolling', lastRoll: null })
      return
    }

    updated[currentTurn] = { ...player, consecutiveDoubles: 0, extraTurnGranted: false }
    let next = (currentTurn + 1) % players.length
    let safety = players.length
    while (!updated[next].alive && safety-- > 0) {
      next = (next + 1) % players.length
    }
    set({ players: updated, currentTurn: next, phase: 'rolling', lastRoll: null })
  },

  restart() {
    set({ ...initialState })
  },
}))

export { TILE_TYPES, calculateToll }
