import { describe, it, expect } from 'vitest'
import {
  LESSONS, SHOPS, MAP, ROWS, COLS, ENTRANCES, isRoad, roadSide, frontRoad, roadPath, unlocked,
  openShops, shopsIn, todaysPrices, makeCustomer, dayRules, tipFor, settle, addD, subD, gte,
  makeFreshCustomer, orderKey, emptyTown, QUESTS, popularityOf, upkeepOf, titleOf, productById, GOAL, starTimes, starsFor, clock,
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

describe('타임 어택', () => {
  it('하루는 손님 30명, 별 기준과 시계', () => {
    const t = emptyTown()
    const one = LESSONS.find((l) => l.type === 'dn1')
    const two = LESSONS.find((l) => l.type === 'dd2')
    expect(dayRules(one, t, false).goal).toBe(30)
    expect(GOAL).toBe(30)
    const [s3, s2] = starTimes(one, false)
    expect(starsFor(s3, [s3, s2])).toBe(3)
    expect(starsFor(s3 + 1, [s3, s2])).toBe(2)
    expect(starsFor(s2 + 1, [s3, s2])).toBe(1)
    expect(starTimes(two, false)[0]).toBeGreaterThan(s3)
    expect(starTimes(one, true)[0]).toBe(s3 * 1.5)
    expect(clock(0)).toBe('0:00')
    expect(clock(545)).toBe('9:05')
    expect(dayRules(one, { ...t, ads: 2 }, false).gap).toBeLessThan(dayRules(one, t, false).gap)
  })
})

describe('같은 식 반복 막기', () => {
  it('어느 차시든 처음 가게만으로 30문제가 모두 다른 식', () => {
    const t = emptyTown()
    for (const l of LESSONS) {
      const open = openShops(l, t)
      for (let round = 0; round < 30; round++) {
        const used = new Set()
        for (let i = 0; i < 30; i++) {
          const c = makeFreshCustomer(l, open[i % open.length].shop, {}, { recent: used })
          const k = orderKey(c)
          expect(used.has(k), `${l.lesson} ${k}`).toBe(false)
          used.add(k)
        }
      }
    }
  })
})

describe('새 지도 · 상점', () => {
  it('지도마다 입구가 있고, 모든 길이 입구와 이어져 있다', async () => {
    const { MAPS, entrancesOf } = await import('../src/utils/decimalShop.js')
    for (const M of MAPS) {
      const E = entrancesOf(M.id)
      expect(E.length, M.id).toBeGreaterThan(0)
      M.layout.forEach((row, r) => [...row].forEach((t, c) => {
        if (t !== 'R') return
        const p = roadPath(E[0], [r, c], M.id)
        expect(p.at(-1), `${M.id} ${r},${c}`).toEqual([r, c])
      }))
    }
  })
  it('새 지도는 사야 짓고, 길 옆 땅이 넉넉하다', async () => {
    const { MAPS } = await import('../src/utils/decimalShop.js')
    const t = emptyTown()
    for (const M of MAPS.slice(1)) {
      let side = 0
      M.layout.forEach((row, r) => [...row].forEach((tile, c) => {
        if (tile !== '.') return
        expect(unlocked(t, r, c, M.id)).toBe(false)
        expect(unlocked({ ...t, maps: [M.id] }, r, c, M.id)).toBe(true)
        if (roadSide(r, c, M.id)) side += 1
      }))
      expect(side, M.id).toBeGreaterThanOrEqual(8)
      expect(SHOPS.filter((s) => s.map === M.id)).toHaveLength(2)
    }
  })
  it('새 지도 가게도 손님·식이 나오고, 칸 이름에 지도가 붙는다', async () => {
    const { key, mapOf, parseKey } = await import('../src/utils/decimalShop.js')
    expect(key(2, 3, 'beach')).toBe('beach:2,3')
    expect(mapOf('beach:2,3')).toBe('beach')
    expect(parseKey('beach:2,3')).toEqual([2, 3])
    expect(mapOf('2,3')).toBe('main')
    const town = { ...emptyTown(), maps: ['beach'], built: { 'beach:1,1': { kind: 'shop', id: 'iceshop', lv: 1 } } }
    expect(shopsIn(town)[0]).toMatchObject({ map: 'beach', r: 1, c: 1 })
    for (const s of SHOPS.filter((x) => x.map)) {
      for (const l of LESSONS.filter((x) => x.kind === 'any' || x.kind === s.kind)) {
        const c = makeCustomer(l, s, {})
        expect(gte(c.answer, D(0))).toBe(true)
        s.products.forEach((id) => expect(productById(id), id).toBeTruthy())
      }
    }
  })
  it('장식 30종 · 아이템 4종', async () => {
    const { DECOR, DECOR_THEMES, ITEMS } = await import('../src/utils/decimalShop.js')
    expect(DECOR.length).toBeGreaterThanOrEqual(30)
    const themes = new Set(DECOR_THEMES.map(([id]) => id))
    DECOR.forEach((d) => expect(themes.has(d.theme), d.id).toBe(true))
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length)
    expect(ITEMS.map((x) => x.id)).toEqual(['hourglass', 'megaphone', 'tipcoupon', 'candybasket'])
  })
})

describe('날씨 수요 · 평판 · 손님 생각', () => {
  it('날씨와 유행은 날짜로 정해진다 (새로고침해도 같다)', async () => {
    const { forecastOf } = await import('../src/utils/decimalShop.js')
    for (let d = 0; d < 30; d++) {
      expect(forecastOf(d)).toEqual(forecastOf(d))
    }
    const kinds = new Set(Array.from({ length: 40 }, (_, d) => forecastOf(d).weather.id))
    expect(kinds.size).toBeGreaterThanOrEqual(4)
  })
  it('수요는 0.5~2.5배, 무더위엔 아이스크림 ▲ · 추위엔 핫초코 ▲', async () => {
    const { demandOf, demandLevel, WEATHERS, SHOP_TAGS } = await import('../src/utils/decimalShop.js')
    const hot = { weather: WEATHERS.find((w) => w.id === 'hot'), trend: 'jewel' }
    const cold = { weather: WEATHERS.find((w) => w.id === 'cold'), trend: 'jewel' }
    expect(demandLevel(demandOf('iceshop', hot))).toBe(2)
    expect(demandLevel(demandOf('iceshop', cold))).toBe(-1)
    expect(demandLevel(demandOf('cafe', cold))).toBe(2)
    for (const s of SHOPS) {
      expect(SHOP_TAGS[s.id], s.id).toBeTruthy()
      for (const w of WEATHERS) {
        const d = demandOf(s.id, { weather: w, trend: s.id })
        expect(d).toBeGreaterThanOrEqual(0.5)
        expect(d).toBeLessThanOrEqual(2.5)
      }
    }
  })
  it('평판: 처음에 맞힌 비율로 오르내리고, 기록이 없던 마을은 50', async () => {
    const { repOf, repChange } = await import('../src/utils/decimalShop.js')
    expect(repOf({})).toBe(50)
    expect(repChange({ served: 30, first: 30, lost: 0 })).toBe(10)
    expect(repChange({ served: 30, first: 18, lost: 0 })).toBe(0)
    expect(repChange({ served: 20, first: 5, lost: 10 })).toBeLessThan(0)
    expect(repChange({ served: 0, first: 0, lost: 0 })).toBe(0)
  })
  it('손님 생각: 줄이 꽉 차면 줄 걱정, 아무 일 없으면 가끔만', async () => {
    const { thoughtFor } = await import('../src/utils/decimalShop.js')
    const base = { queueLen: 1, slots: 2, demand: 1, decorHere: 3, pop: 2, lv: 1, rep: 50, rush: false, weather: false }
    expect(thoughtFor({ ...base, queueLen: 2 })).toBe('line')
    expect(thoughtFor(base)).toBe(null)
    expect(thoughtFor({ ...base, rep: 10 }, () => 0)).toBe('rumor')
  })
})
