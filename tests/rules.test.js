import { describe, it, expect } from 'vitest'
import { BOARD } from '../src/utils/boardConfig.js'
import { calculateToll } from '../src/utils/gameEngine.js'
import {
  hasMonopoly, tollFor, purchaseCost, upgradeCost, comboBonus, sellValue,
  totalSellValue, underdogId, salaryFor, isRoundEventRound, rollRoundEvent, activeRoundEvent,
} from '../src/utils/rules.js'

// 초록 줄(A) = 1,2,4,5
const own = (ids, ownerId, houses = 0) => Object.fromEntries(ids.map((id) => [id, { ownerId, houses }]))
const P = (id, money) => ({ id, money, alive: true })

describe('라인 독점', () => {
  it('한 줄을 모두 가져야 독점', () => {
    expect(hasMonopoly(own([1, 2, 4], 0), 1)).toBe(false)
    expect(hasMonopoly(own([1, 2, 4, 5], 0), 1)).toBe(true)
    expect(hasMonopoly({ ...own([1, 2, 4], 0), 5: { ownerId: 1, houses: 0 } }, 1)).toBe(false)
  })
  it('독점이면 통행료 2배, 축제 도시면 또 2배', () => {
    const o = own([1, 2, 4, 5], 0)
    const base = calculateToll(BOARD[1], 0)
    expect(tollFor(BOARD[1], o)).toBe(base * 2)
    expect(tollFor(BOARD[1], o, { kind: 'festival', tileId: 1 })).toBe(base * 4)
    expect(tollFor(BOARD[2], own([2], 0))).toBe(calculateToll(BOARD[2], 0))
  })
})

describe('난이도 할인·불경기', () => {
  it('★★ 10%, ★★★ 25% 할인', () => {
    const t = BOARD[1] // 100원
    expect(purchaseCost(t, null, 1)).toBe(100)
    expect(purchaseCost(t, null, 2)).toBe(90)
    expect(purchaseCost(t, null, 3)).toBe(75)
  })
  it('불경기면 반값에 할인이 더해진다', () => {
    expect(purchaseCost(BOARD[1], { kind: 'recession' }, 3)).toBe(38)
  })
  it('호텔 다음 단계는 없다', () => {
    expect(upgradeCost(BOARD[1], 3)).toBeNull()
  })
})

describe('콤보', () => {
  it('3연속부터 보너스', () => {
    expect([1, 2, 3, 4, 5, 8].map(comboBonus)).toEqual([0, 0, 100, 150, 200, 200])
  })
})

describe('땅 팔기', () => {
  it('지은 값의 절반', () => {
    expect(sellValue(BOARD[1], 0)).toBe(50)
    expect(totalSellValue(own([1, 2], 0), 0)).toBe(50 + 60)
  })
})

describe('꼴찌 역전 월급', () => {
  it('3명 이상일 때 총자산 꼴찌 한 명만 1.5배', () => {
    const players = [P(0, 1000), P(1, 300), P(2, 800)]
    expect(underdogId(players, {})).toBe(1)
    expect(salaryFor(players[1], players, {})).toBe(300)
    expect(salaryFor(players[0], players, {})).toBe(200)
  })
  it('2명이면 없음, 동점 꼴찌도 없음', () => {
    expect(underdogId([P(0, 1), P(1, 9)], {})).toBeNull()
    expect(underdogId([P(0, 5), P(1, 5), P(2, 9)], {})).toBeNull()
  })
  it('땅 값도 자산으로 센다', () => {
    const players = [P(0, 100), P(1, 150), P(2, 900)]
    expect(underdogId(players, own([22], 0))).toBe(1) // 로마 400원어치 땅
  })
  it('호황이면 2배', () => {
    const players = [P(0, 1000), P(1, 1000)]
    expect(salaryFor(players[0], players, {}, { kind: 'boom' })).toBe(400)
  })
})

describe('라운드 이벤트', () => {
  it('4·7·10 라운드에 터진다', () => {
    expect([1, 2, 3, 4, 5, 7, 10].map(isRoundEventRound)).toEqual([false, false, false, true, false, true, true])
  })
  it('그 라운드에만 유효', () => {
    const ev = rollRoundEvent(4, () => 0)
    expect(activeRoundEvent(ev, 4)).toBe(ev)
    expect(activeRoundEvent(ev, 5)).toBeNull()
  })
  it('축제는 도시를 하나 고른다', () => {
    const ev = rollRoundEvent(4, () => 0) // 첫 종류 = festival
    expect(ev.kind).toBe('festival')
    expect(BOARD[ev.tileId].price).toBeGreaterThan(0)
  })
})

describe('통행료 문제 (남의 땅)', async () => {
  const { useGameStore } = await import('../src/stores/gameStore.js')
  const { useQuestionStore } = await import('../src/stores/questionStore.js')
  const q = { id: 'tq1', type: 'multiple_choice', difficulty: 2, question: '?', choices: ['a', 'b'], answer: 0, category: '시험' }
  it('통행료를 내면 바로 문제가 나오고, 맞히면 보너스 · 틀려도 더 잃지 않는다', () => {
    useQuestionStore.setState({ activeQuestions: [q] })
    const g = useGameStore.getState()
    g.initGame([{ name: 'A' }, { name: 'B' }])
    const tile = { id: 5, name: '도시' }
    useGameStore.setState({ ownership: { 5: { ownerId: 1, houses: 0 } }, currentTurn: 0 })
    const before = useGameStore.getState().players.map((p) => p.money)
    useGameStore.getState().payToll(tile, 100)
    let s = useGameStore.getState()
    expect(s.phase).toBe('question')
    expect(s.pendingAction.type).toBe('toll-quiz')
    expect(s.players[0].money).toBe(before[0] - 100)
    expect(s.players[1].money).toBe(before[1] + 100)
    s.submitAnswer(0) // 정답
    s = useGameStore.getState()
    expect(s.players[0].money).toBe(before[0] - 100 + 50)
    // 오답
    useGameStore.setState({ currentTurn: 0, phase: 'tile' })
    const m = useGameStore.getState().players[0].money
    useGameStore.getState().payToll(tile, 100)
    useGameStore.getState().submitAnswer(1)
    expect(useGameStore.getState().players[0].money).toBe(m - 100)
  })
  it('천사 카드로 통행료를 면제받아도 문제는 푼다', () => {
    useQuestionStore.setState({ activeQuestions: [q] })
    useGameStore.getState().initGame([{ name: 'A' }, { name: 'B' }])
    useGameStore.setState((st) => ({ ownership: { 5: { ownerId: 1, houses: 0 } }, currentTurn: 0, players: st.players.map((p, i) => (i === 0 ? { ...p, items: ['angel'] } : p)) }))
    useGameStore.getState().useAngelCard({ id: 5, name: '도시' }, 100)
    expect(useGameStore.getState().pendingAction.type).toBe('toll-quiz')
  })
})
