// 순수 함수만 모은 게임 규칙 엔진. 스토어·UI와 분리하여 단위 테스트 용이.

import {
  BOARD,
  BOARD_SIZE,
  TILE_TYPES,
  SALARY,
  LANDMARK_TOLL_MULTIPLIER,
  TOLL_MULTIPLIERS,
  BUILDING_COSTS,
  MAX_BUILDING_LEVEL,
} from './boardConfig.js'

export function rollDice(rng = Math.random) {
  const d1 = Math.floor(rng() * 6) + 1
  const d2 = Math.floor(rng() * 6) + 1
  return { d1, d2, total: d1 + d2, isDouble: d1 === d2 }
}

export function nextPosition(from, steps) {
  const sum = from + steps
  return {
    to: ((sum % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE,
    passedStart: sum >= BOARD_SIZE,
  }
}

export function getTile(index) {
  return BOARD[index]
}

export function calculateToll(tile, level = 0) {
  if (!tile?.price) return 0
  const tier = Math.max(0, Math.min(level, MAX_BUILDING_LEVEL))
  const base = Math.round(tile.price * TOLL_MULTIPLIERS[tier])
  return tile.type === TILE_TYPES.LANDMARK
    ? Math.round(base * LANDMARK_TOLL_MULTIPLIER)
    : base
}

export function nextUpgradeCost(tile, currentLevel) {
  const next = currentLevel + 1
  if (next > MAX_BUILDING_LEVEL) return null
  return Math.round(tile.price * BUILDING_COSTS[next])
}

// 빈 도시 구매 시 즉시 level까지 짓는 총 비용 (땅값 + 각 단계 업그레이드 비용 합).
export function totalPurchaseCost(tile, level = 0) {
  if (!tile?.price) return 0
  let cost = tile.price
  for (let i = 1; i <= level; i++) {
    cost += Math.round(tile.price * BUILDING_COSTS[i])
  }
  return cost
}

export function applyMove(player, steps) {
  const { to, passedStart } = nextPosition(player.position, steps)
  return {
    ...player,
    position: to,
    money: player.money + (passedStart ? SALARY : 0),
  }
}

export function isBankrupt(player) {
  return player.money < 0
}
