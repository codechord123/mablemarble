import { describe, it, expect } from 'vitest'
import {
  rollDice,
  nextPosition,
  calculateToll,
  applyMove,
} from '../src/utils/gameEngine.js'
import { BOARD_SIZE, SALARY, TILE_TYPES } from '../src/utils/boardConfig.js'

describe('rollDice', () => {
  it('주사위는 1..6 범위, 더블 판정이 정확하다', () => {
    const r = rollDice(() => 0) // 항상 0 → d1=d2=1
    expect(r).toEqual({ d1: 1, d2: 1, total: 2, isDouble: true })
  })
})

describe('nextPosition', () => {
  it('보드를 한 바퀴 돌면 passedStart=true', () => {
    const { to, passedStart } = nextPosition(BOARD_SIZE - 2, 5)
    expect(to).toBe(3)
    expect(passedStart).toBe(true)
  })
  it('한 바퀴 미만 이동은 passedStart=false', () => {
    expect(nextPosition(0, 3)).toEqual({ to: 3, passedStart: false })
  })
})

describe('applyMove', () => {
  it('출발 통과 시 SALARY 지급', () => {
    const p = { position: BOARD_SIZE - 1, money: 1000 }
    const next = applyMove(p, 2)
    expect(next.position).toBe(1)
    expect(next.money).toBe(1000 + SALARY)
  })
})

describe('calculateToll', () => {
  it('레벨 0 도시 — 가격의 20% 통행료', () => {
    const tile = { type: TILE_TYPES.CITY, price: 200 }
    expect(calculateToll(tile, 0)).toBe(40)
  })
  it('레벨 3 호텔 — 가격의 200% 통행료', () => {
    const tile = { type: TILE_TYPES.CITY, price: 200 }
    expect(calculateToll(tile, 3)).toBe(400)
  })
  it('랜드마크는 추가 1.5배 통행료 (땅 + 1.5)', () => {
    const tile = { type: TILE_TYPES.LANDMARK, price: 300 }
    expect(calculateToll(tile, 0)).toBe(90) // 60 * 1.5
  })
})
