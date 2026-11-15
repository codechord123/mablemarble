// 소수 가게 키우기 — 손님 주문(가격 × 양)을 만들고, 코인·가게 꾸미기·기록을 다룬다.
// 계산 문제는 decimalGame.js의 차시별 소수 곱셈을 그대로 쓰고, 가게 장면으로 옷만 입힌다.
//   (소수)×(자연수): 1개에 2.4G 물약 3병 → 2.4 × 3
//   (자연수)×(소수): 1kg에 6G 치즈 0.7kg → 6 × 0.7
//   (소수)×(소수):   1m에 0.8G 리본 1.5m → 0.8 × 1.5
import { makeProblem, show, norm, D } from './decimalGame.js'

// ─── 물건 ───
// 개수로 파는 것 (곱하는 수가 자연수일 때)
export const COUNT_ITEMS = [
  ['🧪', '물약', '병'], ['🍩', '도넛', '개'], ['🎈', '풍선', '개'], ['✏️', '연필', '자루'],
  ['🧃', '주스', '병'], ['🍪', '쿠키', '봉지'], ['🧁', '컵케이크', '개'], ['🕯️', '양초', '개'],
]
// 무게·길이·들이로 파는 것 (곱하는 수가 소수일 때)
export const MEASURE_ITEMS = [
  ['🧀', '치즈', 'kg'], ['🍇', '포도', 'kg'], ['🍓', '딸기', 'kg'], ['🍬', '사탕', 'kg'],
  ['🎀', '리본', 'm'], ['🧵', '털실', 'm'], ['🥛', '우유', 'L'], ['🍯', '꿀', 'L'],
]

// ─── 손님 ───
export const CUSTOMERS = [
  ['🐶', '강아지'], ['🐱', '고양이'], ['🐰', '토끼'], ['🐻', '곰'], ['🦊', '여우'], ['🐼', '판다'],
  ['🐸', '개구리'], ['🐧', '펭귄'], ['🐨', '코알라'], ['🐯', '호랑이'], ['🐷', '돼지'], ['🐔', '닭'],
  ['🦄', '유니콘', 'rare'], ['🐲', '아기 용', 'rare'], ['👽', '외계인', 'rare'], ['🤖', '로봇', 'rare'],
]
const SAY = [
  (it, q) => `${it} ${q} 주세요!`,
  (it, q) => `${it} ${q} 살게요~`,
  (it, q) => `${it} ${q}만 주실래요?`,
  (it, q) => `음… ${it} ${q} 부탁해요!`,
]

// ─── 오늘 팔 물건 = 교과서 차시 ───
export const LESSONS = [
  { type: 'dn1', lesson: '2차시', name: '(소수)×(자연수) · 소수 한 자리', ex: '1개에 2.4G 물약 3병' },
  { type: 'dn2', lesson: '3차시', name: '(소수)×(자연수) · 소수 두 자리', ex: '1개에 1.25G 쿠키 4봉지' },
  { type: 'nd1', lesson: '4차시', name: '(자연수)×(소수) · 소수 한 자리', ex: '1kg에 6G 치즈 0.7kg' },
  { type: 'nd2', lesson: '5차시', name: '(자연수)×(소수) · 소수 두 자리', ex: '1m에 8G 리본 1.25m' },
  { type: 'dd1', lesson: '6차시', name: '(소수)×(소수) · 소수 한 자리', ex: '1kg에 2.4G 포도 1.5kg' },
  { type: 'dd2', lesson: '7차시', name: '(소수)×(소수) · 소수 두 자리', ex: '1L에 1.25G 우유 0.8L' },
  { type: 'shift', lesson: '8차시', name: '곱의 소수점 위치', ex: '1개에 0.35G 연필 100자루' },
  { type: 'mix', lesson: '단원 정리', name: '모든 유형 섞어서', ex: '여러 손님이 섞여서 와요' },
]
export const CUSTOMERS_PER_DAY = 8

const pick = (r, arr) => arr[Math.floor(r() * arr.length)]

// 손님 한 명 = 주문 + 계산 문제
export function makeOrder(type, { rng = Math.random, vipChance = 0.1, met = {} } = {}) {
  const p = makeProblem(type, { hard: rng() < 0.25, rng })
  const counted = norm(p.b).p === 0 // 곱하는 수가 자연수면 개수로
  const [icon, item, unit] = pick(rng, counted ? COUNT_ITEMS : MEASURE_ITEMS)
  // 아직 못 만난 손님이 조금 더 자주 온다 (도감 채우는 재미)
  const unseen = CUSTOMERS.filter((c) => !met[c[0]])
  const pool = unseen.length && rng() < 0.35 ? unseen : CUSTOMERS
  let cust = pick(rng, pool)
  if (cust[2] === 'rare' && rng() < 0.6) cust = pick(rng, CUSTOMERS.filter((c) => !c[2])) // 희귀 손님은 가끔만
  const qty = `${show(p.b)}${unit}`
  return {
    ...p,
    icon, item, unit,
    price: show(p.a),
    qty,
    tag: `1${unit}에 ${show(p.a)}G`,
    customer: { emoji: cust[0], name: cust[1], rare: !!cust[2] },
    vip: rng() < vipChance,
    say: pick(rng, SAY)(item, qty),
    // 계산 도우미: 어떻게 풀지만 알려 준다 (자연수 곱의 값·정답은 안 보여 준다)
    helper: helperOf(p),
  }
}

function helperOf(p) {
  const a = norm(p.a)
  const b = norm(p.b)
  if (p.given) return `노트의 ${p.given}에서 소수점 아래 자리 수만 세어 봐요: ${a.p} + ${b.p} = ${a.p + b.p}자리`
  if (a.p + b.p === 0) return `${a.v} × ${b.v}를 계산해요`
  return `소수점을 잠깐 떼고 ${a.v} × ${b.v}를 계산한 뒤, 소수점 아래 자리 수를 ${a.p} + ${b.p} = ${a.p + b.p}자리로 맞춰요`
}

// 손님 기다리는 시간(초) — 넘어도 떠나지 않고, 팁만 줄어든다
export const patienceOf = (type) => (['dn2', 'nd2', 'dd2', 'mix'].includes(type) ? 90 : 60)
export function moodOf(elapsed, patience) {
  const f = elapsed / patience
  return f < 0.45 ? 'happy' : f < 1 ? 'ok' : 'grumpy'
}
export const MOOD_FACE = { happy: '😊', ok: '😐', grumpy: '😤' }

// ─── 가게 단계·꾸미기 ───
export const LEVELS = [
  { name: '노점', cost: 0, wall: ['#fde68a', '#fbbf24'], awning: null, bonus: 0 },
  { name: '작은 가게', cost: 150, wall: ['#fecaca', '#fb7185'], awning: ['#ef4444', '#fff'], bonus: 2 },
  { name: '동네 마트', cost: 400, wall: ['#bae6fd', '#38bdf8'], awning: ['#2563eb', '#fff'], bonus: 4 },
  { name: '백화점', cost: 900, wall: ['#e9d5ff', '#a855f7'], awning: ['#7c3aed', '#fde047'], bonus: 7 },
]
export const DECOR = [
  { id: 'plant', icon: '🪴', name: '화분', cost: 30 },
  { id: 'flag', icon: '🎏', name: '잉어 깃발', cost: 40 },
  { id: 'light', icon: '💡', name: '반짝 조명', cost: 50 },
  { id: 'art', icon: '🖼️', name: '그림 액자', cost: 60 },
  { id: 'music', icon: '📻', name: '라디오', cost: 70 },
  { id: 'cat', icon: '🐈', name: '고양이 점원', cost: 80 },
  { id: 'fish', icon: '🐠', name: '어항', cost: 90 },
  { id: 'rainbow', icon: '🌈', name: '무지개 간판', cost: 120 },
  { id: 'trophy', icon: '🏆', name: '황금 트로피', cost: 200, need: 2 },
  { id: 'castle', icon: '🏰', name: '성 모형', cost: 300, need: 3 },
]

// 한 번 팔 때 받는 코인
export function coinsFor({ firstTry, mood, helper, vip, streak, level, decorCount }) {
  let c = firstTry ? 10 : 5
  if (firstTry) c += mood === 'happy' ? 5 : mood === 'ok' ? 2 : 0
  if (helper) c = Math.max(2, c - 3)
  c += Math.min(5, Math.max(0, streak - 1)) // 연속 정답
  c += LEVELS[level].bonus + decorCount // 가게가 멋질수록 손님이 더 준다
  return vip ? c * 2 : c
}

// 매출 합계 (소수 그대로 정확히 더하기)
export function addD(x, y) {
  const p = Math.max(x.p, y.p)
  return norm({ v: x.v * 10 ** (p - x.p) + y.v * 10 ** (p - y.p), p })
}

// ─── 기록 (이 기기) ───
const KEY = 'boomarble_decshop_v1'
export const emptyShop = () => ({ coins: 0, level: 0, decor: [], met: {}, days: 0, served: 0, correct: 0, bestDay: 0, sales: D(0) })
export function loadShop(who) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...emptyShop(), ...(all[who] || {}) }
  } catch {
    return emptyShop()
  }
}
export function saveShop(who, data) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    all[who] = data
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* 저장 못 해도 게임은 된다 */
  }
}
