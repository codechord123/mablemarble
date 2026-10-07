import { describe, it, expect } from 'vitest'
import { applyResult, reviewList, emptyBook, MAX_WRONG, keyOf } from '../src/account/wrongBook.js'

const q = (id, extra = {}) => ({ id, type: 'multiple_choice', question: `문제 ${id}`, choices: ['1', '2'], answer: 1, category: '분수', ...extra })

describe('오답 노트', () => {
  it('틀리면 들어가고, 연속 2번 맞히면 졸업', () => {
    let b = applyResult(emptyBook(), q('a'), false, 1)
    expect(Object.keys(b.wrong)).toEqual([keyOf(q('a'))])
    b = applyResult(b, q('a'), true, 2)
    expect(b.wrong[keyOf(q('a'))].streak).toBe(1)
    b = applyResult(b, q('a'), false, 3) // 다시 틀리면 처음부터
    expect(b.wrong[keyOf(q('a'))].streak).toBe(0)
    expect(b.wrong[keyOf(q('a'))].count).toBe(2)
    b = applyResult(b, q('a'), true, 4)
    b = applyResult(b, q('a'), true, 5)
    expect(b.wrong[keyOf(q('a'))]).toBeUndefined()
    expect(b.mastered).toBe(1)
  })
  it('노트에 없는 문제를 맞히면 그대로', () => {
    const b = emptyBook()
    expect(applyResult(b, q('x'), true)).toBe(b)
  })
  it('문제 모양(그림 포함)을 그대로 되살린다', () => {
    const fig = { kind: 'rect', points: [[0, 0], [3, 4]] }
    const b = applyResult(emptyBook(), q('f', { figure: fig, inputMode: 'fraction', junk: 1 }), false)
    const [item] = reviewList(b)
    expect(item.question.figure).toEqual(fig)
    expect(item.question.inputMode).toBe('fraction')
    expect(item.question.junk).toBeUndefined()
    expect(typeof b.wrong[keyOf(q('f'))].q).toBe('string') // Firestore는 배열 속 배열을 못 담는다
  })
  it('많이 틀린 것부터, 너무 많으면 오래된 것부터 뺀다', () => {
    let b = emptyBook()
    for (let i = 0; i < MAX_WRONG + 5; i++) b = applyResult(b, q(`q${i}`), false, i)
    expect(Object.keys(b.wrong).length).toBe(MAX_WRONG)
    expect(b.wrong[keyOf(q('q0'))]).toBeUndefined()
    b = applyResult(b, q('q50'), false, 999)
    expect(reviewList(b)[0].key).toBe(keyOf(q('q50')))
  })
  it('아이디가 같아도 문제가 다르면 따로 저장 (직접 올린 세트끼리)', () => {
    let b = applyResult(emptyBook(), q('1', { question: '사과는 몇 개?' }), false)
    b = applyResult(b, q('1', { question: '배는 몇 개?' }), false)
    expect(Object.keys(b.wrong).length).toBe(2)
  })
  it('예전 열쇠로 저장된 문제도 이어서 졸업할 수 있다', () => {
    const old = { wrong: { a: { q: JSON.stringify(q('a')), count: 1, streak: 1, lastAt: 1 } }, mastered: 0 }
    const b = applyResult(old, q('a'), true)
    expect(b.wrong.a).toBeUndefined()
    expect(b.wrong[keyOf(q('a'))]).toBeUndefined()
    expect(b.mastered).toBe(1)
  })
})
