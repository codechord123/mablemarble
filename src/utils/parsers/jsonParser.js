// 우리 자체 형식 JSON 파서. 내보내기 ↔ 가져오기로 문제 세트 공유.

const VALID_TYPES = new Set(['multiple_choice', 'true_false', 'short_answer'])

export async function parseJson(file) {
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSON 파싱 실패. 파일이 손상되었거나 형식이 아닙니다.')
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.questions)
      ? data.questions
      : null

  if (!list) {
    throw new Error('JSON은 배열 또는 { questions: [...] } 형태여야 합니다.')
  }

  const questions = []
  const errors = []

  list.forEach((q, i) => {
    if (!q || typeof q !== 'object') {
      errors.push(`항목 ${i + 1}: 객체가 아닙니다.`)
      return
    }
    if (!q.question) {
      errors.push(`항목 ${i + 1}: question 필드 누락`)
      return
    }
    if (q.answer === undefined || q.answer === null || q.answer === '') {
      errors.push(`항목 ${i + 1}: answer 필드 누락`)
      return
    }

    questions.push({
      id: q.id || `imp_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: q.category || '기타',
      difficulty: clampDifficulty(q.difficulty),
      type: VALID_TYPES.has(q.type) ? q.type : 'multiple_choice',
      question: String(q.question),
      choices: Array.isArray(q.choices) ? q.choices.map(String) : [],
      answer: q.answer,
      explanation: q.explanation || '',
    })
  })

  return { questions, errors, source: 'json' }
}

function clampDifficulty(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 1) return 1
  if (n > 3) return 3
  return Math.round(n)
}
