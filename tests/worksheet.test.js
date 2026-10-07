import { describe, it, expect } from 'vitest'
import { worksheetText, answerLine } from '../src/utils/worksheet.js'

const mc = { type: 'multiple_choice', question: '‘하영’의 뜻은?', choices: ['적게', '많이'], answer: 1, explanation: '제주 말이에요.' }
const sa = { type: 'short_answer', question: '‘바당’을 표준어로?', choices: [], answer: '바다' }

describe('알림장용 문제지 글', () => {
  it('보기·빈칸·맨 뒤 정답', () => {
    const t = worksheetText({ title: '복습 문제', subtitle: '단원: 국어', questions: [mc, sa] })
    expect(t).toContain('1. ‘하영’의 뜻은?')
    expect(t).toContain('① 적게   ② 많이')
    expect(t).toContain('2. ‘바당’을 표준어로?\n   답: ________')
    expect(t).toContain('[정답과 풀이]\n1. ② 많이 — 제주 말이에요.\n2. 바다')
  })
  it('정답 없이 / 문제마다 정답', () => {
    expect(worksheetText({ title: 'x', questions: [mc], answers: 'none' })).not.toContain('정답')
    expect(worksheetText({ title: 'x', questions: [mc], answers: 'inline' })).toContain('→ 정답: ② 많이')
    expect(answerLine(sa)).toBe('바다')
  })
})
