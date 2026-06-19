import { create } from 'zustand'
import { rollDice, applyMove, getTile } from '../utils/gameEngine.js'
import { START_MONEY } from '../utils/boardConfig.js'

const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

export const useGameStore = create((set, get) => ({
  players: [],
  currentTurn: 0,
  phase: 'setup', // setup | rolling | moving | tile | question | gameover
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
    const { players, currentTurn } = get()
    let next = (currentTurn + 1) % players.length
    let safety = players.length
    while (!players[next].alive && safety-- > 0) {
      next = (next + 1) % players.length
    }
    set({ currentTurn: next, phase: 'rolling', lastRoll: null })
  },
}))
