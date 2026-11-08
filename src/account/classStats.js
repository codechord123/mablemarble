// 반 통계 계산 — 학생들 기록(boomarble_progress)을 모아 선생님 화면에 보여 줄 숫자로.
// unit을 주면 그 단원만 계산한다 (단원별 보기).
import { levelFromXp } from '../utils/fractionDrill.js'
import { unitOfQuestion, latestQuestion } from '../data/units.js'

const rate = (c, a) => (a ? Math.round((c / a) * 100) : null)

function wrongItems(r) {
  const out = []
  for (const [key, w] of Object.entries(r.wrong || {})) {
    try {
      const q = JSON.parse(w.q)
      out.push({ key, w, q, unit: unitOfQuestion(q) })
    } catch {
      /* 깨진 기록은 건너뛴다 */
    }
  }
  return out
}

// 정리(졸업)한 문제들
function doneItems(r) {
  const out = []
  for (const [key, d] of Object.entries(r.done || {})) {
    try {
      const q = JSON.parse(d.q)
      out.push({ key, d, q, unit: unitOfQuestion(q) })
    } catch {
      /* 깨진 기록은 건너뛴다 */
    }
  }
  return out
}

// 기록에 나오는 단원 목록 (푼 문제가 많은 순)
export function unitsOf(rows) {
  const n = {}
  for (const r of rows) {
    for (const [u, v] of Object.entries(r.stats?.byUnit || {})) n[u] = (n[u] || 0) + (v.a || 0)
    for (const it of wrongItems(r)) n[it.unit] = (n[it.unit] || 0) + 1
  }
  return Object.entries(n)
    .sort((a, b) => b[1] - a[1])
    .map(([u]) => u)
}

export function summarize(rows, unit = null) {
  const pick = (r) => {
    const st = r.stats || {}
    if (!unit) return { a: st.answered || 0, c: st.correct || 0, cats: st.byCat || {} }
    const u = st.byUnit?.[unit] || {}
    return { a: u.a || 0, c: u.c || 0, cats: u.cats || {} }
  }
  const items = (r) => wrongItems(r).filter((it) => !unit || it.unit === unit)
  const dones = (r) => doneItems(r).filter((it) => !unit || it.unit === unit)

  const students = rows
    .map((r) => {
      const s = pick(r)
      return {
        uid: r.uid,
        name: r.name || r.uid,
        answered: s.a,
        correct: s.c,
        rate: rate(s.c, s.a),
        wrongLeft: items(r).length,
        mastered: r.mastered || 0,
        // 학생을 누르면 보이는 목록 — 남은 오답(다시 풀기 진행)과 정리한 문제
        wrongList: items(r)
          .map(({ key, w, q, unit: u }) => ({ key, q: latestQuestion(q), unit: u, count: w.count || 1, streak: w.streak || 0, lastAt: w.lastAt || 0, firstAt: w.firstAt || w.lastAt || 0 }))
          .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt),
        doneList: dones(r)
          .map(({ key, d, q, unit: u }) => ({ key, q: latestQuestion(q), unit: u, count: d.count || 1, at: d.at || 0 }))
          .sort((a, b) => b.at - a.at),
        drillLevel: r.drill?.xp ? levelFromXp(r.drill.xp).level : null,
        drillSolved: r.drill?.solved || 0,
        updatedAt: r.updatedAt || 0,
      }
    })
    .filter((s) => !unit || s.answered > 0 || s.wrongLeft > 0) // 단원별이면 그 단원을 푼 학생만
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // 영역(문제 분류)별 정답률
  const cats = {}
  for (const r of rows) {
    for (const [cat, v] of Object.entries(pick(r).cats)) {
      cats[cat] = cats[cat] || { a: 0, c: 0 }
      cats[cat].a += v.a || 0
      cats[cat].c += v.c || 0
    }
  }
  const byCat = Object.entries(cats)
    .map(([cat, v]) => ({ cat, a: v.a, c: v.c, rate: rate(v.c, v.a) }))
    .sort((x, y) => (x.rate ?? 101) - (y.rate ?? 101))

  // 우리 반이 많이 틀린 문제 — 오답 노트에 그 문제가 남아 있는 학생 수 순
  const qs = {}
  for (const r of rows) {
    for (const { key, w, q, unit: u } of items(r)) {
      qs[key] = qs[key] || { key, question: latestQuestion(q), unit: u, students: 0, misses: 0, names: [], doneNames: [] }
      qs[key].students += 1
      qs[key].misses += w.count || 1
      qs[key].names.push(r.name || r.uid)
    }
  }
  // 같은 문제를 이미 정리한 학생도 함께 보여 준다
  for (const r of rows) {
    for (const { key } of dones(r)) if (qs[key]) qs[key].doneNames.push(r.name || r.uid)
  }
  const topWrong = Object.values(qs)
    .sort((a, b) => b.students - a.students || b.misses - a.misses)
    .slice(0, 10)

  const answered = students.reduce((s, x) => s + x.answered, 0)
  const correct = students.reduce((s, x) => s + x.correct, 0)
  return {
    students,
    byCat,
    topWrong,
    totals: {
      students: students.length,
      answered,
      rate: rate(correct, answered),
      wrongLeft: students.reduce((s, x) => s + x.wrongLeft, 0),
      mastered: students.reduce((s, x) => s + x.mastered, 0),
    },
  }
}
