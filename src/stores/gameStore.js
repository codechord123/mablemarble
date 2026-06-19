import { create } from 'zustand'
import { rollDice, applyMove, getTile, calculateToll } from '../utils/gameEngine.js'
import { pickQuestion, isCorrect } from '../utils/questionPicker.js'
import { START_MONEY, MAX_CONSECUTIVE_DOUBLES, TILE_TYPES } from '../utils/boardConfig.js'
import { useQuestionStore } from './questionStore.js'

const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

const initialState = {
  players: [],
  currentTurn: 0,
  phase: 'setup', // setup | rolling | tile | question | result | gameover
  lastRoll: null,
  ownership: {}, // { [tileId]: { ownerId, houses } }
  welfarePool: 0,
  usedQuestions: [],
  currentQuestion: null,
  pendingAction: null, // { type: 'purchase' | 'skip-toll', tile, toll? }
  lastResult: null, // { correct, message, explanation, question }
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
      })),
      phase: 'rolling',
    })
  },

  rollAndMove() {
    const { players, currentTurn } = get()
    const roll = rollDice()
    const moved = applyMove(players[currentTurn], roll.total)
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

  // ─── 문제 흐름 ───
  _askQuestion(pendingAction) {
    const { usedQuestions } = get()
    const pool = useQuestionStore.getState().activeQuestions
    const q = pickQuestion(pendingAction.tile.difficulty || 1, usedQuestions, pool)
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
    let message = ''
    let updatedPlayers = [...players]
    let updatedOwnership = ownership

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
      },
    })
  },

  closeResult() {
    set({ lastResult: null })
    get()._resolveTurn()
  },

  // ─── 파산/승리 판정 후 턴 마감 ───
  _resolveTurn() {
    const { players, currentTurn, ownership } = get()
    let updated = [...players]
    let updatedOwnership = ownership

    // 현재 플레이어 파산 처리
    if (updated[currentTurn].money < 0 && updated[currentTurn].alive) {
      updated[currentTurn] = { ...updated[currentTurn], alive: false }
      // 보유 도시 해제
      updatedOwnership = Object.fromEntries(
        Object.entries(ownership).filter(([, v]) => v.ownerId !== currentTurn),
      )
    }

    const aliveCount = updated.filter((p) => p.alive).length
    if (aliveCount <= 1) {
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

    // 더블 → 한 번 더 (단, 누적 한도 미달 시)
    if (
      player.alive &&
      lastRoll?.isDouble &&
      player.consecutiveDoubles + 1 < MAX_CONSECUTIVE_DOUBLES
    ) {
      updated[currentTurn] = { ...player, consecutiveDoubles: player.consecutiveDoubles + 1 }
      set({ players: updated, phase: 'rolling', lastRoll: null })
      return
    }

    updated[currentTurn] = { ...player, consecutiveDoubles: 0 }
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

// Phase 3에서 활용할 수 있도록 외부에 노출
export { TILE_TYPES, calculateToll }
