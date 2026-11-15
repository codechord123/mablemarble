import { describe, it, expect } from 'vitest'
import { D, fmt, show, norm, parse, grade, mul, makeProblem, TYPES } from '../src/utils/decimalGame.js'

// 정답을 부동소수점과 다른 방법(문자열 → 정밀 계산)으로 확인
const asNum = (d) => d.v / 10 ** d.p

describe('소수 기본', () => {
  it('보여 주기 · 끝자리 0 지우기', () => {
    expect(fmt(D(236, 2))).toBe('2.36')
    expect(fmt(D(5, 2))).toBe('0.05')
    expect(show(D(250, 2))).toBe('2.5')
    expect(show(D(300, 2))).toBe('3')
    expect(norm(D(1200, 3))).toEqual(D(12, 1))
  })
  it('곱셈은 정확하다 (0.1 × 0.2 = 0.02)', () => {
    expect(show(mul(D(1, 1), D(2, 1)))).toBe('0.02')
    expect(show(mul(D(236, 2), D(14, 1)))).toBe('3.304')
    expect(show(mul(D(25, 2), D(4, 0)))).toBe('1')
  })
  it('답 읽기', () => {
    expect(parse('0.48')).toEqual(D(48, 2))
    expect(parse('.48')).toEqual(D(48, 2))
    expect(parse('2.0')).toEqual(D(20, 1))
    expect(parse('')).toBeNull()
    expect(parse('.')).toBeNull()
    expect(parse('1.2.3')).toBeNull()
  })
  it('채점: 같은 값이면 끝자리 0이 있어도 정답', () => {
    const p = { answer: D(2, 0) }
    expect(grade(p, '2')).toBe('correct')
    expect(grade(p, '2.0')).toBe('correct')
    expect(grade(p, '0.2')).toBe('wrong')
    expect(grade({ answer: D(48, 2) }, '.48')).toBe('correct')
  })
})

describe('문제 유형', () => {
  for (const id of [...Object.keys(TYPES), 'mix']) {
    it(`${id}: 정답이 식의 값과 같고 풀이가 있다`, () => {
      for (let i = 0; i < 400; i++) {
        for (const hard of [false, true]) {
          const q = makeProblem(id, { hard })
          const [a, b] = q.text.split(' × ').map(parse)
          expect(a && b).toBeTruthy()
          expect(Math.abs(asNum(q.answer) - asNum(a) * asNum(b))).toBeLessThan(1e-9)
          expect(show(q.answer)).toBe(show(mul(a, b)))
          expect(q.steps.length).toBeGreaterThan(0)
          // 문제에 나오는 소수는 끝자리가 0이 아니다
          expect(q.text).not.toMatch(/\.\d*0(?!\d)/)
          // 초등 5학년: 답은 소수 넷째 자리까지
          expect(q.answer.p).toBeLessThanOrEqual(4)
        }
      }
    })
  }
  it('차시에 맞는 자리 수: 한 자리 차시는 소수 한 자리만, 두 자리 차시는 두 자리 소수가 들어간다', () => {
    const placesOf = (q) => q.text.split(' × ').map((t) => (t.split('.')[1] || '').length)
    for (let i = 0; i < 300; i++) {
      for (const hard of [false, true]) {
        const [a, b] = placesOf(makeProblem('dn1', { hard }))
        expect([a, b]).toEqual([1, 0])
        expect(placesOf(makeProblem('dn2', { hard }))).toEqual([2, 0])
        expect(placesOf(makeProblem('nd1', { hard }))).toEqual([0, 1])
        expect(placesOf(makeProblem('nd2', { hard }))).toEqual([0, 2])
        expect(placesOf(makeProblem('dd1', { hard }))).toEqual([1, 1])
        const d2 = placesOf(makeProblem('dd2', { hard }))
        expect(Math.max(...d2)).toBe(2)
        expect(Math.min(...d2)).toBeGreaterThanOrEqual(1)
      }
    }
  })
  it('자연수 곱 보고 소수 곱 구하기: 주어진 식이 맞다', () => {
    for (let i = 0; i < 300; i++) {
      const q = makeProblem('shift', { hard: true })
      expect(q.given).toBeTruthy()
      const [l, r] = q.given.split(' = ')
      const [x, y] = l.split(' × ').map(Number)
      expect(x * y).toBe(Number(r))
    }
  })
})
