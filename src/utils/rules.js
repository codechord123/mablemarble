// 게임성 규칙 모음 (순수 함수) — 라인 독점, 난이도 도전 보상, 콤보, 땅 팔기,
// 라운드 이벤트, 꼴찌 역전 월급. 스토어와 화면이 같은 계산을 쓰도록 여기 모은다.

import { BOARD, GROUP_OF, groupTiles, SALARY, TILE_TYPES } from './boardConfig.js'
import { calculateToll, nextUpgradeCost, totalPurchaseCost } from './gameEngine.js'

// ─── 라인 독점 ───
// 한 색 줄의 도시를 한 사람이 모두 가지면 그 줄 통행료가 2배.
export const MONOPOLY_MULTIPLIER = 2

export function hasMonopoly(ownership, tileId) {
  const group = GROUP_OF[tileId]
  const owner = ownership[tileId]
  if (!group || !owner) return false
  return groupTiles(group).every((id) => ownership[id]?.ownerId === owner.ownerId)
}

// 이 플레이어가 막 완성한 독점 줄 (구매 직후 연출용)
export function monopolyGroupOf(ownership, tileId) {
  return hasMonopoly(ownership, tileId) ? GROUP_OF[tileId] : null
}

// ─── 라운드 이벤트 ───
// 3라운드마다(4·7·10… 라운드 시작) 판 전체에 한 라운드짜리 사건이 터진다.
export const ROUND_EVENT_EVERY = 3

export const ROUND_EVENTS = {
  festival: { icon: '🎉', title: '축제 도시', desc: (e) => `${BOARD[e.tileId]?.name} 통행료 2배!` },
  recession: { icon: '📉', title: '불경기', desc: () => '이번 라운드 땅값·건설비 반값!' },
  boom: { icon: '📈', title: '경제 호황', desc: () => '이번 라운드 출발 월급 2배!' },
  charity: { icon: '🎁', title: '나눔의 날', desc: () => '모두 100원씩 받아요!' },
}
export const CHARITY_AMOUNT = 100

export function isRoundEventRound(round) {
  return round > 1 && (round - 1) % ROUND_EVENT_EVERY === 0
}

export function rollRoundEvent(round, rng = Math.random) {
  const kinds = Object.keys(ROUND_EVENTS)
  const kind = kinds[Math.floor(rng() * kinds.length)]
  const ev = { kind, round }
  if (kind === 'festival') {
    const cities = BOARD.filter((t) => t.type === TILE_TYPES.CITY || t.type === TILE_TYPES.LANDMARK)
    ev.tileId = cities[Math.floor(rng() * cities.length)].id
  }
  return ev
}

// 지금 라운드에 살아 있는 이벤트만 돌려준다
export function activeRoundEvent(roundEvent, currentRound) {
  return roundEvent && roundEvent.round === currentRound ? roundEvent : null
}

// ─── 통행료 ───
// 건물 단계 × 독점 × 축제를 모두 반영한 최종 통행료
export function tollFor(tile, ownership, roundEvent = null) {
  const owner = ownership[tile.id]
  if (!owner) return 0
  let toll = calculateToll(tile, owner.houses)
  if (hasMonopoly(ownership, tile.id)) toll *= MONOPOLY_MULTIPLIER
  if (roundEvent?.kind === 'festival' && roundEvent.tileId === tile.id) toll *= 2
  return Math.round(toll)
}

// ─── 난이도 도전 ───
// 문제 전에 난이도를 고른다. 어려울수록 보상이 크다.
export const DIFFICULTY_DISCOUNT = { 1: 0, 2: 0.1, 3: 0.25 } // 땅 사기·건물 짓기 할인
export const TOLL_CHALLENGE = {
  1: { label: '통행료 반값', waive: 0.5, bonus: 0 },
  2: { label: '통행료 면제', waive: 1, bonus: 0 },
  3: { label: '면제 + 보너스 100원', waive: 1, bonus: 100 },
}

function costFactor(roundEvent, difficulty) {
  const recession = roundEvent?.kind === 'recession' ? 0.5 : 1
  return recession * (1 - (DIFFICULTY_DISCOUNT[difficulty] || 0))
}

export function purchaseCost(tile, roundEvent = null, difficulty = 1) {
  return Math.round(totalPurchaseCost(tile, 0) * costFactor(roundEvent, difficulty))
}

export function upgradeCost(tile, level, roundEvent = null, difficulty = 1) {
  const base = nextUpgradeCost(tile, level)
  if (base == null) return null
  return Math.round(base * costFactor(roundEvent, difficulty))
}

// ─── 연속 정답 콤보 ───
// 3연속부터 정답마다 보너스. 틀리거나 시간이 지나면 끊긴다.
export function comboBonus(streak) {
  if (streak < 3) return 0
  if (streak === 3) return 100
  if (streak === 4) return 150
  return 200
}

// ─── 땅 팔기 ───
// 돈이 모자라면 도시를 지은 값(땅 + 건물)의 절반에 은행에 판다.
export const SELL_RATE = 0.5

export function sellValue(tile, level) {
  return Math.floor(totalPurchaseCost(tile, level) * SELL_RATE)
}

export function ownedTiles(ownership, playerId) {
  return Object.entries(ownership)
    .filter(([, v]) => v.ownerId === playerId)
    .map(([id, v]) => ({ tile: BOARD[Number(id)], level: v.houses }))
}

export function totalSellValue(ownership, playerId) {
  return ownedTiles(ownership, playerId).reduce((sum, { tile, level }) => sum + sellValue(tile, level), 0)
}

// ─── 꼴찌 역전 ───
// 총자산(현금 + 땅·건물 값)이 가장 적은 사람은 출발 월급을 1.5배로 받는다.
export const UNDERDOG_SALARY_RATE = 1.5

export function netWorth(player, ownership) {
  const assets = ownedTiles(ownership, player.id).reduce(
    (sum, { tile, level }) => sum + totalPurchaseCost(tile, level), 0)
  return player.money + assets
}

// 살아 있는 사람이 3명 이상일 때만 꼴찌 한 명을 고른다 (2명이면 꼴찌=2등이라 의미가 없다)
export function underdogId(players, ownership) {
  const alive = players.filter((p) => p.alive)
  if (alive.length < 3) return null
  let min = null
  for (const p of alive) {
    const w = netWorth(p, ownership)
    if (!min || w < min.w) min = { id: p.id, w }
  }
  // 동점 꼴찌가 여럿이면 아무도 주지 않는다
  const ties = alive.filter((p) => netWorth(p, ownership) === min.w)
  return ties.length === 1 ? min.id : null
}

export function salaryFor(player, players, ownership, roundEvent = null) {
  let pay = SALARY
  if (roundEvent?.kind === 'boom') pay *= 2
  if (underdogId(players, ownership) === player.id) pay *= UNDERDOG_SALARY_RATE
  return Math.round(pay)
}

// ─── 보관 카드 (황금열쇠) ───
export const ITEMS = {
  angel: { icon: '😇', name: '천사 카드', desc: '통행료 1번 면제' },
  half: { icon: '🎟️', name: '반값 쿠폰', desc: '통행료 1번 반값' },
  teleport: { icon: '🌀', name: '순간이동', desc: '내 차례에 원하는 칸으로' },
}
export const MAX_ITEMS = 3
