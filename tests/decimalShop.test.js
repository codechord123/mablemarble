import { describe, it, expect } from 'vitest'
import {
  LESSONS, PRODUCTS, START_PRODUCTS, shelfFor, todaysPrices, makeCustomer, dayRules, tipFor, settle, addD, subD, gte,
  emptyShop, QUESTS, reputationOf, titleOf,
} from '../src/utils/decimalShop.js'
import { D, show, mul, parse, norm } from '../src/utils/decimalGame.js'

const ALL = PRODUCTS.map((p) => p.id)

describe('손님 주문 — 차시 모양', () => {
  for (const l of LESSONS) {
    it(`${l.lesson} ${l.name}`, () => {
      for (const owned of [START_PRODUCTS, ALL]) {
        const shelf = shelfFor(l, owned)
        expect(shelf.length).toBeGreaterThan(0)
        const prices = todaysPrices(l.type, shelf.map((p) => p.id))
        for (let i = 0; i < 200; i++) {
          const c = makeCustomer(l, shelf, prices)
          expect(show(norm(mul(c.a, c.b)))).toBe(show(c.answer))
          expect(c.tag).toBe(`1${c.unit}에 ${c.price}G`)
          expect(c.say).toContain(c.qty)
          const pa = c.a.p
          const pb = c.b.p
          const t = c.type
          if (t === 'dn1') expect([pa, pb]).toEqual([1, 0])
          if (t === 'dn2') expect([pa, pb]).toEqual([2, 0])
          if (t === 'nd1') expect([pa, pb]).toEqual([0, 1])
          if (t === 'nd2') expect([pa, pb]).toEqual([0, 2])
          if (t === 'dd1') expect([pa, pb]).toEqual([1, 1])
          if (t === 'dd2') expect([pa, pb]).toEqual([2, 1])
          if (t === 'shift') expect(['10', '100', '0.1', '0.01']).toContain(show(c.b))
          // 같은 날 같은 상품은 같은 가격 (섞어서·소수점 위치 차시 빼고)
          if (!['mix', 'shift'].includes(l.type)) expect(show(c.a)).toBe(show(prices[c.product]))
          // 개수로 파는 상품은 자연수 개수
          const pr = PRODUCTS.find((p) => p.id === c.product)
          if (pr.kind === 'count') expect(c.b.p).toBe(0)
          expect(c.answer.p).toBeLessThanOrEqual(4)
        }
      }
    })
  }
})

describe('돈·정산', () => {
  it('소수 덧셈·뺄셈이 정확하다', () => {
    expect(show(addD(D(1, 1), D(2, 1)))).toBe('0.3')
    expect(show(subD(D(5), D(125, 2)))).toBe('3.75')
    expect(show(subD(D(1), D(25, 1)))).toBe('-1.5')
    expect(gte(D(3), D(299, 2))).toBe(true)
    expect(gte(D(299, 2), D(3))).toBe(false)
  })
  it('정산: 매출 + 팁 − 매출×0.5 − 임대료', () => {
    const r = settle({ sales: D(1237, 1), tips: D(9), rent: D(5) })
    expect(show(r.material)).toBe('61.85')
    expect(show(r.profit)).toBe('65.85')
  })
  it('팁: 한 번에 맞히고 기분 좋을수록, VIP·매니저면 더', () => {
    const base = { firstTry: true, mood: 'happy', vip: false, streak: 1, staff: 0 }
    expect(tipFor(base)).toBe(2)
    expect(tipFor({ ...base, firstTry: false })).toBe(0)
    expect(tipFor({ ...base, vip: true })).toBe(7)
    expect(tipFor({ ...base, streak: 6, staff: 2 })).toBe(2 + 2 + 1)
  })
})

describe('가게 규칙', () => {
  it('느긋 모드는 손님이 두 배 오래 기다린다', () => {
    const s = emptyShop()
    const l = LESSONS[0]
    expect(dayRules(l, s, true).patience).toBeCloseTo(dayRules(l, s, false).patience * 2)
    expect(dayRules(l, { ...s, staff: 1 }, false).patience).toBeCloseTo(dayRules(l, s, false).patience * 1.5)
    expect(dayRules(l, { ...s, ads: 2 }, false).perDay).toBe(dayRules(l, s, false).perDay + 4)
  })
  it('처음 가게: 목표는 아무것도 안 됐고 평판 ★1', () => {
    const s = emptyShop()
    expect(QUESTS.filter((q) => q.done(s))).toHaveLength(0)
    expect(reputationOf(s)).toBe(1)
    expect(titleOf(s.totalSales)).toBe('꼬마 사장')
    expect(parse(show(s.money))).toEqual(D(20))
  })
})
