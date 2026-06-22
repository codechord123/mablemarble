// 앱에 기본 내장된 문제 세트 목록. 사용자가 따로 업로드하지 않아도 게임 가능.

import sampleQuestions from './sampleQuestions.json'
import fractionsAddSubQuestions from './fractionsAddSubQuestions.json'
import fractionsQuestions from './fractionsQuestions.json'

export const BUNDLED_SETS = [
  {
    id: 'bundled:fractions-5-1-ch5',
    name: '➕ 수학 5-1 · 5단원 분수의 덧셈과 뺄셈',
    subject: '수학',
    questions: fractionsAddSubQuestions,
  },
  {
    id: 'bundled:fractions-5-1-ch4',
    name: '📐 수학 5-1 · 4단원 약분과 통분',
    subject: '수학',
    questions: fractionsQuestions,
  },
  {
    id: 'bundled:sample-mixed',
    name: '🎲 기본 샘플 (사회/수학/과학/국어)',
    subject: '종합',
    questions: sampleQuestions,
  },
]

export const DEFAULT_BUNDLED_ID = BUNDLED_SETS[0].id

export function getBundledSet(id) {
  return BUNDLED_SETS.find((s) => s.id === id)
}
