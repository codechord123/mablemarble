import { describe, it, expect } from 'vitest'
import { rowsToQuestions } from '../src/utils/parsers/templateSchema.js'

const HEADER = ['번호', '카테고리', '난이도', '유형', '문제', '보기1', '보기2', '보기3', '보기4', '정답', '해설']

describe('rowsToQuestions', () => {
  it('헤더가 첫 행이 아니어도 자동 감지', () => {
    const rows = [
      ['타이틀: 5학년 사회'],
      [],
      HEADER,
      ['1', '사회', '1', '객관식', '수도?', '서울', '부산', '', '', '1', ''],
    ]
    const { questions, errors } = rowsToQuestions(rows)
    expect(errors.length).toBe(0)
    expect(questions.length).toBe(1)
    expect(questions[0].answer).toBe(0) // 1 → 0-indexed
  })

  it('객관식: 정답 범위 초과 시 에러', () => {
    const rows = [
      HEADER,
      ['1', '사회', '1', '객관식', '수도?', '서울', '부산', '', '', '5', ''],
    ]
    const { errors } = rowsToQuestions(rows)
    expect(errors.length).toBe(1)
    expect(errors[0]).toMatch(/범위/)
  })

  it('OX: choices 비어있으면 자동 채움 + 1=O, 2=X', () => {
    const rows = [
      HEADER,
      ['1', '과학', '1', 'OX', '광합성?', '', '', '', '', '1', ''],
    ]
    const { questions } = rowsToQuestions(rows)
    expect(questions[0].choices).toEqual(['O', 'X'])
    expect(questions[0].answer).toBe(0)
  })

  it('단답형: 답을 문자열로 보존', () => {
    const rows = [
      HEADER,
      ['1', '국어', '2', '단답형', '반대말?', '', '', '', '', '작다', '크기 표현'],
    ]
    const { questions } = rowsToQuestions(rows)
    expect(questions[0].answer).toBe('작다')
  })

  it('빈 행은 건너뛰고 다음 행을 계속 처리', () => {
    const rows = [
      HEADER,
      ['1', '사회', '1', '객관식', '수도?', '서울', '부산', '', '', '1', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['2', '수학', '1', '객관식', '12÷4=?', '2', '3', '4', '6', '2', ''],
    ]
    const { questions, errors } = rowsToQuestions(rows)
    expect(errors.length).toBe(0)
    expect(questions.length).toBe(2)
  })

  it('헤더 없으면 오류 메시지', () => {
    const rows = [['A', 'B', 'C'], ['D', 'E', 'F']]
    const { questions, errors } = rowsToQuestions(rows)
    expect(questions.length).toBe(0)
    expect(errors[0]).toMatch(/헤더/)
  })
})
