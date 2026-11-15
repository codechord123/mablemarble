import { describe, it, expect } from 'vitest'
import { makeOrder, LESSONS, COUNT_ITEMS, MEASURE_ITEMS, coinsFor, addD, moodOf } from '../src/utils/decimalShop.js'
import { D, show, mul, parse } from '../src/utils/decimalGame.js'

describe('손님 주문', () => {
  for (const l of LESSONS) {
    it(`${l.lesson}: 가격 × 양 = 정답, 단위가 맞다`, () => {
      for (let i = 0; i < 300; i++) {
        const o = makeOrder(l.type)
        // 계산서 식과 정답
        expect(show(mul(o.a, o.b))).toBe(show(o.answer))
        expect(o.tag).toBe(`1${o.unit}에 ${o.price}G`)
        expect(parse(o.price)).toBeTruthy()
        // 자연수 개수면 개수 물건, 소수 양이면 무게·길이·들이 물건
        const counted = o.b.p === 0
        const list = counted ? COUNT_ITEMS : MEASURE_ITEMS
        expect(list.some(([e, n, u]) => e === o.icon && n === o.item && u === o.unit)).toBe(true)
        expect(o.say).toContain(o.qty)
        expect(o.helper.length).toBeGreaterThan(0)
        // 도우미는 정답을 그대로 말하지 않는다 (자연수 곱 + 자리 수까지만)
        if (o.answer.p > 0) expect(o.helper).not.toContain(` ${show(o.answer)} `)
      }
    })
  }
})

describe('코인·매출', () => {
  const base = { firstTry: true, mood: 'happy', helper: false, vip: false, streak: 1, level: 0, decorCount: 0 }
  it('한 번에 + 기분 좋을 때가 가장 많다', () => {
    expect(coinsFor(base)).toBe(15)
    expect(coinsFor({ ...base, mood: 'grumpy' })).toBe(10)
    expect(coinsFor({ ...base, firstTry: false })).toBe(5)
    expect(coinsFor({ ...base, helper: true })).toBe(12)
    expect(coinsFor({ ...base, vip: true })).toBe(30)
    expect(coinsFor({ ...base, streak: 4, level: 1, decorCount: 2 })).toBe(15 + 3 + 2 + 2)
  })
  it('매출은 소수 그대로 정확히 더한다', () => {
    expect(show(addD(D(1, 1), D(2, 1)))).toBe('0.3')
    expect(show(addD(D(3258, 4), D(72, 1)))).toBe('7.5258')
  })
  it('손님 기분: 기다릴수록 나빠지지만 떠나지 않는다', () => {
    expect(moodOf(5, 60)).toBe('happy')
    expect(moodOf(40, 60)).toBe('ok')
    expect(moodOf(600, 60)).toBe('grumpy')
  })
})
