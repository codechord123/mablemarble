import { create } from 'zustand'
import { rollDice, applyMove, getTile } from '../utils/gameEngine.js'
import { START_MONEY, MAX_CONSECUTIVE_DOUBLES } from '../utils/boardConfig.js'

const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

export const useGameStore = create((set, get) => ({
  players: [],
  currentTurn: 0,
  phase: 'setup', // setup | rolling | tile | gameover
  lastRoll: null,
  ownership: {}, // { [tileId]: { ownerId, houses } }

  initGame(playerNames) {
    set({
      players: playerNames.map((name, i) => ({
        id: i,
        name,
        color: COLORS[i % COLORS.length],
        position: 0,
        money: START_MONEY,
        alive: true,
        consecutiveDoubles: 0,
      })),
      currentTurn: 0,
      phase: 'rolling',
      lastRoll: null,
      ownership: {},
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

  endTurn() {
    const { players, currentTurn, lastRoll } = get()
    const player = players[currentTurn]
    const updated = [...players]

    // 더블 주사위 → 한 번 더 (단, 누적 한도 미달 시)
    if (lastRoll?.isDouble && player.consecutiveDoubles + 1 < MAX_CONSECUTIVE_DOUBLES) {
      updated[currentTurn] = { ...player, consecutiveDoubles: player.consecutiveDoubles + 1 }
      set({ players: updated, phase: 'rolling', lastRoll: null })
      return
    }

    // 더블 카운트 리셋 후 다음 살아있는 플레이어로
    updated[currentTurn] = { ...player, consecutiveDoubles: 0 }
    let next = (currentTurn + 1) % players.length
    let safety = players.length
    while (!updated[next].alive && safety-- > 0) {
      next = (next + 1) % players.length
    }
    set({ players: updated, currentTurn: next, phase: 'rolling', lastRoll: null })
  },
}))
