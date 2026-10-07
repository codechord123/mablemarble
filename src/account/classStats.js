// 반 통계 계산 — 학생들 기록(boomarble_progress)을 모아 선생님 화면에 보여 줄 숫자로.
import { levelFromXp } from '../utils/fractionDrill.js'

const rate = (c, a) => (a ? Math.round((c / a) * 100) : null)

export function summarize(rows) {
  const students = rows
    .map((r) => {
      const st = r.stats || {}
      const wrong = r.wrong || {}
      return {
        uid: r.uid,
        name: r.name || r.uid,
        answered: st.answered || 0,
        correct: st.correct || 0,
        rate: rate(st.correct || 0, st.answered || 0),
        wrongLeft: Object.keys(wrong).length,
        mastered: r.mastered || 0,
        drillLevel: r.drill?.xp ? levelFromXp(r.drill.xp).level : null,
        drillSolved: r.drill?.solved || 0,
        updatedAt: r.updatedAt || 0,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // 영역(문제 분류)별 정답률
  const cats = {}
  for (const r of rows) {
    for (const [cat, v] of Object.entries(r.stats?.byCat || {})) {
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
    for (const [key, w] of Object.entries(r.wrong || {})) {
      let q
      try {
        q = JSON.parse(w.q)
      } catch {
        continue
      }
      qs[key] = qs[key] || { key, question: q, students: 0, misses: 0, names: [] }
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
