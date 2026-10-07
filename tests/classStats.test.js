import { describe, it, expect } from 'vitest'
import { summarize, unitsOf } from '../src/account/classStats.js'
import { applyResult, applyStats, emptyBook, keyOf } from '../src/account/wrongBook.js'

const q = (id, cat) => ({ id, type: 'multiple_choice', question: `문제 ${id}`, choices: ['a', 'b'], answer: 0, category: cat })
function play(name, results) {
  let r = { uid: name, name, ...emptyBook(), stats: null }
  for (const [qq, ok] of results) r = { ...r, ...applyResult(r, qq, ok), stats: applyStats(r.stats, qq, ok) }
  return r
}

describe('선생님 통계', () => {
  it('정답률·영역별·많이 틀린 문제', () => {
    const rows = [
      play('민지', [[q('a', '방언 → 표준어'), false], [q('b', '언제 쓸까?'), true], [q('c', '방언 → 표준어'), true]]),
      play('준호', [[q('a', '방언 → 표준어'), false], [q('b', '언제 쓸까?'), false]]),
    ]
    const s = summarize(rows)
    expect(s.totals.students).toBe(2)
    expect(s.totals.answered).toBe(5)
    expect(s.totals.rate).toBe(40)
    expect(s.students.find((x) => x.name === '민지').rate).toBe(67)
    expect(s.byCat.find((c) => c.cat === '방언 → 표준어')).toMatchObject({ a: 3, c: 1, rate: 33 })
    expect(s.topWrong[0].key).toBe(keyOf(q('a')))
    expect(s.topWrong[0].students).toBe(2)
    expect(s.topWrong[0].question.question).toBe('문제 a')
  })
  it('기록이 없어도 깨지지 않는다', () => {
    const s = summarize([{ uid: 'x', name: 'x' }])
    expect(s.students[0].rate).toBe(null)
    expect(s.topWrong).toEqual([])
  })
})

describe('단원별 보기', () => {
  it('단원을 고르면 그 단원 기록만', () => {
    const d = (id, unit, cat) => ({ ...q(id, cat), unit })
    const rows = [
      play('민지', [[d('a', '국어 방언', '뜻'), false], [d('b', '수학 분수', '곱셈'), true], [d('c', '수학 분수', '곱셈'), false]]),
      play('준호', [[d('b', '수학 분수', '곱셈'), false]]),
    ]
    const all = summarize(rows)
    expect(all.totals.answered).toBe(4)
    const kr = summarize(rows, '국어 방언')
    expect(kr.totals.students).toBe(1) // 준호는 국어를 안 풀었다
    expect(kr.totals.answered).toBe(1)
    expect(kr.topWrong.map((w) => w.question.question)).toEqual(['문제 a'])
    expect(kr.byCat.map((c) => c.cat)).toEqual(['뜻'])
    const math = summarize(rows, '수학 분수')
    expect(math.totals.answered).toBe(3)
    expect(math.topWrong[0].students).toBe(1)
  })
  it('단원 정보가 없는 예전 기록은 문제 번호로 내장 단원을 찾는다', async () => {
    const { unitOfQuestion } = await import('../src/data/units.js')
    expect(unitOfQuestion({ id: 'sd24' })).toContain('표준어와 방언')
    expect(unitOfQuestion({ id: 'n05' })).toContain('분수의 곱셈')
    expect(unitOfQuestion({ id: 'zzz' })).toBe('기타 문제')
  })
})
