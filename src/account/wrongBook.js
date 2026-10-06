// 학생별 오답 노트 — 틀린 문제를 모아 두었다가 다시 풀게 한다.
// 다시 풀어서 '연속 2번' 맞히면 졸업(노트에서 빠진다). 틀리면 연속 기록이 0으로.
export const MASTER_STREAK = 2
export const MAX_WRONG = 100

// 문제 모양 그대로 저장 (Firestore는 배열 속 배열을 못 담아서 글자로 바꿔 둔다)
function snapshot(q) {
  const { id, type, question, choices, answer, explanation, category, difficulty, inputMode, figure } = q
  return JSON.stringify({ id, type, question, choices, answer, explanation, category, difficulty, inputMode, figure })
}
export const keyOf = (q) => String(q.id ?? q.question).replace(/[^\w가-힣-]/g, '_').slice(0, 120)

export const emptyBook = () => ({ wrong: {}, mastered: 0 })

// book: { wrong: { [key]: { q, count, streak, lastAt } }, mastered }
export function applyResult(book, question, correct, now = Date.now()) {
  const b = book || emptyBook()
  const key = keyOf(question)
  const cur = b.wrong[key]
  if (correct) {
    if (!cur) return b
    const streak = (cur.streak || 0) + 1
    if (streak >= MASTER_STREAK) {
      const { [key]: _gone, ...rest } = b.wrong
      return { ...b, wrong: rest, mastered: (b.mastered || 0) + 1 }
    }
    return { ...b, wrong: { ...b.wrong, [key]: { ...cur, streak, lastAt: now } } }
  }
  let wrong = { ...b.wrong, [key]: { q: snapshot(question), count: (cur?.count || 0) + 1, streak: 0, lastAt: now } }
  const keys = Object.keys(wrong)
  if (keys.length > MAX_WRONG) {
    // 가장 오래된 것부터 뺀다
    keys.sort((a, c) => wrong[a].lastAt - wrong[c].lastAt)
    wrong = Object.fromEntries(keys.slice(keys.length - MAX_WRONG).map((k) => [k, wrong[k]]))
  }
  return { ...b, wrong }
}

// 다시 풀 순서 — 많이 틀린 것, 오래된 것 먼저
export function reviewList(book) {
  return Object.entries(book?.wrong || {})
    .map(([key, w]) => ({ key, ...w, question: JSON.parse(w.q) }))
    .sort((a, b) => b.count - a.count || a.lastAt - b.lastAt)
}
