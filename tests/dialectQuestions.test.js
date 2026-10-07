import { describe, it, expect } from 'vitest'
import qs from '../src/data/dialectQuestions.json'
import { isCorrect } from '../src/utils/questionPicker.js'
import { getBundledSet } from '../src/data/bundledSets.js'

describe('국어 3단원 표준어와 방언 문제', () => {
  it('난이도별 40문제씩, 모두 120문제 (문제 글도 겹치지 않음)', () => {
    expect(qs.length).toBe(120)
    for (const d of [1, 2, 3]) expect(qs.filter((q) => q.difficulty === d).length).toBe(40)
    expect(new Set(qs.map((q) => q.id)).size).toBe(120)
    expect(new Set(qs.map((q) => q.question)).size).toBe(120)
    expect(getBundledSet('bundled:korean-dialect-ch3').questions).toBe(qs)
  })
  it('객관식은 정답 번호가 보기 안에 있고 보기가 겹치지 않는다', () => {
    for (const q of qs.filter((x) => x.type === 'multiple_choice')) {
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.choices.length)
      expect(new Set(q.choices).size).toBe(q.choices.length)
      expect(isCorrect(q, q.answer)).toBe(true)
      expect(q.explanation.length).toBeGreaterThan(5)
    }
  })
  it('주관식은 띄어쓰기가 달라도 정답', () => {
    const sa = qs.filter((x) => x.type === 'short_answer')
    expect(sa.length).toBeGreaterThan(0)
    for (const q of sa) {
      const first = q.answer.split(',')[0]
      expect(isCorrect(q, ` ${first.split('').join(' ')} `)).toBe(true)
      for (const alt of q.answer.split(',')) expect(isCorrect(q, alt)).toBe(true)
      expect(isCorrect(q, '모르겠다')).toBe(false)
    }
  })
})
