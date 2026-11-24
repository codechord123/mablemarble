import { describe, it, expect } from 'vitest'
import { makeRound, distractors, miniReward, playsToday, todayKey } from '../src/utils/balloonPop.js'
import { D, show } from '../src/utils/decimalGame.js'

describe('🎈 소수점 풍선 터뜨리기', () => {
  it('풍선 4개, 답은 하나, 모두 다른 숫자', () => {
    for (let i = 0; i < 300; i++) {
      const r = makeRound()
      expect(r.choices).toHaveLength(4)
      expect(new Set(r.choices).size).toBe(4)
      expect(r.choices.filter((c) => c === r.answer)).toHaveLength(1)
    }
  })
  it('가짜 답은 소수점만 옮긴 값이 먼저 (곱의 소수점 위치 연습)', () => {
    const d = distractors(D(12, 1)).map(show) // 답 1.2
    expect(d).toContain('0.12')
    expect(d).toContain('12')
    expect(d).not.toContain('1.2')
  })
  it('보상: 맞힌 개수 × 2G, 최대 40G · 하루 판 수는 날짜가 바뀌면 0', () => {
    expect(miniReward(7)).toBe(14)
    expect(miniReward(50)).toBe(40)
    const today = todayKey()
    expect(playsToday({ day: today, plays: 2 }, today)).toBe(2)
    expect(playsToday({ day: '2000-01-01', plays: 3 }, today)).toBe(0)
    expect(playsToday(undefined, today)).toBe(0)
  })
})
