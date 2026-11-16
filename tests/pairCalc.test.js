import { describe, it, expect } from 'vitest'
import { makePairProblem, PAIRS, PAIR_GOAL } from '../src/utils/pairCalc.js'
import { show, mul, norm, parse } from '../src/utils/decimalGame.js'

// 식을 정확하게 계산 (×, + 만 있는 식)
function evalExact(text) {
  const terms = text.split(' + ').map((t) => t.split(' × ').map((x) => parse(x)).reduce((a, b) => norm(mul(a, b))))
  return terms.reduce((a, b) => {
    const p = Math.max(a.p, b.p)
    return norm({ v: a.v * 10 ** (p - a.p) + b.v * 10 ** (p - b.p), p })
  })
}

describe('짝꿍 수 계산', () => {
  it('짝꿍은 곱하면 10·100·1000·1', () => {
    for (const pr of PAIRS) {
      expect(show(norm(mul(pr.a, pr.b)))).toBe(show(pr.p))
      expect(['1', '10', '100', '1000']).toContain(show(pr.p))
    }
  })
  it('50문제: 정답이 식의 값과 같고, 모두 다른 식, 풀이가 있다', () => {
    for (let round = 0; round < 100; round++) {
      const used = new Set()
      for (let k = 0; k < PAIR_GOAL; k++) {
        const q = makePairProblem(k, { used })
        expect(used.has(q.text), q.text).toBe(false)
        used.add(q.text)
        expect(show(evalExact(q.text)), q.text).toBe(show(q.answer))
        expect(q.steps.length).toBeGreaterThan(0)
        // 풀이 마지막에 정답이 나온다
        expect(q.steps.join(' ')).toContain(show(q.answer))
        // 쪼개서 짝꿍: 쪼갤 수가 10의 배수가 아니다 (10 × 5 같은 문제 X)
        if (q.kind === 'split') expect(q.text.split(' × ').some((t) => t !== '50' && !t.includes('.') && Number(t) % 10 === 0), q.text).toBe(false)
        // 초등 5학년: 문제에 소수는 세 자리까지
        for (const t of q.text.split(/ [×+] /)) expect((t.split('.')[1] || '').length).toBeLessThanOrEqual(3)
      }
    }
  })
})
