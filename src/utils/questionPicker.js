import sampleQuestions from '../data/sampleQuestions.json'

// 난이도에 맞는 미사용 문제 우선 선택. 없으면 인접 난이도 → 전체 → 풀 리셋 순으로 폴백.
// pool은 외부에서 주입 가능 (기본은 샘플). Phase 2 이후 사용자 업로드 풀 사용.
export function pickQuestion(difficulty = 1, usedIds = [], pool = sampleQuestions) {
  const used = new Set(usedIds)

  const exact = pool.filter((q) => q.difficulty === difficulty && !used.has(q.id))
  if (exact.length > 0) return random(exact)

  const adjacent = pool.filter(
    (q) => Math.abs(q.difficulty - difficulty) <= 1 && !used.has(q.id),
  )
  if (adjacent.length > 0) return random(adjacent)

  const anyUnused = pool.filter((q) => !used.has(q.id))
  if (anyUnused.length > 0) return random(anyUnused)

  return random(pool)
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
