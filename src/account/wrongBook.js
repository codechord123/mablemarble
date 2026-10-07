// 학생별 오답 노트 — 틀린 문제를 모아 두었다가 다시 풀게 한다.
// 다시 풀어서 '연속 2번' 맞히면 졸업(노트에서 빠진다). 틀리면 연속 기록이 0으로.
import { unitOfQuestion } from '../data/units.js'

export const MASTER_STREAK = 2
export const MAX_WRONG = 100

// 문제 모양 그대로 저장 (Firestore는 배열 속 배열을 못 담아서 글자로 바꿔 둔다)
function snapshot(q) {
  const { id, type, question, choices, answer, explanation, category, difficulty, inputMode, figure, unit } = q
  return JSON.stringify({ id, type, question, choices, answer, explanation, category, difficulty, inputMode, figure, unit })
}
const clean = (s) => String(s).replace(/[^\w가-힣-]/g, '_')
// 문제 글자의 짧은 지문 — 직접 올린 문제 세트끼리 아이디(1, 2, 3…)가 같아도 다른 문제로 구분
function textHash(s) {
  let h = 5381
  for (const ch of String(s || '')) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0
  return h.toString(36)
}
export const keyOf = (q) => `${clean(q.id ?? 'q').slice(0, 60)}~${textHash(q.question)}`
const legacyKeyOf = (q) => clean(q.id ?? q.question).slice(0, 120) // 예전 열쇠 (이어받기용)

export const emptyBook = () => ({ wrong: {}, mastered: 0 })

// book: { wrong: { [key]: { q, count, streak, lastAt } }, mastered }
export function applyResult(book, question, correct, now = Date.now()) {
  let b = book || emptyBook()
  const key = keyOf(question)
  // 예전 열쇠로 저장된 같은 문제가 있으면 새 열쇠로 옮긴다
  const old = legacyKeyOf(question)
  if (!b.wrong[key] && old !== key && b.wrong[old] && JSON.parse(b.wrong[old].q).question === question.question) {
    const { [old]: moved, ...rest } = b.wrong
    b = { ...b, wrong: { ...rest, [key]: moved } }
  }
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

// 푼 문제 통계 — 선생님 통계 화면용 (전체·단원별·영역별 푼 수와 맞힌 수)
export function applyStats(stats, question, correct, now = Date.now()) {
  const s = stats || { answered: 0, correct: 0, byCat: {} }
  const ok = correct ? 1 : 0
  const cat = String(question.category || '기타').slice(0, 40)
  const unit = String(unitOfQuestion(question)).slice(0, 60)
  const c = (s.byCat || {})[cat] || { a: 0, c: 0 }
  const u = (s.byUnit || {})[unit] || { a: 0, c: 0, cats: {} }
  const uc = (u.cats || {})[cat] || { a: 0, c: 0 }
  return {
    answered: (s.answered || 0) + 1,
    correct: (s.correct || 0) + ok,
    byCat: { ...(s.byCat || {}), [cat]: { a: c.a + 1, c: c.c + ok } },
    byUnit: { ...(s.byUnit || {}), [unit]: { a: u.a + 1, c: u.c + ok, cats: { ...(u.cats || {}), [cat]: { a: uc.a + 1, c: uc.c + ok } } } },
    lastAt: now,
  }
}

// 다시 풀 순서 — 많이 틀린 것, 오래된 것 먼저
export function reviewList(book) {
  return Object.entries(book?.wrong || {})
    .map(([key, w]) => {
      const question = JSON.parse(w.q)
      return { key, ...w, question, unit: unitOfQuestion(question) }
    })
    .sort((a, b) => b.count - a.count || a.lastAt - b.lastAt)
}
