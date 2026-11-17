import { describe, it, expect } from 'vitest'
import { safeTown, isBehind, townProgress } from '../src/utils/townGuard.js'

const D = (v, p = 0) => ({ v, p })
const real = {
  money: D(812), days: 6, served: 170, pair: { done: 50, used: ['a'] },
  built: { '2,2': { kind: 'shop', id: 'candyshop', lv: 3 } },
  log: [{ t: 1, l: 'dn1', q: '1.5 × 3', r: 1 }],
}
const empty = { money: D(30), days: 0, served: 0, built: {}, log: [] }

describe('학생 마을 기록 지키기', () => {
  it('새 기기의 빈 마을은 계정의 기록을 덮어쓰지 못한다', () => {
    const t = safeTown(empty, real)
    expect(t.days).toBe(6)
    expect(t.served).toBe(170)
    expect(t.pair.done).toBe(50)
    expect(t.money).toEqual(D(812))
  })
  it('더 앞선 기록(오늘 장사한 기기)은 그대로 저장된다', () => {
    const today = { ...real, days: 6, served: 170, dayInProgress: { stats: { served: 12 } }, money: D(900) }
    expect(safeTown(today, real)).toMatchObject({ money: D(900) })
    const next = { ...real, days: 7, served: 200, money: D(700) }
    expect(safeTown(next, real).money).toEqual(D(700)) // 돈은 짓기로 줄 수 있다
  })
  it('빈 기기에서 짝꿍 계산을 더 풀었으면 그것도 지킨다', () => {
    const saved = { ...real, pair: { done: 20, used: [] } }
    const dev = { ...empty, pair: { done: 31, used: ['x'] } }
    const t = safeTown(dev, saved)
    expect(t.days).toBe(6)
    expect(t.pair.done).toBe(31)
  })
  it('문제별 기록은 두 기기 것을 합친다', () => {
    const dev = { ...empty, log: [{ t: 5, l: 'pair', q: '25 × 4', r: 1 }] }
    const t = safeTown(dev, real)
    expect(t.log.map((e) => e.t)).toEqual([1, 5])
  })
  it('하던 장사(아직 정산 전)도 진행으로 센다', () => {
    expect(townProgress({ served: 10, dayInProgress: { stats: { served: 7 } } }).served).toBe(17)
    expect(isBehind({ days: 2, served: 40 }, { days: 2, served: 30, dayInProgress: { stats: { served: 15 } } })).toBe(true)
  })
  it('계정에 마을이 없으면 이 기기 마을 그대로', () => {
    expect(safeTown(real, undefined)).toBe(real)
  })
})
