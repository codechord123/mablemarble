// 순수 함수만 모은 게임 규칙 엔진. 스토어·UI와 분리하여 단위 테스트 용이.

import {
  BOARD,
  BOARD_SIZE,
  TILE_TYPES,
  SALARY,
  LANDMARK_TOLL_MULTIPLIER,
  TOLL_RATE,
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

export function calculateToll(tile, houses = 0) {
  if (!tile?.price) return 0
  const base = Math.round(tile.price * TOLL_RATE) * (1 + houses)
  return tile.type === TILE_TYPES.LANDMARK ? base * LANDMARK_TOLL_MULTIPLIER : base
}

export function canBuy(player, tile) {
  const purchasable = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  return purchasable && player.money >= tile.price
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
