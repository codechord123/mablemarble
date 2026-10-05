// 분수의 곱셈 연습(미니게임) — 문제를 식으로 만들어 끝없이 낸다.
// 답과 풀이는 분수 계산으로 구하므로 틀릴 일이 없다. 레벨이 오를수록 새 유형이 열린다.

// ─── 분수 기본 ───
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))

export function frac(n, d = 1) {
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}
const mul = (a, b) => frac(a.n * b.n, a.d * b.d)
const eq = (a, b) => a.n === b.n && a.d === b.d

// 화면에 쓰는 모양: 자연수 / 진분수 / 대분수(과)
export function fmt(v) {
  if (v.d === 1) return String(v.n)
  if (v.n < v.d) return `${v.n}/${v.d}`
  const w = Math.floor(v.n / v.d)
  return `${w}과${v.n - w * v.d}/${v.d}`
}

// ─── 피연산자 ───
// { kind: 'int', k } | { kind: 'frac', n, d } | { kind: 'mixed', w, n, d }
const I = (k) => ({ kind: 'int', k })
const P = (n, d) => ({ kind: 'frac', n, d })
const M = (w, n, d) => ({ kind: 'mixed', w, n, d })

function value(o) {
  if (o.kind === 'int') return frac(o.k)
  if (o.kind === 'frac') return frac(o.n, o.d)
  return frac(o.w * o.d + o.n, o.d)
}
function show(o) {
  if (o.kind === 'int') return String(o.k)
  if (o.kind === 'frac') return `${o.n}/${o.d}`
  return `${o.w}과${o.n}/${o.d}`
}
function improper(o) {
  if (o.kind === 'int') return String(o.k)
  if (o.kind === 'frac') return `${o.n}/${o.d}`
  return `${o.w * o.d + o.n}/${o.d}`
}

// 풀이: 대분수 → 가분수, 곱하기, 약분·대분수
export function explain(ops) {
  const conv = ops.filter((o) => o.kind === 'mixed').map((o) => `${show(o)} = ${improper(o)}`)
  let num = 1
  let den = 1
  for (const o of ops) {
    if (o.kind === 'int') num *= o.k
    else if (o.kind === 'frac') { num *= o.n; den *= o.d }
    else { num *= o.w * o.d + o.n; den *= o.d }
  }
  const answer = fmt(ops.map(value).reduce(mul))
  const raw = den === 1 ? String(num) : `${num}/${den}`
  const steps = [`${ops.map(improper).join(' × ')} = ${raw}`]
  if (raw !== answer) steps.push(answer)
  return { conversions: conv, steps: steps.join(' = ') }
}

// ─── 난수 ───
const rint = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)]
// 기약 진분수 (분모 lo~hi)
function properFrac(rng, dLo, dHi) {
  for (;;) {
    const d = rint(rng, dLo, dHi)
    const n = rint(rng, 1, d - 1)
    if (gcd(n, d) === 1) return P(n, d)
  }
}
function mixedNum(rng, wHi, dLo, dHi) {
  const f = properFrac(rng, dLo, dHi)
  return M(rint(rng, 1, wHi), f.n, f.d)
}

// ─── 유형 (레벨이 오르면 하나씩 열린다) ───
export const TOPICS = [
  { id: 'pf_n', name: '진분수 × 자연수',
    make: (r, big) => [properFrac(r, 2, big ? 12 : 9), I(rint(r, 2, big ? 12 : 6))] },
  { id: 'n_pf', name: '자연수 × 진분수',
    // 처음엔 나누어떨어지는 수로 — 묶음으로 세는 감각을 먼저
    make: (r, big) => {
      const f = properFrac(r, 2, big ? 12 : 9)
      return [I(f.d * rint(r, 2, big ? 9 : 5)), f]
    } },
  { id: 'pf_pf', name: '진분수 × 진분수',
    make: (r, big) => [properFrac(r, 2, big ? 10 : 6), properFrac(r, 2, big ? 10 : 6)] },
  { id: 'mf_n', name: '대분수 × 자연수',
    make: (r, big) => [mixedNum(r, big ? 4 : 3, 2, big ? 9 : 6), I(rint(r, 2, big ? 9 : 5))] },
  { id: 'n_mf', name: '자연수 × 대분수',
    make: (r, big) => [I(rint(r, 2, big ? 24 : 9)), mixedNum(r, big ? 3 : 2, 2, big ? 9 : 6)] },
  { id: 'pf_pf_cancel', name: '약분하며 곱하기',
    // 엇갈려 약분되는 짝: a/b × c/d 에서 a와 d, c와 b가 공약수를 갖도록
    make: (r) => {
      for (;;) {
        const x = properFrac(r, 3, 16)
        const y = properFrac(r, 3, 16)
        if (gcd(x.n, y.d) > 1 || gcd(y.n, x.d) > 1) return [x, y]
      }
    } },
  { id: 'mf_mf', name: '대분수 × 대분수',
    make: (r, big) => [mixedNum(r, big ? 4 : 3, 2, big ? 8 : 6), mixedNum(r, big ? 3 : 2, 2, big ? 8 : 6)] },
  { id: 'three', name: '세 수의 곱셈',
    make: (r) => {
      const a = properFrac(r, 2, 8)
      const b = properFrac(r, 2, 8)
      return [a, b, I(a.d * rint(r, 1, 3))]
    } },
]

// ─── 레벨 ───
export const MAX_TOPIC_LEVEL = TOPICS.length // 8레벨까지 유형이 하나씩 열린다
export const TITLES = [
  [1, '분수 새싹'], [3, '곱셈 탐험가'], [5, '대분수 기사'], [7, '분수 마법사'], [9, '곱셈 마스터'], [12, '분수의 전설'],
]
export function titleFor(level) {
  let t = TITLES[0][1]
  for (const [lv, name] of TITLES) if (level >= lv) t = name
  return t
}

// 다음 레벨까지 필요한 경험치 — 레벨이 오를수록 조금씩 늘어난다
export const xpToNext = (level) => 50 + 15 * (level - 1)

// 경험치 → 레벨·현재 칸
export function levelFromXp(totalXp) {
  let level = 1
  let rest = totalXp
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level += 1
  }
  return { level, into: rest, need: xpToNext(level) }
}

// 정답 한 번에 얻는 경험치: 기본 10 + 빠르기 + 연속 정답
export function xpFor({ seconds, streak }) {
  const speed = seconds <= 10 ? 10 : seconds <= 20 ? 5 : 0
  const combo = streak >= 5 ? 10 : streak >= 3 ? 5 : 0
  return { base: 10, speed, combo, total: 10 + speed + combo }
}

// 레벨에 맞는 문제 하나. 새로 열린 유형을 자주(60%), 지난 유형도 섞어서 복습.
export function makeProblem(level, rng = Math.random) {
  const unlocked = Math.min(level, MAX_TOPIC_LEVEL)
  const big = level > MAX_TOPIC_LEVEL
  let topic
  if (!big && rng() < 0.6) topic = TOPICS[unlocked - 1]
  else topic = TOPICS[rint(rng, 0, unlocked - 1)]
  const ops = topic.make(rng, big)
  const v = ops.map(value).reduce(mul)
  return {
    topic: topic.id,
    topicName: topic.name,
    ops,
    text: ops.map(show).join(' × '),
    answer: fmt(v),
    value: v,
    explanation: explain(ops),
  }
}

// ─── 채점 ───
// 입력 모양: "5", "3/4", "2과1/3". 값이 같아도 약분이 덜 됐으면 'unreduced'.
export function parseAnswer(str) {
  const s = String(str).replace(/\s+/g, '').replace(/와/g, '과')
  let m
  if ((m = s.match(/^(\d+)$/))) return { int: +m[1], n: 0, d: 1 }
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return { int: 0, n: +m[1], d: +m[2] }
  if ((m = s.match(/^(\d+)과(\d+)\/(\d+)$/))) return { int: +m[1], n: +m[2], d: +m[3] }
  return null
}

export function grade(problem, str) {
  const p = parseAnswer(str)
  if (!p || p.d === 0) return 'wrong'
  const v = frac(p.int * p.d + p.n, p.d)
  if (!eq(v, problem.value)) return 'wrong'
  // 분수 부분이 기약분수여야 하고, 대분수면 분수 부분이 진분수여야 한다
  if (p.n > 0 && gcd(p.n, p.d) !== 1) return 'unreduced'
  if (p.int > 0 && p.n >= p.d) return 'unreduced'
  if (p.int === 0 && p.d === 1 && p.n > 0) return 'unreduced' // "6/1" 같은 꼴
  return 'correct'
}
