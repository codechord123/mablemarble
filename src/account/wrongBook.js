// 학생별 오답 노트 — 틀린 문제를 모아 두었다가 다시 풀게 한다.
// 다시 풀어서 '연속 2번' 맞히면 졸업(노트에서 빠진다). 틀리면 연속 기록이 0으로.
import { unitOfQuestion, latestQuestion, isBundledId } from '../data/units.js'

export const MASTER_STREAK = 2
export const MAX_WRONG = 100
export const MAX_DONE = 60 // 정리(졸업)한 문제 기록 — 선생님이 '무엇을 정리했는지' 볼 수 있게 최근 것만 남긴다

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

export const emptyBook = () => ({ wrong: {}, mastered: 0, done: {} })

// book: { wrong: { [key]: { q, count, streak, lastAt, firstAt } }, mastered, done: { [key]: { q, count, firstAt, at } } }
// mastered는 지금까지 정리한 문제 수(예전 기록 포함), done은 그중 최근에 정리한 문제들.
const storedId = (w) => {
  try {
    return JSON.parse(w.q).id
  } catch {
    return undefined
  }
}

// forceKey: 오답 다시 풀기에서는 노트에 저장된 그 기록의 열쇠로 기록한다.
// (화면엔 고친 최신 문제를 보여 줘서 문제 글이 달라도, 결과는 원래 기록에 쌓여야 졸업할 수 있다)
export function applyResult(book, question, correct, now = Date.now(), forceKey = null) {
  let b = book || emptyBook()
  const key = forceKey || keyOf(question)
  // 예전 열쇠로 저장된 같은 문제가 있으면 새 열쇠로 옮긴다
  const old = legacyKeyOf(question)
  if (!forceKey && !b.wrong[key] && old !== key && b.wrong[old] && JSON.parse(b.wrong[old].q).question === question.question) {
    const { [old]: moved, ...rest } = b.wrong
    b = { ...b, wrong: { ...rest, [key]: moved } }
  }
  // 내장 문제는 글을 고쳐도 번호가 같으면 같은 문제 — 글이 달라 둘로 갈라진 기록을 하나로 합친다
  if (isBundledId(question.id)) {
    const same = Object.keys(b.wrong).filter((k) => k !== key && storedId(b.wrong[k]) === question.id)
    if (same.length) {
      const rest = { ...b.wrong }
      let merged = rest[key] ? { ...rest[key] } : null
      for (const k of same) {
        const w = rest[k]
        delete rest[k]
        merged = merged
          ? {
              ...merged,
              count: (merged.count || 1) + (w.count || 1),
              firstAt: Math.min(merged.firstAt || merged.lastAt || now, w.firstAt || w.lastAt || now),
              lastAt: Math.max(merged.lastAt || 0, w.lastAt || 0),
              streak: 0,
            }
          : { ...w }
      }
      rest[key] = merged
      b = { ...b, wrong: rest }
    }
  }
  const cur = b.wrong[key]
  if (correct) {
    if (!cur) return b
    const streak = (cur.streak || 0) + 1
    if (streak >= MASTER_STREAK) {
      const { [key]: _gone, ...rest } = b.wrong
      let done = { ...(b.done || {}), [key]: { q: cur.q, count: cur.count || 1, firstAt: cur.firstAt || cur.lastAt || now, at: now } }
      const dk = Object.keys(done)
      if (dk.length > MAX_DONE) {
        dk.sort((a, c) => done[a].at - done[c].at)
        done = Object.fromEntries(dk.slice(dk.length - MAX_DONE).map((k) => [k, done[k]]))
      }
      return { ...b, wrong: rest, mastered: (b.mastered || 0) + 1, done }
    }
    return { ...b, wrong: { ...b.wrong, [key]: { ...cur, streak, lastAt: now } } }
  }
  let wrong = {
    ...b.wrong,
    // 원래 기록의 문제 모양은 그대로 둔다(열쇠와 글이 어긋나지 않게)
    [key]: { q: forceKey && cur ? cur.q : snapshot(question), count: (cur?.count || 0) + 1, streak: 0, lastAt: now, firstAt: cur?.firstAt || now },
  }
  // 정리했던 문제를 다시 틀리면 '정리 완료'에서 빼고 다시 오답으로
  let done = b.done
  if (done?.[key]) {
    const { [key]: _back, ...restDone } = done
    done = restDone
  }
  const keys = Object.keys(wrong)
  if (keys.length > MAX_WRONG) {
    // 가장 오래된 것부터 뺀다
    keys.sort((a, c) => wrong[a].lastAt - wrong[c].lastAt)
    wrong = Object.fromEntries(keys.slice(keys.length - MAX_WRONG).map((k) => [k, wrong[k]]))
  }
  return done === b.done ? { ...b, wrong } : { ...b, wrong, done }
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
      const question = latestQuestion(JSON.parse(w.q))
      return { key, ...w, question, unit: unitOfQuestion(question) }
    })
    .sort((a, b) => b.count - a.count || a.lastAt - b.lastAt)
}
