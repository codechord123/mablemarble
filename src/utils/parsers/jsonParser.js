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

    const type = VALID_TYPES.has(q.type) ? q.type : 'multiple_choice'
    const choices = Array.isArray(q.choices) ? q.choices.map(String) : []

    // 타입별 정답 검증
    if (type === 'multiple_choice') {
      if (choices.length < 2) {
        errors.push(`항목 ${i + 1}: 객관식인데 보기가 2개 미만`)
        return
      }
      const n = Number(q.answer)
      if (!Number.isInteger(n) || n < 0 || n >= choices.length) {
        errors.push(`항목 ${i + 1}: 정답 인덱스 ${q.answer}가 보기 범위(0~${choices.length - 1}) 밖`)
        return
      }
    } else if (type === 'true_false') {
      const n = Number(q.answer)
      if (n !== 0 && n !== 1) {
        errors.push(`항목 ${i + 1}: OX 정답은 0(O) 또는 1(X)이어야 합니다 (현재: ${q.answer})`)
        return
      }
    } else if (type === 'short_answer') {
      if (!String(q.answer).trim()) {
        errors.push(`항목 ${i + 1}: 단답형 정답이 빈 문자열`)
        return
      }
    }

    questions.push({
      id: q.id || `imp_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      category: q.category || '기타',
      difficulty: clampDifficulty(q.difficulty),
      type,
      question: String(q.question),
      choices: type === 'true_false' && choices.length === 0 ? ['O', 'X'] : choices,
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
