// 반 통계 계산 — 학생들 기록(boomarble_progress)을 모아 선생님 화면에 보여 줄 숫자로.
// unit을 주면 그 단원만 계산한다 (단원별 보기).
import { levelFromXp } from '../utils/fractionDrill.js'
import { unitOfQuestion } from '../data/units.js'

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
      qs[key] = qs[key] || { key, question: q, unit: u, students: 0, misses: 0, names: [] }
      qs[key].students += 1
      qs[key].misses += w.count || 1
      qs[key].names.push(r.name || r.uid)
    }
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
