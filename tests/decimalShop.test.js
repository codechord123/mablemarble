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
  it('정산: 매출 + 팁 − 매출×0.3 − 유지비 − 배상금', () => {
    const r = settle({ sales: D(1237, 1), tips: D(9), upkeep: D(2) })
    expect(show(r.material)).toBe('37.11')
    expect(show(r.profit)).toBe('93.59')
    expect(show(settle({ sales: D(1237, 1), tips: D(9), upkeep: D(2), comp: D(55, 1) }).profit)).toBe('88.09')
  })
  it('😠 컴플레인: 일반은 기다림 75%, 진상은 50%부터 · 배상금 = 주문 × 0.1 (진상 × 0.2)', async () => {
    const { complaintOf } = await import('../src/utils/decimalShop.js')
    expect(complaintOf({ waited: 50, pat: 70, answer: D(396, 1) })).toBe(null)
    expect(show(complaintOf({ waited: 53, pat: 70, answer: D(396, 1) }).amount)).toBe('3.96')
    expect(complaintOf({ waited: 20, pat: 40, rude: true, answer: D(25) }).amount).toEqual(D(5))
    expect(complaintOf({ waited: 19, pat: 40, rude: true, answer: D(25) })).toBe(null)
  })
  it('😤 진상 손님은 가끔 (VIP·단골은 아님)', async () => {
    const { makeCustomer } = await import('../src/utils/decimalShop.js')
    let rude = 0
    for (let i = 0; i < 500; i++) {
      const c = makeCustomer(LESSONS[0], SHOPS[0], {})
      if (c.rude) { rude += 1; expect(c.vip).toBe(false); expect(c.say.startsWith('😤')).toBe(true) }
    }
    expect(rude).toBeGreaterThan(20)
    expect(rude).toBeLessThan(120)
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
  it('장식 30종 넘게 · 아이템과 이벤트', async () => {
    const { DECOR, DECOR_THEMES, ITEMS } = await import('../src/utils/decimalShop.js')
    expect(DECOR.length).toBeGreaterThanOrEqual(30)
    const themes = new Set(DECOR_THEMES.map(([id]) => id))
    DECOR.forEach((d) => expect(themes.has(d.theme), d.id).toBe(true))
    expect(new Set(DECOR.map((d) => d.id)).size).toBe(DECOR.length)
    expect(ITEMS.map((x) => x.id)).toEqual(['hourglass', 'megaphone', 'tipcoupon', 'candybasket', 'magnet', 'reporter', 'catsnack'])
    const { EVENTS } = await import('../src/utils/decimalShop.js')
    ITEMS.filter((x) => x.event).forEach((x) => expect(EVENTS.some((e) => e.id === x.event), x.id).toBe(true))
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
    expect(repChange({ served: 30, first: 18, lost: 0, repBonus: 3 })).toBe(3) // 📸 방송국 취재
    expect(repChange({ served: 30, first: 18, lost: 0, repBonus: 9 })).toBe(5) // 보너스는 5까지
  })
  it('손님 생각: 줄이 꽉 차면 줄 걱정, 아무 일 없으면 가끔만', async () => {
    const { thoughtFor } = await import('../src/utils/decimalShop.js')
    const base = { queueLen: 1, slots: 2, demand: 1, decorHere: 3, pop: 2, lv: 1, rep: 50, rush: false, weather: false }
    expect(thoughtFor({ ...base, queueLen: 2 })).toBe('line')
    expect(thoughtFor(base)).toBe(null)
    expect(thoughtFor({ ...base, rep: 10 }, () => 0)).toBe('rumor')
  })
})

describe('큰 지도 · 가게 팔기 · 이웃 효과 · 단골 · 줄 예보', () => {
  // 넓히기 전 지도 — 학생들이 지어 둔 가게 자리가 그대로여야 한다
  const OLD = {
    main: ['bbbRbbbb', 'b..R..bb', 'a..R...a', 'RRRRRRRR', 'a..R...a', 'aa.R..aa', 'aaaRaaaa', 'aaaRaaaa'],
    beach: ['..R..~~~', '..R...~~', 'RRRRR..~', '..R.R..~', '..R.R...', 'RRRRRR..', '~~..R...', '~~~.R..~'],
    snow: ['...R....', '.IIR....', '.IIR..II', '...R..II', 'RRRRRRRR', '...R....', '..IR....', '...R....'],
    park: ['........', '.RRRRRR.', '.R....R.', 'RR....RR', '.R....R.', '.R....R.', '.RRRRRR.', '....R...'],
  }
  // 12×12로 넓혔던 지도 (두 번째 넓히기 전)
  const PREV12 = {
    main: ['bbbRbbbbcccc', 'b..R..bbcccc', 'a..R...acccc', 'RRRRRRRRRRRR', 'a..R...acRcc', 'aa.R..aacRcc', 'aaaRaaaacRcc', 'aaaRaaaacRcc', 'dddRdddddRdd', 'RRRRRRRRRRRR', 'dddRdddddRdd', 'dddRdddddRdd'],
    beach: ['..R..~~~~~~~', '..R...~~~~~~', 'RRRRR..~~~~~', '..R.R..~~~..', '..R.R....R..', 'RRRRRR...R..', '~~..R....R..', '~~~.R..~.R..', '~~~.R....R..', '~~..RRRRRRRR', '~...R....R..', '~~..R....R~~'],
    snow: ['...R........', '.IIR.....II.', '.IIR..II.II.', '...R..II....', 'RRRRRRRRRRRR', '...R.....R..', '..IR.....R..', '...R.....R..', '...R..II.R..', 'RRRRRRRRRRRR', '..IR.....R..', '...R.....R..'],
    park: ['............', '.RRRRRR.....', '.R....R.....', 'RR....RRRRR.', '.R....R...R.', '.R....R...R.', '.RRRRRR...R.', '....R.....R.', '....RRRRRRR.', '....R.....R.', '....R.....R.', '....R.....R.'],
  }
  it('넓힌 지도도 예전 칸(8×8, 12×12)은 똑같다 — 지어 둔 가게 자리가 그대로', async () => {
    const { MAPS } = await import('../src/utils/decimalShop.js')
    for (const M of MAPS) {
      expect(M.layout, M.id).toHaveLength(16)
      M.layout.forEach((row) => expect(row).toHaveLength(16))
      OLD[M.id].forEach((row, r) => expect(M.layout[r].slice(0, 8), `${M.id} ${r}`).toBe(row))
      PREV12[M.id].forEach((row, r) => expect(M.layout[r].slice(0, 12), `${M.id} ${r}`).toBe(row))
    }
  })
  it('예전에 지은 가게·산 땅은 그대로 쓸 수 있다', () => {
    const town = { ...emptyTown(), zones: ['a'], maps: ['beach'] }
    expect(unlocked(town, 2, 0)).toBe(true) // a 땅
    expect(unlocked(town, 0, 0)).toBe(false) // b는 안 샀음
    expect(unlocked(town, 4, 1, 'beach')).toBe(true)
    expect(unlocked(town, 0, 9)).toBe(false) // 새 땅 c
    expect(unlocked({ ...town, zones: ['a', 'c'] }, 0, 9)).toBe(true)
  })
  it('가게 팔기: 들인 돈 × 0.5, 가게 하나는 남긴다', async () => {
    const { sellPrice, spentOn, canSell } = await import('../src/utils/decimalShop.js')
    expect(spentOn({ kind: 'shop', id: 'bakery', lv: 3 })).toBe(300 + 180 + 450)
    expect(sellPrice({ kind: 'shop', id: 'bakery', lv: 3 })).toEqual(D(465))
    expect(show(sellPrice({ kind: 'decor', id: 'tree' }))).toBe('7.5')
    const t = emptyTown()
    expect(canSell(t, '2,2')).toMatchObject({ ok: true }) // 처음 마을(가게 2곳)에서도 팔 수 있다
    expect(canSell(t, '2,2').warn).toMatch(/개수로/) // 그 종류 마지막이면 알려 준다
    const t2 = { ...t, built: { ...t.built, '4,2': { kind: 'shop', id: 'donutshop', lv: 1 } } }
    expect(canSell(t2, '2,2').warn).toBe(null)
    const one = { ...t, built: { '2,2': { kind: 'shop', id: 'candyshop', lv: 1 } } }
    expect(canSell(one, '2,2').ok).toBe(false) // 마지막 한 곳은 못 판다
  })
  it('이웃 효과: 2칸 안 장식·가게만, 최대 +100%', async () => {
    const { neighborsOf } = await import('../src/utils/decimalShop.js')
    const t = { ...emptyTown(), built: {
      '2,2': { kind: 'shop', id: 'candyshop', lv: 1 },
      '1,1': { kind: 'decor', id: 'fountain' }, // 가까움
      '7,7': { kind: 'decor', id: 'tower' }, // 멀다
      'beach:2,2': { kind: 'decor', id: 'tower' }, // 다른 지도
      '2,4': { kind: 'shop', id: 'fruit', lv: 1 },
    } }
    const nb = neighborsOf(t, '2,2')
    expect(nb.decor).toEqual(['fountain'])
    expect(nb.shops).toEqual(['fruit'])
    expect(nb.bonus).toBeCloseTo(0.4)
  })
  it('단골: ❤️5부터, 단골은 다시 찾아온다', async () => {
    const { regularsOf, makeCustomer } = await import('../src/utils/decimalShop.js')
    expect(regularsOf({ fans: { '🐶': 5, '🐱': 4 } })).toEqual(['🐶'])
    expect(regularsOf({})).toEqual([])
    let seen = 0
    for (let i = 0; i < 300; i++) {
      const c = makeCustomer(LESSONS[0], SHOPS[0], {}, { regulars: ['🐶'] })
      if (c.regular) { seen += 1; expect(c.customer.emoji).toBe('🐶') }
    }
    expect(seen).toBeGreaterThan(40)
  })
  it('줄 예보: 오는 손님이 계산보다 많으면 줄이 길어진다', async () => {
    const { queueForecast, overflowRisk } = await import('../src/utils/decimalShop.js')
    expect(queueForecast({ gapSec: 6, avgSolveSec: 20 })).toEqual({ arrive: 10, serve: 3, growing: true })
    expect(queueForecast({ gapSec: 20, avgSolveSec: 10 }).growing).toBe(false)
    expect(queueForecast({ gapSec: 10, avgSolveSec: 10, rush: true }).arrive).toBe(12)
    expect(overflowRisk({ arrivePerMin: 10, share: 0.5, patienceSec: 70, slots: 2 })).toBe(true)
    expect(overflowRisk({ arrivePerMin: 2, share: 0.2, patienceSec: 70, slots: 3 })).toBe(false)
  })
})
