import { describe, it, expect } from 'vitest'
import {
  LESSONS, SHOPS, MAP, ROWS, COLS, ENTRANCES, isRoad, roadSide, frontRoad, roadPath, unlocked,
  openShops, shopsIn, todaysPrices, makeCustomer, dayRules, tipFor, settle, addD, subD, gte,
  emptyTown, QUESTS, popularityOf, upkeepOf, titleOf, productById,
} from '../src/utils/decimalShop.js'
import { D, show, mul, norm } from '../src/utils/decimalGame.js'

describe('마을 지도', () => {
  it('8×8, 입구는 모두 길이고 서로 이어져 있다', () => {
    expect(MAP).toHaveLength(ROWS)
    MAP.forEach((row) => expect(row).toHaveLength(COLS))
    for (const e of ENTRANCES) expect(isRoad(...e)).toBe(true)
    for (const a of ENTRANCES) for (const b of ENTRANCES) {
      const p = roadPath(a, b)
      expect(p[0]).toEqual(a)
      expect(p[p.length - 1]).toEqual(b)
      p.forEach((t) => expect(isRoad(...t)).toBe(true))
    }
  })
  it('처음 가게 두 곳은 길 옆이고, 손님이 입구에서 걸어올 수 있다', () => {
    const t = emptyTown()
    const shops = shopsIn(t)
    expect(shops).toHaveLength(2)
    for (const s of shops) {
      expect(unlocked(t, s.r, s.c)).toBe(true)
      expect(roadSide(s.r, s.c)).toBe(true)
      const dest = frontRoad(s.r, s.c)
      for (const e of ENTRANCES) expect(roadPath(e, dest).at(-1)).toEqual(dest)
    }
  })
  it('사야 쓰는 땅은 사기 전에 잠겨 있다', () => {
    const t = emptyTown()
    expect(unlocked(t, 2, 0)).toBe(false) // a
    expect(unlocked({ ...t, zones: ['a'] }, 2, 0)).toBe(true)
    expect(unlocked(t, 0, 0)).toBe(false) // b
  })
})

describe('손님 주문 — 차시 모양', () => {
  const all = { ...emptyTown(), built: Object.fromEntries(SHOPS.map((s, i) => [`k${i}`, { kind: 'shop', id: s.id, lv: 1 }])) }
  for (const l of LESSONS) {
    it(`${l.lesson} ${l.name}`, () => {
      for (const town of [emptyTown(), all]) {
        const open = openShops(l, town)
        expect(open.length).toBeGreaterThan(0)
        const prices = todaysPrices(l.type, open.flatMap((s) => s.shop.products))
        for (let i = 0; i < 200; i++) {
          const s = open[i % open.length]
          const c = makeCustomer(l, s.shop, prices)
          expect(s.shop.products).toContain(c.product)
          expect(show(norm(mul(c.a, c.b)))).toBe(show(c.answer))
          expect(c.tag).toBe(`1${c.unit}에 ${c.price}G`)
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
          if (!['mix', 'shift'].includes(l.type)) expect(show(c.a)).toBe(show(prices[c.product]))
          if (productById(c.product).kind === 'count') expect(c.b.p).toBe(0)
          expect(c.answer.p).toBeLessThanOrEqual(4)
        }
      }
    })
  }
})

describe('돈·정산·규칙', () => {
  it('소수 덧셈·뺄셈', () => {
    expect(show(addD(D(1, 1), D(2, 1)))).toBe('0.3')
    expect(show(subD(D(5), D(125, 2)))).toBe('3.75')
    expect(show(subD(D(1), D(25, 1)))).toBe('-1.5')
    expect(gte(D(3), D(299, 2))).toBe(true)
  })
  it('정산: 매출 + 팁 − 매출×0.5 − 유지비', () => {
    const r = settle({ sales: D(1237, 1), tips: D(9), upkeep: D(2) })
    expect(show(r.material)).toBe('61.85')
    expect(show(r.profit)).toBe('68.85')
  })
  it('팁', () => {
    const base = { firstTry: true, mood: 'happy', vip: false, streak: 1, lv: 1 }
    expect(tipFor(base)).toBe(2)
    expect(tipFor({ ...base, firstTry: false })).toBe(0)
    expect(tipFor({ ...base, vip: true })).toBe(7)
    expect(tipFor({ ...base, streak: 6, lv: 3 })).toBe(2 + 2 + 2)
  })
  it('장식은 인기를, 가게는 유지비를 올린다 · 느긋 모드는 두 배', () => {
    const t = emptyTown()
    expect(popularityOf(t)).toBe(1)
    expect(upkeepOf(t)).toBe(2)
    const t2 = { ...t, built: { ...t.built, '1,1': { kind: 'decor', id: 'fountain' } } }
    expect(popularityOf(t2)).toBeCloseTo(1.6)
    const l = LESSONS[0]
    expect(dayRules(l, t, true).patience).toBeCloseTo(dayRules(l, t, false).patience * 2)
    expect(QUESTS.filter((q) => q.done(t))).toHaveLength(0)
    expect(titleOf(t.totalSales)).toBe('꼬마 사장')
  })
})
