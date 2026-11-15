// 소수 가게 타이쿤 — 경제·손님·투자 규칙 (화면과 상관없는 순수 함수)
//
// 돈(G)은 하나뿐이다. 손님에게 판 돈(계산 답)이 그대로 들어오고, 하루가 끝나면
// 재료비(매출 × 0.5)와 임대료를 빼서 이익을 남긴다. 번 돈으로 상품·직원·광고·가게를 늘린다.
// 계산 문제는 교과서 차시(5-2 4단원) 모양을 지킨다:
//   (소수)×(자연수): 1개에 2.4G 물약 3병 → 2.4 × 3
//   (자연수)×(소수): 1kg에 6G 치즈 0.7kg → 6 × 0.7
//   (소수)×(소수):   1m에 0.8G 리본 1.5m → 0.8 × 1.5
// 비싼 상품(높은 등급)일수록 가격이 커져서 계산도 조금씩 커진다 = 가게가 클수록 큰 장사.
import { D, norm, show, mul, mulProblem } from './decimalGame.js'

// ─── 소수 돈 계산 (정확하게) ───
export function addD(x, y) {
  const p = Math.max(x.p, y.p)
  return norm({ v: x.v * 10 ** (p - x.p) + y.v * 10 ** (p - y.p), p })
}
export const subD = (x, y) => addD(x, { v: -y.v, p: y.p })
export const gte = (x, y) => subD(x, y).v >= 0
export const money = (d) => show(d)

// ─── 난수 ───
const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
function decV(r, lo, hi, p) {
  for (;;) {
    const v = rint(r, lo, hi)
    if (p === 0 || v % 10 !== 0) return D(v, p)
  }
}

// ─── 상품 ───
// kind: count(개수로 팖) | measure(무게·길이·들이로 팖) · tier: 1~4 (높을수록 비싸다)
export const PRODUCTS = [
  { id: 'candy', icon: '🍬', name: '사탕', unit: '개', kind: 'count', tier: 1 },
  { id: 'balloon', icon: '🎈', name: '풍선', unit: '개', kind: 'count', tier: 1 },
  { id: 'grape', icon: '🍇', name: '포도', unit: 'kg', kind: 'measure', tier: 1 },
  { id: 'ribbon', icon: '🎀', name: '리본', unit: 'm', kind: 'measure', tier: 1 },
  { id: 'juice', icon: '🧃', name: '주스', unit: '병', kind: 'count', tier: 2 },
  { id: 'strawberry', icon: '🍓', name: '딸기', unit: 'kg', kind: 'measure', tier: 2 },
  { id: 'donut', icon: '🍩', name: '도넛', unit: '개', kind: 'count', tier: 2 },
  { id: 'milk', icon: '🥛', name: '우유', unit: 'L', kind: 'measure', tier: 2 },
  { id: 'cupcake', icon: '🧁', name: '컵케이크', unit: '개', kind: 'count', tier: 3 },
  { id: 'cheese', icon: '🧀', name: '치즈', unit: 'kg', kind: 'measure', tier: 3 },
  { id: 'potion', icon: '🧪', name: '마법 물약', unit: '병', kind: 'count', tier: 3 },
  { id: 'honey', icon: '🍯', name: '꿀', unit: 'L', kind: 'measure', tier: 3 },
  { id: 'gift', icon: '🎁', name: '선물 상자', unit: '개', kind: 'count', tier: 4 },
  { id: 'silk', icon: '🧵', name: '비단', unit: 'm', kind: 'measure', tier: 4 },
  { id: 'ring', icon: '💍', name: '보석 반지', unit: '개', kind: 'count', tier: 4 },
  { id: 'beef', icon: '🥩', name: '한우', unit: 'kg', kind: 'measure', tier: 4 },
]
export const productById = (id) => PRODUCTS.find((p) => p.id === id)
export const START_PRODUCTS = PRODUCTS.filter((p) => p.tier === 1).map((p) => p.id)
export const PRODUCT_COST = { 1: 0, 2: 60, 3: 200, 4: 600 }

// ─── 오늘 장사 = 교과서 차시 ───
export const LESSONS = [
  { type: 'dn1', lesson: '2차시', name: '(소수)×(자연수) · 소수 한 자리', kind: 'count', ex: '1개에 2.4G 풍선 3개' },
  { type: 'dn2', lesson: '3차시', name: '(소수)×(자연수) · 소수 두 자리', kind: 'count', ex: '1개에 1.25G 사탕 4개' },
  { type: 'nd1', lesson: '4차시', name: '(자연수)×(소수) · 소수 한 자리', kind: 'measure', ex: '1kg에 6G 포도 0.7kg' },
  { type: 'nd2', lesson: '5차시', name: '(자연수)×(소수) · 소수 두 자리', kind: 'measure', ex: '1m에 8G 리본 1.25m' },
  { type: 'dd1', lesson: '6차시', name: '(소수)×(소수) · 소수 한 자리', kind: 'measure', ex: '1kg에 2.4G 포도 1.5kg' },
  { type: 'dd2', lesson: '7차시', name: '(소수)×(소수) · 소수 두 자리', kind: 'measure', ex: '1L에 1.25G 우유 0.8L' },
  { type: 'shift', lesson: '8차시', name: '곱의 소수점 위치', kind: 'any', ex: '1개에 0.35G 사탕 100개 묶음' },
  { type: 'mix', lesson: '단원 정리', name: '모든 유형 섞어서', kind: 'any', ex: '여러 손님이 섞여서 와요' },
]
const TWO_PLACE = ['dn2', 'nd2', 'dd2', 'mix']

// 상품 등급별 가격 범위 — 소수 자리 수(p)는 차시가 정하고, 크기는 등급이 정한다
const PRICE_V = {
  0: { 1: [2, 9], 2: [6, 19], 3: [12, 39], 4: [25, 79] }, // 자연수 가격
  1: { 1: [11, 59], 2: [21, 129], 3: [51, 299], 4: [101, 599] }, // 2.4G (소수 한 자리)
  2: { 1: [101, 599], 2: [301, 1299], 3: [601, 2999], 4: [1201, 5999] }, // 1.25G (소수 두 자리)
}
const priceOf = (r, p, tier) => decV(r, ...PRICE_V[p][tier], p)

// 오늘의 가격표 — 상품마다 하루 동안 같은 가격 (차시 모양에 맞춰)
// 섞어서/소수점 위치 차시는 주문마다 모양이 달라서 그때그때 정한다.
export function pricePlaces(type, kind) {
  if (type === 'dn1' || type === 'dd1') return 1
  if (type === 'dn2' || type === 'dd2') return 2
  if (type === 'nd1' || type === 'nd2') return 0
  return kind === 'count' ? 1 : 0
}
export function todaysPrices(type, productIds, rng = Math.random) {
  const out = {}
  for (const id of productIds) {
    const pr = productById(id)
    out[id] = priceOf(rng, pricePlaces(type, pr.kind), pr.tier)
  }
  return out
}

// 오늘 팔 수 있는 상품 (차시가 개수/무게 중 무엇인지에 맞춰)
export function shelfFor(lesson, owned) {
  return owned.map(productById).filter((p) => lesson.kind === 'any' || p.kind === lesson.kind)
}

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

// 손님이 사 가는 양 — 차시 모양 그대로 (VIP는 많이 산다)
function qtyOf(r, type, kind, vip) {
  if (type === 'dn1' || type === 'dn2') return D(vip ? rint(r, 11, 25) : rint(r, 2, 9), 0)
  if (type === 'nd1' || type === 'dd1') return decV(r, vip ? 21 : 1, vip ? 99 : 49, 1)
  if (type === 'nd2') return decV(r, vip ? 101 : 11, vip ? 999 : 499, 2)
  // dd2: 가격이 두 자리면 양은 한 자리
  return decV(r, vip ? 21 : 1, vip ? 99 : 49, 1)
}

// 곱의 소수점 위치(8차시): 묶음(×10, ×100) / 맛보기(×0.1, ×0.01)
function shiftOrder(r, pr, tier) {
  const k = rint(r, 1, 2)
  if (pr.kind === 'count') {
    const a = priceOf(r, rint(r, 1, 2), Math.min(tier, 2))
    const b = D(10 ** k, 0)
    const ans = norm(mul(a, b))
    return { a, b, answer: ans, steps: [`${show(b)}을 곱하면 소수점이 오른쪽으로 ${k}칸 옮겨 가요`, `${show(a)} → ${show(ans)}`] }
  }
  const a = priceOf(r, 0, tier + 1 > 4 ? 4 : tier + 1)
  const b = D(1, k)
  const ans = norm(mul(a, b))
  return { a, b, answer: ans, steps: [`${show(b)}을 곱하면 소수점이 왼쪽으로 ${k}칸 옮겨 가요`, `${show(a)} → ${show(ans)}`] }
}

let uid = 0
// 손님 한 명 = 주문 + 계산 문제
export function makeCustomer(lesson, shelf, prices, { rng = Math.random, vipChance = 0.1, met = {} } = {}) {
  const type = lesson.type === 'mix' ? pick(rng, ['dn1', 'dn2', 'nd1', 'nd2', 'dd1', 'dd2', 'shift']) : lesson.type
  const kindNeed = type === 'shift' ? null : ['dn1', 'dn2'].includes(type) ? 'count' : 'measure'
  const choices = shelf.filter((p) => !kindNeed || p.kind === kindNeed)
  const pr = pick(rng, choices.length ? choices : shelf)
  const vip = rng() < vipChance
  let a
  let b
  let answer
  let steps
  if (type === 'shift') {
    ;({ a, b, answer, steps } = shiftOrder(rng, pr, pr.tier))
  } else {
    a = lesson.type === 'mix' ? priceOf(rng, pricePlaces(type, pr.kind), pr.tier) : prices[pr.id]
    b = qtyOf(rng, type, pr.kind, vip)
    ;({ answer, steps } = mulProblem(type, a, b))
  }
  // 아직 못 만난 손님이 조금 더 자주 (도감 채우는 재미), 희귀 손님은 가끔만
  const unseen = CUSTOMERS.filter((c) => !met[c[0]])
  let cust = pick(rng, unseen.length && rng() < 0.35 ? unseen : CUSTOMERS)
  if (cust[2] && rng() < 0.6) cust = pick(rng, CUSTOMERS.filter((c) => !c[2]))
  const qty = `${show(b)}${pr.unit}`
  uid += 1
  return {
    id: `${Date.now()}-${uid}`,
    type,
    product: pr.id,
    icon: pr.icon,
    item: pr.name,
    unit: pr.unit,
    a: norm(a),
    b: norm(b),
    price: show(a),
    qty,
    tag: `1${pr.unit}에 ${show(a)}G`,
    answer,
    steps,
    helper: helperOf(norm(a), norm(b), type),
    customer: { emoji: cust[0], name: cust[1], rare: !!cust[2] },
    vip,
    say: (vip ? '👑 ' : '') + pick(rng, SAY)(pr.name, qty),
  }
}

function helperOf(a, b, type) {
  if (type === 'shift') return `${show(b)}을 곱하면 소수점이 몇 칸, 어느 쪽으로 옮겨 갈까요?`
  return `소수점을 잠깐 떼고 ${a.v} × ${b.v}를 계산한 뒤, 소수점 아래 자리 수를 ${a.p} + ${b.p} = ${a.p + b.p}자리로 맞춰요`
}

// ─── 손님 줄 · 하루 ───
export const LEVELS = [
  { name: '노점', cost: 0, slots: 3, perDay: 8, rent: 0, wall: ['#fde68a', '#fbbf24'], awning: null },
  { name: '작은 가게', cost: 150, slots: 4, perDay: 10, rent: 5, wall: ['#fecaca', '#fb7185'], awning: ['#ef4444', '#fff'] },
  { name: '동네 마트', cost: 500, slots: 4, perDay: 12, rent: 15, wall: ['#bae6fd', '#38bdf8'], awning: ['#2563eb', '#fff'] },
  { name: '백화점', cost: 1500, slots: 5, perDay: 14, rent: 40, wall: ['#e9d5ff', '#a855f7'], awning: ['#7c3aed', '#fde047'] },
]
export const STAFF = [
  { cost: 0 },
  { cost: 80, name: '알바생', icon: '🧑‍💼', desc: '줄 선 손님과 이야기해서 손님이 1.5배 오래 기다려요' },
  { cost: 250, name: '매니저', icon: '👩‍💼', desc: '손님마다 팁 +1G, 계산 도우미가 공짜' },
]
export const ADS = [
  { cost: 0 },
  { cost: 50, name: '전단지', icon: '📄', desc: '하루 손님 +2명' },
  { cost: 180, name: '라디오 광고', icon: '📻', desc: '하루 손님 +2명 더, VIP 손님이 더 자주' },
]
export const DECOR = [
  { id: 'plant', icon: '🪴', name: '화분', cost: 30 },
  { id: 'flag', icon: '🎏', name: '잉어 깃발', cost: 40 },
  { id: 'light', icon: '💡', name: '반짝 조명', cost: 60 },
  { id: 'art', icon: '🖼️', name: '그림 액자', cost: 80 },
  { id: 'cat', icon: '🐈', name: '고양이 점원', cost: 100 },
  { id: 'fish', icon: '🐠', name: '어항', cost: 120 },
  { id: 'rainbow', icon: '🌈', name: '무지개 간판', cost: 160 },
  { id: 'trophy', icon: '🏆', name: '황금 트로피', cost: 300, need: 2 },
  { id: 'castle', icon: '🏰', name: '성 모형', cost: 500, need: 3 },
]
// 평판(별 1~5) — 꾸미기·가게 단계가 올린다. 평판이 높으면 VIP가 더 자주 오고 손님이 조금 더 기다린다
export const reputationOf = (s) => Math.min(5, 1 + s.level * 0.75 + s.decor.length * 0.35)

export function dayRules(lesson, s, relaxed) {
  const lv = LEVELS[s.level]
  const two = TWO_PLACE.includes(lesson.type)
  const rep = reputationOf(s)
  let patience = (two ? 160 : 110) * (1 + (rep - 1) * 0.05)
  if (s.staff >= 1) patience *= 1.5
  let gap = two ? 30 : 20
  if (relaxed) {
    patience *= 2
    gap *= 1.5
  }
  return {
    patience, // 손님이 기다리는 초
    gap, // 새 손님이 오는 간격(초)
    slots: lv.slots,
    perDay: lv.perDay + (s.ads >= 1 ? 2 : 0) + (s.ads >= 2 ? 2 : 0),
    vipChance: 0.06 + rep * 0.02 + (s.ads >= 2 ? 0.05 : 0),
    rent: D(lv.rent),
  }
}

export function moodOf(waited, patience) {
  const f = waited / patience
  return f < 0.4 ? 'happy' : f < 0.75 ? 'ok' : 'grumpy'
}
export const MOOD_FACE = { happy: '😊', ok: '😐', grumpy: '😤' }

// 팁 (자연수 G) — 한 번에 맞히고 빨리 받을수록, VIP·매니저·연속 정답이면 더
export function tipFor({ firstTry, mood, vip, streak, staff }) {
  if (!firstTry) return 0
  let t = mood === 'happy' ? 2 : mood === 'ok' ? 1 : 0
  t += Math.min(3, Math.floor(streak / 3))
  if (staff >= 2) t += 1
  if (vip) t += 5
  return t
}

// 하루 정산 — 재료비 = 매출 × 0.5 (소수의 곱셈!), 임대료는 가게 크기만큼
export const COST_RATE = D(5, 1)
export function settle({ sales, tips, rent }) {
  const material = norm(mul(sales, COST_RATE))
  const profit = subD(addD(sales, tips), addD(material, rent))
  return { sales, tips, material, rent, profit }
}

// ─── 목표(퀘스트) ───
export const QUESTS = [
  { id: 'first', text: '첫 장사 마치기', reward: 10, done: (s) => s.days >= 1 },
  { id: 'profit30', text: '하루 이익 30G 넘기기', reward: 20, done: (s) => gte(s.bestProfit, D(30)) },
  { id: 'tier2', text: '2등급 상품 들여오기', reward: 30, done: (s) => s.products.some((id) => productById(id).tier >= 2) },
  { id: 'staff', text: '알바생 뽑기', reward: 30, done: (s) => s.staff >= 1 },
  { id: 'streak5', text: '한 번에 5명 연속으로 맞히기', reward: 30, done: (s) => s.bestStreak >= 5 },
  { id: 'shop1', text: '작은 가게로 넓히기', reward: 50, done: (s) => s.level >= 1 },
  { id: 'book10', text: '손님 도감 10종 채우기', reward: 50, done: (s) => Object.keys(s.met).length >= 10 },
  { id: 'profit100', text: '하루 이익 100G 넘기기', reward: 60, done: (s) => gte(s.bestProfit, D(100)) },
  { id: 'tier3', text: '3등급 상품 들여오기', reward: 60, done: (s) => s.products.some((id) => productById(id).tier >= 3) },
  { id: 'shop2', text: '동네 마트로 넓히기', reward: 100, done: (s) => s.level >= 2 },
  { id: 'earn1000', text: '총 매출 1000G', reward: 100, done: (s) => gte(s.totalSales, D(1000)) },
  { id: 'tier4', text: '4등급(명품) 상품 들여오기', reward: 150, done: (s) => s.products.some((id) => productById(id).tier >= 4) },
  { id: 'shop3', text: '백화점 사장 되기', reward: 300, done: (s) => s.level >= 3 },
]
export const TITLES = [
  [0, '꼬마 사장'], [200, '노점 달인'], [600, '동네 사장님'], [1500, '마트 사장님'], [4000, '백화점 회장님'], [10000, '소수 재벌'],
]
export function titleOf(totalSales) {
  const n = Number(show(totalSales))
  let t = TITLES[0][1]
  for (const [lim, name] of TITLES) if (n >= lim) t = name
  return t
}

// ─── 기록 (이 기기) ───
const KEY = 'boomarble_tycoon_v1'
export const emptyShop = () => ({
  money: D(20), level: 0, staff: 0, ads: 0, decor: [], products: [...START_PRODUCTS], met: {},
  days: 0, served: 0, lost: 0, bestStreak: 0, bestProfit: D(0), totalSales: D(0), claimed: [],
})
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
