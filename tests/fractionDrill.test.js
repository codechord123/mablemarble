import { describe, it, expect } from 'vitest'
import {
  makeProblem, grade, levelFromXp, xpToNext, xpFor, fmt, frac, explain, TOPICS, titleFor,
} from '../src/utils/fractionDrill.js'

// 같은 결과가 나오는 난수
function seeded(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

describe('분수 표기', () => {
  it('자연수·진분수·대분수', () => {
    expect(fmt(frac(12, 4))).toBe('3')
    expect(fmt(frac(6, 8))).toBe('3/4')
    expect(fmt(frac(15, 7))).toBe('2과1/7')
  })
})

describe('문제 만들기', () => {
  it('모든 레벨에서 1000문제를 만들어도 답이 정답 채점을 통과한다', () => {
    const rng = seeded(7)
    for (let level = 1; level <= 12; level++) {
      for (let i = 0; i < 1000; i++) {
        const p = makeProblem(level, rng)
        expect(grade(p, p.answer)).toBe('correct')
        expect(p.value.n).toBeGreaterThan(0)
      }
    }
  })
  it('레벨 1에서는 첫 유형만, 레벨이 오르면 새 유형이 열린다', () => {
    const rng = seeded(3)
    const seen = (lv) => new Set(Array.from({ length: 300 }, () => makeProblem(lv, rng).topic))
    expect([...seen(1)]).toEqual(['pf_n'])
    expect(seen(4).has('mf_n')).toBe(true)
    expect(seen(4).has('mf_mf')).toBe(false)
    expect(seen(8).has('three')).toBe(true)
    expect(TOPICS.length).toBe(8)
  })
  it('풀이에 가분수 고치기가 들어간다', () => {
    const e = explain([{ kind: 'mixed', w: 1, n: 2, d: 5 }, { kind: 'int', k: 4 }])
    expect(e.conversions).toEqual(['1과2/5 = 7/5'])
    expect(e.steps).toBe('7/5 × 4 = 28/5 = 5과3/5')
  })
})

describe('채점', () => {
  const p = makeProblem(1, () => 0) // 1/2 × 2 = 1
  it('정답·오답', () => {
    const q = { value: frac(28, 5) }
    expect(grade(q, '5과3/5')).toBe('correct')
    expect(grade(q, '28/5')).toBe('correct') // 기약 가분수도 인정
    expect(grade(q, '5과2/5')).toBe('wrong')
    expect(grade(q, '')).toBe('wrong')
    expect(p.answer).toBeTruthy()
  })
  it('값은 맞지만 약분이 덜 되면 unreduced', () => {
    const q = { value: frac(3, 4) }
    expect(grade(q, '6/8')).toBe('unreduced')
    const r = { value: frac(5, 2) }
    expect(grade(r, '2과2/4')).toBe('unreduced')
    expect(grade(r, '1과3/2')).toBe('unreduced')
    const w = { value: frac(6) }
    expect(grade(w, '12/2')).toBe('unreduced')
    expect(grade(w, '6')).toBe('correct')
  })
})

describe('레벨·경험치', () => {
  it('경험치가 쌓이면 레벨이 오른다', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, need: 160 })
    expect(levelFromXp(159).level).toBe(1)
    expect(levelFromXp(160).level).toBe(2)
    expect(levelFromXp(160 + xpToNext(2)).level).toBe(3)
  })
  it('빠르고 연속이면 보너스', () => {
    expect(xpFor({ seconds: 30, streak: 1 }).total).toBe(20)
    expect(xpFor({ seconds: 8, streak: 3 }).total).toBe(28)
    expect(xpFor({ seconds: 15, streak: 6 }).total).toBe(28)
    expect(xpFor({ seconds: 5, streak: 9 }).total).toBe(30)
  })
  it('레벨당 정답 6~8개', () => {
    // 가장 느리게(20씩) 8개, 가장 빠르게(30씩) 6개
    expect(Math.ceil(xpToNext(1) / 20)).toBe(8)
    expect(Math.ceil(xpToNext(5) / 30)).toBe(6)
  })
  it('칭호', () => {
    expect(titleFor(1)).toBe('분수 새싹')
    expect(titleFor(5)).toBe('대분수 기사')
    expect(titleFor(20)).toBe('분수의 전설')
  })
})

describe('계정 수련 기록', async () => {
  const { loadAccountProfile } = await import('../src/utils/drillProfiles.js')
  it('계정 기록이 더 앞서면 그것을 쓰고, 아이디로 구분한다', () => {
    const acc = { username: 'minji', name: '민지' }
    const p = loadAccountProfile(acc, '🐶', { xp: 500, solved: 30, correct: 25, bestStreak: 7 })
    expect(p.id).toBe('acct:minji')
    expect(p.xp).toBe(500)
    expect(p.account).toBe('minji')
    expect(loadAccountProfile(acc, '🐶', null).xp).toBe(0)
  })
})
