import { describe, it, expect } from 'vitest'
import { townSummary } from '../src/account/classStats.js'

describe('선생님 화면 — 소수 마을 요약', () => {
  it('문제별 기록을 처음에 맞힘·힌트 후 맞힘·손님이 감으로 센다', () => {
    const t = {
      pair: { done: 37 },
      days: 2,
      records: { dn1: { secs: 545, stars: 2 } },
      dayInProgress: { type: 'dd1', stats: { served: 12 } },
      log: [
        { l: 'pair', q: '0.25 × 4', r: 1, t: 1 },
        { l: 'pair', q: '1.3 × 9', r: 2, t: 2 },
        { l: 'dn1', q: '2.4 × 3', r: 1, t: 3 },
        { l: 'dn1', q: '3.7 × 6', r: 2, t: 4 },
        { l: 'dd1', q: '1.3 × 3.5', r: 0, t: 5 },
      ],
    }
    const s = townSummary(t)
    expect(s.pairDone).toBe(37)
    expect(s.shop).toEqual({ first: 1, retry: 1, gone: 1 })
    expect(s.pair).toEqual({ first: 1, retry: 1 })
    expect(s.records[0]).toEqual({ lesson: '2차시', secs: 545, stars: 2 })
    expect(s.inProgress).toEqual({ lesson: '6차시', served: 12 })
    expect(s.hard.map((h) => h.q)).toEqual(['1.3 × 3.5', '3.7 × 6', '1.3 × 9']) // 최근 것부터
    expect(townSummary(undefined)).toBeNull()
  })
})
