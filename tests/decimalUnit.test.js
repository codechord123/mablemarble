import { describe, it, expect } from 'vitest'
import questions from '../src/data/decimalMultiplyQuestions.json'
import { BUNDLED_SETS } from '../src/data/bundledSets.js'
import { isCorrect } from '../src/utils/questionPicker.js'
import { detectInputMode } from '../src/components/ui/FractionInput.jsx'

// 정답을 다시 계산해 본다 (정수로 바꿔 곱해서 정확하게)
function mulStr(a, b) {
  const p = (x) => (x.includes('.') ? x.split('.')[1].length : 0)
  const v = BigInt(a.replace('.', '')) * BigInt(b.replace('.', ''))
  const n = p(a) + p(b)
  let s = v.toString().padStart(n + 1, '0')
  if (n) s = `${s.slice(0, -n)}.${s.slice(-n)}`.replace(/\.?0+$/, '')
  return s
}

describe('부르마블 · 5-2 4단원 소수의 곱셈', () => {
  it('세트가 내장돼 있고, 번호가 다른 세트와 겹치지 않는다', () => {
    const set = BUNDLED_SETS.find((s) => s.id === 'bundled:decimal-multiply-5-2-ch4')
    expect(set.questions.length).toBeGreaterThanOrEqual(90)
    const ids = new Set()
    for (const s of BUNDLED_SETS) for (const q of s.questions) {
      if (s.id === set.id) expect(ids.has(q.id), q.id).toBe(false)
      ids.add(q.id)
    }
  })
  it('풀이 속 곱셈이 모두 맞고, 단답 정답은 풀이의 마지막 곱과 같다', () => {
    let checked = 0
    for (const q of questions) {
      const eqs = [...`${q.question} ${q.explanation}`.matchAll(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)/g)]
      for (const [, a, b, c] of eqs) {
        expect(mulStr(a, b), `${q.id}: ${a} × ${b}`).toBe(mulStr(c, '1'))
        checked += 1
      }
      if (q.type === 'short_answer' && q.category !== '생활 속 소수의 곱셈') {
        const last = q.explanation.match(/(\d+(?:\.\d+)?) × (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)(?!.*×)/)
        expect(last, q.id).toBeTruthy()
        expect(q.answer, q.id).toBe(mulStr(last[1], last[2]))
      }
    }
    expect(checked).toBeGreaterThan(80)
  })
  it('모두 문장제 (단순 계산 문제 없음)', () => {
    for (const q of questions) expect(q.question, q.id).not.toMatch(/계산하세요|의 값은\?|배는 얼마일까요/)
  })
  it('형식: 난이도 1~3, 객관식 답은 보기 안, 단답은 소수/정수 입력', () => {
    for (const q of questions) {
      expect([1, 2, 3]).toContain(q.difficulty)
      if (q.type === 'multiple_choice') {
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(q.choices.length)
      } else {
        expect(q.inputMode).toBe(q.answer.includes('.') ? 'decimal' : 'integer')
        expect(detectInputMode(q.answer)).toBe(q.answer.includes('.') ? 'decimal' : 'fraction')
      }
    }
  })
  it('소수 답은 끝자리 0·앞자리 0이 달라도 맞다', () => {
    const q = { type: 'short_answer', answer: '2.4' }
    expect(isCorrect(q, '2.4')).toBe(true)
    expect(isCorrect(q, '2.40')).toBe(true)
    expect(isCorrect(q, '24')).toBe(false)
    expect(isCorrect(q, '0.24')).toBe(false)
    expect(isCorrect({ type: 'short_answer', answer: '0.5' }, '.5')).toBe(true)
    expect(isCorrect({ type: 'short_answer', answer: '3' }, '3.0')).toBe(true)
    expect(isCorrect({ type: 'short_answer', answer: '1과1/2' }, '3/2')).toBe(true) // 분수는 예전처럼
  })
})
