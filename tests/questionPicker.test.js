import { describe, it, expect } from 'vitest'
import { pickQuestion, isCorrect } from '../src/utils/questionPicker.js'

describe('pickQuestion', () => {
  it('해당 난이도에서 미사용 문제를 뽑는다', () => {
    const q = pickQuestion(1, [])
    expect(q).toBeDefined()
    expect(q.difficulty).toBe(1)
  })
  it('해당 난이도가 모두 소진되면 인접 난이도로 폴백', () => {
    // 모든 난이도 1 문제를 사용 처리
    const allD1 = ['q01','q02','q03','q04','q05','q06','q07','q08','q09','q10']
    const q = pickQuestion(1, allD1)
    expect(allD1).not.toContain(q.id)
  })
})

describe('isCorrect', () => {
  it('객관식 정답 인덱스 비교', () => {
    expect(isCorrect({ type: 'multiple_choice', answer: 2 }, 2)).toBe(true)
    expect(isCorrect({ type: 'multiple_choice', answer: 2 }, 1)).toBe(false)
  })
  it('OX 정답 비교 (0=O, 1=X)', () => {
    expect(isCorrect({ type: 'true_false', answer: 0 }, 0)).toBe(true)
  })
  it('단답형은 공백/대소문자 무시', () => {
    expect(isCorrect({ type: 'short_answer', answer: '독도' }, '  독도  ')).toBe(true)
    expect(isCorrect({ type: 'short_answer', answer: '독도' }, '울릉도')).toBe(false)
  })
  it('단답형 쉼표 구분 복수 정답 허용', () => {
    expect(isCorrect({ type: 'short_answer', answer: '추하다,못생기다' }, '못생기다')).toBe(true)
  })
})
