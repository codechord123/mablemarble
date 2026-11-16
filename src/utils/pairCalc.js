// 짝꿍 수 계산 — 곱하면 10·100·1000·1처럼 딱 떨어지는 두 수(짝꿍)를 찾아
// 곱셈의 교환·결합법칙, 분배법칙으로 빠르게 계산하는 연습 문제를 만든다. (5-2 4단원 소수의 곱셈)
// 소수는 decimalGame의 { v, p }(정수 + 소수 자리 수)로 정확하게 계산한다.
import { D, norm, show, mul, parse } from './decimalGame.js'

const add = (x, y) => {
  const p = Math.max(x.p, y.p)
  return norm({ v: x.v * 10 ** (p - x.p) + y.v * 10 ** (p - y.p), p })
}
const sub = (x, y) => add(x, { v: -y.v, p: y.p })
const M = (...xs) => norm(xs.reduce((a, b) => mul(a, b)))
const n = (s) => parse(String(s)) // '0.25' → D
const S = (d) => show(d)

// 숫자 끝소리에 맞춘 조사 (0.25와 / 50과, 9는 / 11은)
const BATCHIM = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false }
const has = (t) => BATCHIM[String(t).slice(-1)]
const wa = (t) => `${t}${has(t) ? '과' : '와'}`
const eun = (t) => `${t}${has(t) ? '은' : '는'}`
// 으로/로 — ㄹ받침(1·7·8)과 받침 없는 끝소리는 '로'
const ro = (t) => `${t}${['0', '3', '6'].includes(String(t).slice(-1)) ? '으로' : '로'}`

const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
const shuffle = (r, arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
// 끝자리가 0이 아닌 소수 한 자리 (1.1 ~ 9.9)
const dec1 = (r, lo = 11, hi = 99) => {
  for (;;) {
    const v = rint(r, lo, hi)
    if (v % 10) return D(v, 1)
  }
}

// ─── 짝꿍 ───
export const PAIRS = [
  ['5', '2', '10'], ['25', '4', '100'], ['125', '8', '1000'], ['2.5', '4', '10'],
  ['0.5', '2', '1'], ['0.25', '4', '1'], ['0.2', '5', '1'], ['2.5', '0.4', '1'],
  ['1.25', '8', '10'], ['0.125', '8', '1'], ['50', '2', '100'], ['0.5', '20', '10'],
].map(([a, b, p]) => ({ a: n(a), b: n(b), p: n(p) }))
// 학습지 맨 위 표
export const PAIR_CARD = ['5 × 2 = 10', '25 × 4 = 100', '125 × 8 = 1000', '2.5 × 4 = 10', '0.5 × 2 = 1', '0.25 × 4 = 1', '0.2 × 5 = 1', '2.5 × 0.4 = 1']

// ─── 유형 ───
// ① 짝꿍 바로
function direct(r) {
  const pr = pick(r, PAIRS)
  const [x, y] = shuffle(r, [pr.a, pr.b])
  return { kind: 'direct', text: `${S(x)} × ${S(y)}`, answer: pr.p, steps: [`${wa(S(pr.a))} ${eun(S(pr.b))} 짝꿍! 곱하면 ${S(pr.p)}`] }
}

// ② 짝꿍 끼리 먼저 — 세 수 곱셈 (교환·결합법칙)
function triple(r) {
  const pr = pick(r, PAIRS.slice(0, 10))
  const x = r() < 0.5 ? D(rint(r, 3, 49), 0) : dec1(r)
  const order = shuffle(r, ['a', 'x', 'b'])
  const val = { a: pr.a, b: pr.b, x }
  const text = order.map((k) => S(val[k])).join(' × ')
  const answer = M(pr.p, x)
  return {
    kind: 'triple',
    text,
    answer,
    steps: [
      `짝꿍 ${wa(S(pr.a))} ${S(pr.b)}부터 곱해요 (교환·결합법칙)`,
      `= ${S(x)} × (${S(pr.a)} × ${S(pr.b)})`,
      `= ${S(x)} × ${S(pr.p)} = ${S(answer)}`,
    ],
  }
}

// ③ 쪼개서 짝꿍 — 0.25 × 12 = 0.25 × (4 × 3)
function split(r) {
  let pr
  let k
  let big
  // 쪼갤 수가 10의 배수(10 × 5 같은)면 짝꿍 연습이 안 되니 다시
  do {
    pr = pick(r, PAIRS.filter((p) => p.b.p === 0 && p.b.v <= 8))
    k = rint(r, 2, 9)
    big = norm(mul(pr.b, D(k)))
  } while (big.p === 0 && big.v % 10 === 0)
  const answer = M(pr.p, D(k))
  const [first, second] = r() < 0.5 ? [pr.a, big] : [big, pr.a]
  return {
    kind: 'split',
    text: `${S(first)} × ${S(second)}`,
    answer,
    steps: [
      `${S(big)} = ${S(pr.b)} × ${k} 로 쪼개요`,
      `= (${S(pr.a)} × ${S(pr.b)}) × ${k}  (결합법칙)`,
      `= ${S(pr.p)} × ${k} = ${S(answer)}`,
    ],
  }
}

// ④ 가까운 수 빌려 오기 (분배법칙)
function near(r) {
  const form = pick(r, ['m9', 'm11', 'm99', 'm101', 'near2', 'both'])
  if (form === 'm9' || form === 'm11' || form === 'm99' || form === 'm101') {
    const base = form === 'm9' || form === 'm11' ? 10 : 100
    const plus = form === 'm11' || form === 'm101'
    const m = plus ? base + 1 : base - 1
    const x = dec1(r)
    const xb = M(x, D(base))
    const answer = plus ? add(xb, x) : sub(xb, x)
    const op = plus ? '+' : '−'
    return {
      kind: 'near',
      text: `${S(x)} × ${m}`,
      answer,
      steps: [
        `${eun(m)} ${base}보다 1 ${plus ? '커요' : '작아요'}: ${S(x)} × (${base} ${op} 1)`,
        `= ${S(x)} × ${base} ${op} ${S(x)} × 1  (분배법칙)`,
        `= ${S(xb)} ${op} ${S(x)} = ${S(answer)}`,
      ],
    }
  }
  if (form === 'near2') {
    // 1.9 × 4 = (2 − 0.1) × 4,  2.1 × 6 = (2 + 0.1) × 6
    const whole = rint(r, 1, 5)
    const plus = r() < 0.5
    const x = D(whole * 10 + (plus ? 1 : -1), 1)
    const k = rint(r, 2, 9)
    const big = M(D(whole), D(k))
    const small = M(D(1, 1), D(k))
    const answer = plus ? add(big, small) : sub(big, small)
    const op = plus ? '+' : '−'
    return {
      kind: 'near',
      text: `${S(x)} × ${k}`,
      answer,
      steps: [
        `${eun(S(x))} ${whole}보다 0.1 ${plus ? '커요' : '작아요'}: (${whole} ${op} 0.1) × ${k}`,
        `= ${whole} × ${k} ${op} 0.1 × ${k}  (분배법칙)`,
        `= ${S(big)} ${op} ${S(small)} = ${S(answer)}`,
      ],
    }
  }
  // 2.5 × 4.4 = 2.5 × (4 + 0.4) — 나눈 두 수가 모두 짝꿍
  const t = rint(r, 1, 3)
  const second = add(D(4 * t), D(4, 1))
  const answer = add(D(10 * t), D(1))
  return {
    kind: 'near',
    text: `2.5 × ${S(second)}`,
    answer,
    steps: [
      `${S(second)} = ${4 * t} + 0.4 — 둘 다 2.5의 짝꿍!`,
      `= 2.5 × ${4 * t} + 2.5 × 0.4  (분배법칙)`,
      `= ${10 * t} + 1 = ${S(answer)}`,
    ],
  }
}

// ⑤ 거꾸로 묶기 — 3.7 × 6 + 3.7 × 4 = 3.7 × (6 + 4)
function combine(r) {
  const x = dec1(r)
  const total = pick(r, [10, 10, 100])
  const a = total === 10 ? rint(r, 1, 9) : rint(r, 11, 89)
  const b = total - a
  const answer = M(x, D(total))
  return {
    kind: 'combine',
    text: `${S(x)} × ${a} + ${S(x)} × ${b}`,
    answer,
    steps: [`같은 수 ${ro(S(x))} 묶어요: ${S(x)} × (${a} + ${b})  (분배법칙)`, `= ${S(x)} × ${total} = ${S(answer)}`],
  }
}

export const KIND_NAME = { direct: '짝꿍 바로', triple: '짝꿍 끼리 먼저', split: '쪼개서 짝꿍', near: '가까운 수 빌려 오기', combine: '거꾸로 묶기' }
export const PAIR_GOAL = 50

// k번째 문제(0부터) — 앞쪽은 쉬운 유형, 뒤로 갈수록 섞어서
export function makePairProblem(k, { rng = Math.random, used = new Set() } = {}) {
  const pool = k < 5 ? [direct] : k < 15 ? [direct, triple, triple, split] : k < 25 ? [triple, split, near, near] : [triple, split, near, near, combine]
  let q
  for (let i = 0; i < 40; i++) {
    q = pick(rng, pool)(rng)
    if (!used.has(q.text)) break
  }
  return q
}
