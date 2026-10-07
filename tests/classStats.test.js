import { describe, it, expect } from 'vitest'
import { summarize } from '../src/account/classStats.js'
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
