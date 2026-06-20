import { describe, it, expect } from 'vitest'
import { pickQuestion, isCorrect } from '../src/utils/questionPicker.js'

describe('pickQuestion', () => {
  it('해당 난이도에서 미사용 문제를 뽑는다', () => {
    const { question, poolReset } = pickQuestion(1, [])
    expect(question).toBeDefined()
    expect(question.difficulty).toBe(1)
    expect(poolReset).toBe(false)
  })
  it('해당 난이도가 모두 소진되면 인접 난이도로 폴백', () => {
    const allD1 = ['q01','q02','q03','q04','q05','q06','q07','q08','q09','q10']
    const { question, poolReset } = pickQuestion(1, allD1)
    expect(allD1).not.toContain(question.id)
    expect(poolReset).toBe(false)
  })
  it('풀이 완전 소진되면 poolReset=true 반환', () => {
    const allIds = ['q01','q02','q03','q04','q05','q06','q07','q08','q09','q10',
                    'q11','q12','q13','q14','q15','q16','q17','q18','q19','q20',
                    'q21','q22','q23','q24','q25','q26','q27','q28','q29','q30']
    const { question, poolReset } = pickQuestion(1, allIds)
    expect(question).toBeDefined()
    expect(poolReset).toBe(true)
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
