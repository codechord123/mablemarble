import sampleQuestions from '../data/sampleQuestions.json'

// 난이도에 맞는 미사용 문제 우선 선택. 없으면 인접 난이도 → 전체 → 풀 리셋 순으로 폴백.
// pool은 외부에서 주입 가능 (기본은 샘플). Phase 2 이후 사용자 업로드 풀 사용.
export function pickQuestion(difficulty = 1, usedIds = [], pool = sampleQuestions) {
  const used = new Set(usedIds)

  const exact = pool.filter((q) => q.difficulty === difficulty && !used.has(q.id))
  if (exact.length > 0) return { question: random(exact), poolReset: false }

  const adjacent = pool.filter(
    (q) => Math.abs(q.difficulty - difficulty) <= 1 && !used.has(q.id),
  )
  if (adjacent.length > 0) return { question: random(adjacent), poolReset: false }

  const anyUnused = pool.filter((q) => !used.has(q.id))
  if (anyUnused.length > 0) return { question: random(anyUnused), poolReset: false }

  // 풀 완전 소진 → 리셋
  return { question: random(pool), poolReset: true }
}

export function isCorrect(question, answer) {
  if (question.type === 'short_answer') {
    // 공백·대소문자 차이는 모두 무시. 분수 표기 통일.
    const normalize = (s) => String(s).replace(/\s+/g, '').toLowerCase()
    const allowed = String(question.answer)
      .split(/[,，]/)
      .map(normalize)
      .filter(Boolean)
    return allowed.includes(normalize(answer))
  }
  return Number(answer) === Number(question.answer)
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
