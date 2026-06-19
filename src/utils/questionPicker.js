import questions from '../data/sampleQuestions.json'

// 난이도에 맞는 미사용 문제를 우선 선택. 없으면 인접 난이도 → 전체 → 풀 리셋 순으로 폴백.
export function pickQuestion(difficulty = 1, usedIds = []) {
  const used = new Set(usedIds)

  const exact = questions.filter((q) => q.difficulty === difficulty && !used.has(q.id))
  if (exact.length > 0) return random(exact)

  const adjacent = questions.filter(
    (q) => Math.abs(q.difficulty - difficulty) <= 1 && !used.has(q.id),
  )
  if (adjacent.length > 0) return random(adjacent)

  const anyUnused = questions.filter((q) => !used.has(q.id))
  if (anyUnused.length > 0) return random(anyUnused)

  // 모두 출제됨 → 풀 리셋
  return random(questions)
}

export function isCorrect(question, answer) {
  if (question.type === 'short_answer') {
    const allowed = String(question.answer)
      .split(/[,，]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    return allowed.includes(String(answer).trim().toLowerCase())
  }
  return Number(answer) === Number(question.answer)
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
