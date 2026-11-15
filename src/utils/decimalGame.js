// 소수의 곱셈 몬스터 배틀 — 문제 만들기·채점·풀이 (화면과 상관없는 순수 함수)
// 소수는 { v: 정수, p: 소수점 아래 자리 수 } 로 다룬다 (예: 2.36 = { v: 236, p: 2 }).
// 곱은 정수 곱셈 + 자리 수 더하기라서 부동소수점 오차가 없다. 교과서 풀이와도 같은 방식이다.

// ─── 소수 기본 ───
export const D = (v, p = 0) => ({ v, p })

// 끝자리 0 지우기 (2.50 → 2.5, 3.0 → 3)
export function norm(d) {
  let { v, p } = d
  while (p > 0 && v % 10 === 0) {
    v /= 10
    p -= 1
  }
  return { v, p }
}

export function fmt(d) {
  const { v, p } = d
  const neg = v < 0
  const s = String(Math.abs(v)).padStart(p + 1, '0')
  const out = p ? `${s.slice(0, s.length - p)}.${s.slice(s.length - p)}` : s
  return neg ? `-${out}` : out
}
export const show = (d) => fmt(norm(d))

export const mul = (a, b) => ({ v: a.v * b.v, p: a.p + b.p })

// 학생이 쓴 답 읽기 — "0.48", ".48", "2.0", "12" 모두 받는다
export function parse(str) {
  const s = String(str ?? '').trim()
  if (!/^\d*\.?\d*$/.test(s) || s === '' || s === '.') return null
  const [i, f = ''] = s.split('.')
  return { v: Number((i || '0') + f), p: f.length }
}

export function same(a, b) {
  const x = norm(a)
  const y = norm(b)
  return x.v === y.v && x.p === y.p
}

export function grade(problem, str) {
  const d = parse(str)
  if (!d) return 'invalid'
  return same(d, problem.answer) ? 'correct' : 'wrong'
}

// ─── 난수 ───
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
// 끝자리가 0이 아닌 소수 (예: 자리 1이면 0.1~0.9, 1.1~9.9 …)
function dec(r, lo, hi, p) {
  for (;;) {
    const v = rint(r, lo, hi)
    if (v % 10 !== 0) return D(v, p)
  }
}
const nat = (r, lo, hi) => D(rint(r, lo, hi), 0)

// ─── 풀이 ───
const places = (d) => norm(d).p
// 숫자 끝 글자의 받침에 맞춘 조사 (0.4는, 0.6은)
const BATCHIM = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false }
const eun = (txt) => `${txt}${BATCHIM[String(txt).slice(-1)] ? '은' : '는'}`
const kind = (p) => (p ? `소수 ${p}자리` : '자연수')
function mulSteps(a, b) {
  const A = norm(a)
  const B = norm(b)
  const raw = A.v * B.v
  const k = A.p + B.p
  const lines = [`자연수처럼 곱해요: ${A.v} × ${B.v} = ${raw}`]
  if (k > 0) {
    const parts = [A.p && `${eun(show(A))} 소수 ${A.p}자리`, B.p && `${eun(show(B))} 소수 ${B.p}자리`].filter(Boolean).join(', ')
    lines.push(`${parts} → 곱은 소수 ${k}자리`)
    lines.push(`${raw}에서 소수점 아래가 ${k}자리가 되게 찍으면 ${fmt(D(raw, k))}${fmt(D(raw, k)) !== show(D(raw, k)) ? ` = ${show(D(raw, k))}` : ''}`)
  }
  return lines
}

// ─── 문제 유형 ───
// make(r, hard) → [a, b] 두 수. hard는 보스 문제(자리 수가 하나 더 많다).
function mulProblem(type, a, b) {
  return {
    type,
    a: norm(a),
    b: norm(b),
    text: `${show(a)} × ${show(b)}`,
    answer: norm(mul(a, b)),
    steps: mulSteps(a, b),
  }
}

// 교과서 차시(5-2 4단원 소수의 곱셈) 그대로:
// 2차시 (소수)×(자연수) 소수 한 자리 · 3차시 두 자리 · 4·5차시 (자연수)×(소수) · 6·7차시 (소수)×(소수) · 8차시 곱의 소수점 위치
// 보스(hard)는 같은 차시 안에서 수가 커진다(두 자리 자연수, 1보다 큰 소수 등).
const swap = (r, a, b) => (r() < 0.5 ? [a, b] : [b, a])
export const TYPES = {
  dn1: {
    name: '(소수) × (자연수) · 소수 한 자리',
    make: (r, hard) => mulProblem('dn1', hard ? dec(r, 11, 99, 1) : dec(r, 1, 59, 1), hard ? nat(r, 11, 25) : nat(r, 2, 9)),
  },
  dn2: {
    name: '(소수) × (자연수) · 소수 두 자리',
    make: (r, hard) => mulProblem('dn2', hard ? dec(r, 101, 499, 2) : dec(r, 11, 299, 2), hard ? nat(r, 11, 19) : nat(r, 2, 9)),
  },
  nd1: {
    name: '(자연수) × (소수) · 소수 한 자리',
    make: (r, hard) => mulProblem('nd1', hard ? nat(r, 11, 25) : nat(r, 2, 12), hard ? dec(r, 11, 59, 1) : dec(r, 1, 49, 1)),
  },
  nd2: {
    name: '(자연수) × (소수) · 소수 두 자리',
    make: (r, hard) => mulProblem('nd2', hard ? nat(r, 11, 19) : nat(r, 2, 9), hard ? dec(r, 101, 399, 2) : dec(r, 11, 299, 2)),
  },
  dd1: {
    name: '(소수) × (소수) · 소수 한 자리',
    make: (r, hard) => mulProblem('dd1', hard ? dec(r, 11, 59, 1) : dec(r, 1, 39, 1), hard ? dec(r, 11, 39, 1) : dec(r, 1, 29, 1)),
  },
  dd2: {
    name: '(소수) × (소수) · 소수 두 자리',
    make: (r, hard) => {
      // 보통: 소수 두 자리 × 소수 한 자리 (0.25 × 0.3, 1.25 × 2.4) · 보스: 두 자리 × 두 자리 (0.45 × 0.32, 1.25 × 0.16)
      const [a, b] = hard ? swap(r, dec(r, 11, 199, 2), dec(r, 11, 99, 2)) : swap(r, dec(r, 11, 299, 2), dec(r, 1, 29, 1))
      return mulProblem('dd2', a, b)
    },
  },
  shift: {
    name: '곱의 소수점 위치',
    make: (r, hard) => (hard || r() < 0.3 ? givenProblem(r) : shiftProblem(r)),
  },
}

// ×10, ×100, ×1000 / ×0.1, ×0.01, ×0.001 — 소수점이 옮겨 가는 칸 수
function shiftProblem(r) {
  const k = rint(r, 1, 3)
  const up = r() < 0.5
  const natural = !up && r() < 0.5
  const x = up ? dec(r, 101, 9999, rint(r, 1, 3)) : natural ? nat(r, 11, 999) : dec(r, 11, 999, 1)
  const kk = !up && !natural ? Math.min(k, 2) : k // 소수 × 0.001은 너무 길어져서 빼기
  const m = up ? D(10 ** kk, 0) : D(1, kk)
  const ans = norm(mul(x, m))
  return {
    type: 'shift',
    a: norm(x),
    b: norm(m),
    text: `${show(x)} × ${show(m)}`,
    answer: ans,
    steps: [
      up
        ? `${show(m)}을 곱하면 소수점이 오른쪽으로 ${kk}칸 옮겨 가요`
        : `${show(m)}을 곱하면 소수점이 왼쪽으로 ${kk}칸 옮겨 가요`,
      `${show(x)} → ${show(ans)}`,
    ],
  }
}

// 자연수의 곱을 보고 소수의 곱 구하기 (236 × 14 = 3304 → 2.36 × 1.4)
function givenProblem(r) {
  for (;;) {
    const A = rint(r, 12, 999)
    const B = rint(r, 2, 39)
    if (A % 10 === 0 || B % 10 === 0) continue
    const pa = rint(r, 0, 2)
    const pb = pa === 0 ? rint(r, 1, 2) : rint(r, 0, 1)
    if (A < 10 ** pa || B < 10 ** pb) continue // 0.0□ 같은 모양은 빼기
    const a = D(A, pa)
    const b = D(B, pb)
    const ans = norm(mul(a, b))
    const raw = fmt(D(A * B, pa + pb))
    return {
      type: 'shift',
      a,
      b,
      given: `${A} × ${B} = ${A * B}`,
      text: `${show(a)} × ${show(b)}`,
      answer: ans,
      steps: [
        `${A} × ${B} = ${A * B} 를 이용해요`,
        `${kind(pa)} × ${kind(pb)} → 곱은 소수 ${pa + pb}자리`,
        `${A * B} → ${raw}${raw !== show(ans) ? ` = ${show(ans)}` : ''}`,
      ],
    }
  }
}

export function makeProblem(typeId, { hard = false, rng = Math.random } = {}) {
  const t = typeId === 'mix' ? pick(rng, Object.keys(TYPES)) : typeId
  return { ...TYPES[t].make(rng, hard), typeName: TYPES[t].name }
}

export { places }
