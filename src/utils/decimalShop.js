// 소수 마을 타이쿤 — 마을 맵·가게·손님·경제 규칙 (화면과 상관없는 순수 함수)
//
// 마을 맵(8×8 칸)에 길이 나 있고, 길 옆 땅에 가게를 짓고 빈 땅에 나무·분수 같은 장식을 놓는다.
// 손님은 마을 입구에서 길을 따라 걸어와 가게 앞에 줄을 서고, 가게를 눌러 계산해서 판다.
// 돈(G)은 하나뿐: 판 값(계산 답)이 들어오고, 하루 끝 정산에서 재료비(매출 × 0.5)와 유지비를 뺀다.
// 계산 문제는 교과서 차시(5-2 4단원) 모양을 지킨다:
//   (소수)×(자연수): 1개에 2.4G 사탕 3개 → 2.4 × 3          (개수로 파는 가게)
//   (자연수)×(소수): 1kg에 6G 포도 0.7kg → 6 × 0.7          (달아서 파는 가게)
//   (소수)×(소수):   1m에 0.8G 리본 1.5m → 0.8 × 1.5
import { D, norm, show, mul, mulProblem } from './decimalGame.js'

// ─── 소수 돈 계산 (정확하게) ───
export function addD(x, y) {
  const p = Math.max(x.p, y.p)
  return norm({ v: x.v * 10 ** (p - x.p) + y.v * 10 ** (p - y.p), p })
}
export const subD = (x, y) => addD(x, { v: -y.v, p: y.p })
export const gte = (x, y) => subD(x, y).v >= 0
export const money = (d) => show(d)

const rint = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
function decV(r, lo, hi, p) {
  for (;;) {
    const v = rint(r, lo, hi)
    if (p === 0 || v % 10 !== 0) return D(v, p)
  }
}

// ─── 상품 ───
export const PRODUCTS = [
  { id: 'candy', icon: '🍬', name: '사탕', unit: '개', kind: 'count', tier: 1 },
  { id: 'balloon', icon: '🎈', name: '풍선', unit: '개', kind: 'count', tier: 1 },
  { id: 'grape', icon: '🍇', name: '포도', unit: 'kg', kind: 'measure', tier: 1 },
  { id: 'strawberry', icon: '🍓', name: '딸기', unit: 'kg', kind: 'measure', tier: 1 },
  { id: 'donut', icon: '🍩', name: '도넛', unit: '개', kind: 'count', tier: 2 },
  { id: 'juice', icon: '🧃', name: '주스', unit: '병', kind: 'count', tier: 2 },
  { id: 'ribbon', icon: '🎀', name: '리본', unit: 'm', kind: 'measure', tier: 2 },
  { id: 'yarn', icon: '🧶', name: '털실', unit: 'm', kind: 'measure', tier: 2 },
  { id: 'cupcake', icon: '🧁', name: '컵케이크', unit: '개', kind: 'count', tier: 3 },
  { id: 'potion', icon: '🧪', name: '마법 물약', unit: '병', kind: 'count', tier: 3 },
  { id: 'milk', icon: '🥛', name: '우유', unit: 'L', kind: 'measure', tier: 3 },
  { id: 'honey', icon: '🍯', name: '꿀', unit: 'L', kind: 'measure', tier: 3 },
  { id: 'ring', icon: '💍', name: '보석 반지', unit: '개', kind: 'count', tier: 4 },
  { id: 'gift', icon: '🎁', name: '선물 상자', unit: '개', kind: 'count', tier: 4 },
  { id: 'beef', icon: '🥩', name: '한우', unit: 'kg', kind: 'measure', tier: 4 },
  { id: 'cheese', icon: '🧀', name: '치즈', unit: 'kg', kind: 'measure', tier: 4 },
  // 새 지도 가게들
  { id: 'icecream', icon: '🍦', name: '아이스크림', unit: '개', kind: 'count', tier: 2 },
  { id: 'bingsu', icon: '🍧', name: '빙수', unit: '그릇', kind: 'count', tier: 2 },
  { id: 'shrimp', icon: '🦐', name: '새우', unit: 'kg', kind: 'measure', tier: 3 },
  { id: 'squid', icon: '🦑', name: '오징어', unit: 'kg', kind: 'measure', tier: 3 },
  { id: 'cocoa', icon: '☕', name: '핫초코', unit: 'L', kind: 'measure', tier: 2 },
  { id: 'yuzu', icon: '🍵', name: '유자차', unit: 'L', kind: 'measure', tier: 2 },
  { id: 'mitten', icon: '🧤', name: '털장갑', unit: '켤레', kind: 'count', tier: 3 },
  { id: 'scarf', icon: '🧣', name: '목도리', unit: '개', kind: 'count', tier: 3 },
  { id: 'popcorn', icon: '🍿', name: '팝콘', unit: '봉지', kind: 'count', tier: 3 },
  { id: 'hotdog', icon: '🌭', name: '핫도그', unit: '개', kind: 'count', tier: 3 },
  { id: 'teddy', icon: '🧸', name: '곰 인형', unit: '개', kind: 'count', tier: 4 },
  { id: 'keyring', icon: '🔑', name: '열쇠고리', unit: '개', kind: 'count', tier: 4 },
]
export const productById = (id) => PRODUCTS.find((p) => p.id === id)

// ─── 가게 (건물) ───
// color: [지붕, 왼벽, 오른벽]
export const SHOPS = [
  { id: 'candyshop', icon: '🍭', name: '사탕가게', kind: 'count', tier: 1, cost: 40, products: ['candy', 'balloon'], color: ['#f472b6', '#fbcfe8', '#f9a8d4'] },
  { id: 'fruit', icon: '🍉', name: '과일가게', kind: 'measure', tier: 1, cost: 40, products: ['grape', 'strawberry'], color: ['#4ade80', '#bbf7d0', '#86efac'] },
  { id: 'donutshop', icon: '🍩', name: '도넛가게', kind: 'count', tier: 2, cost: 120, products: ['donut', 'juice'], color: ['#fb923c', '#fed7aa', '#fdba74'] },
  { id: 'fabric', icon: '🧵', name: '리본가게', kind: 'measure', tier: 2, cost: 120, products: ['ribbon', 'yarn'], color: ['#a78bfa', '#ddd6fe', '#c4b5fd'] },
  { id: 'bakery', icon: '🥐', name: '빵집', kind: 'count', tier: 3, cost: 300, products: ['cupcake', 'potion'], color: ['#f59e0b', '#fef3c7', '#fde68a'] },
  { id: 'farm', icon: '🐄', name: '목장 가게', kind: 'measure', tier: 3, cost: 300, products: ['milk', 'honey'], color: ['#38bdf8', '#e0f2fe', '#bae6fd'] },
  { id: 'jewel', icon: '💎', name: '보석상', kind: 'count', tier: 4, cost: 700, products: ['ring', 'gift'], color: ['#6366f1', '#e0e7ff', '#c7d2fe'] },
  { id: 'deli', icon: '🥩', name: '고급 식품점', kind: 'measure', tier: 4, cost: 700, products: ['beef', 'cheese'], color: ['#ef4444', '#fee2e2', '#fecaca'] },
  // 새 지도에서만 지을 수 있는 가게 (map)
  { id: 'iceshop', icon: '🍦', name: '아이스크림 가게', kind: 'count', tier: 2, cost: 160, map: 'beach', products: ['icecream', 'bingsu'], color: ['#22d3ee', '#cffafe', '#a5f3fc'] },
  { id: 'fishmarket', icon: '🐟', name: '수산시장', kind: 'measure', tier: 3, cost: 350, map: 'beach', products: ['shrimp', 'squid'], color: ['#0ea5e9', '#e0f2fe', '#bae6fd'] },
  { id: 'cafe', icon: '☕', name: '핫초코 카페', kind: 'measure', tier: 2, cost: 200, map: 'snow', products: ['cocoa', 'yuzu'], color: ['#92400e', '#fde68a', '#fcd34d'] },
  { id: 'winterwear', icon: '🧤', name: '겨울옷 가게', kind: 'count', tier: 3, cost: 400, map: 'snow', products: ['mitten', 'scarf'], color: ['#e11d48', '#ffe4e6', '#fecdd3'] },
  { id: 'popcornshop', icon: '🍿', name: '팝콘 가게', kind: 'count', tier: 3, cost: 450, map: 'park', products: ['popcorn', 'hotdog'], color: ['#f59e0b', '#fef3c7', '#fde68a'] },
  { id: 'souvenir', icon: '🧸', name: '기념품 가게', kind: 'count', tier: 4, cost: 900, map: 'park', products: ['teddy', 'keyring'], color: ['#a855f7', '#f3e8ff', '#e9d5ff'] },
]
export const shopById = (id) => SHOPS.find((s) => s.id === id)
export const UPGRADE_COST = (shop, lv) => shop.tier * (lv === 1 ? 60 : 150) // Lv1→2, Lv2→3
export const MAX_LV = 3

// ─── 장식 ───
// theme: 어울리는 지도(보여 주는 순서용 — 어느 지도에나 놓을 수 있다)
export const DECOR = [
  { id: 'tree', icon: '🌳', name: '나무', cost: 15, pop: 0.15, theme: 'nature' },
  { id: 'mushroom', icon: '🍄', name: '버섯', cost: 15, pop: 0.12, theme: 'nature' },
  { id: 'flower', icon: '🌷', name: '꽃밭', cost: 20, pop: 0.15, theme: 'nature' },
  { id: 'pine', icon: '🌲', name: '소나무', cost: 20, pop: 0.15, theme: 'nature' },
  { id: 'sunflower', icon: '🌻', name: '해바라기', cost: 25, pop: 0.18, theme: 'nature' },
  { id: 'bench', icon: '🪑', name: '벤치', cost: 30, pop: 0.2, theme: 'town' },
  { id: 'lamp', icon: '🏮', name: '가로등', cost: 40, pop: 0.2, theme: 'town' },
  { id: 'bike', icon: '🚲', name: '자전거', cost: 40, pop: 0.22, theme: 'town' },
  { id: 'busstop', icon: '🚏', name: '버스 정류장', cost: 90, pop: 0.35, theme: 'town' },
  { id: 'fountain', icon: '⛲', name: '분수', cost: 150, pop: 0.6, theme: 'town' },
  { id: 'statue', icon: '🗿', name: '조각상', cost: 220, pop: 0.7, theme: 'town' },
  { id: 'tower', icon: '🗼', name: '전망탑', cost: 700, pop: 1.6, theme: 'town' },
  { id: 'shell', icon: '🐚', name: '조개', cost: 20, pop: 0.15, theme: 'beach' },
  { id: 'umbrella', icon: '⛱️', name: '파라솔', cost: 35, pop: 0.2, theme: 'beach' },
  { id: 'palm', icon: '🌴', name: '야자수', cost: 40, pop: 0.22, theme: 'beach' },
  { id: 'crab', icon: '🦀', name: '꽃게', cost: 50, pop: 0.25, theme: 'beach' },
  { id: 'yacht', icon: '⛵', name: '요트', cost: 160, pop: 0.6, theme: 'beach' },
  { id: 'island', icon: '🏝️', name: '작은 섬', cost: 280, pop: 0.8, theme: 'beach' },
  { id: 'snowman', icon: '⛄', name: '눈사람', cost: 30, pop: 0.2, theme: 'snow' },
  { id: 'sled', icon: '🛷', name: '썰매', cost: 60, pop: 0.25, theme: 'snow' },
  { id: 'xmastree', icon: '🎄', name: '반짝 트리', cost: 90, pop: 0.35, theme: 'snow' },
  { id: 'penguin', icon: '🐧', name: '펭귄 가족', cost: 120, pop: 0.45, theme: 'snow' },
  { id: 'snowmtn', icon: '🏔️', name: '눈 덮인 산', cost: 400, pop: 1.0, theme: 'snow' },
  { id: 'balloons', icon: '🎈', name: '풍선 아치', cost: 60, pop: 0.25, theme: 'park' },
  { id: 'teddybig', icon: '🧸', name: '큰 곰 인형', cost: 150, pop: 0.5, theme: 'park' },
  { id: 'carousel', icon: '🎠', name: '회전목마', cost: 400, pop: 1.2, theme: 'park' },
  { id: 'circus', icon: '🎪', name: '서커스 텐트', cost: 650, pop: 1.5, theme: 'park' },
  { id: 'ferris', icon: '🎡', name: '대관람차', cost: 800, pop: 2, theme: 'park' },
  { id: 'coaster', icon: '🎢', name: '롤러코스터', cost: 1200, pop: 2.6, theme: 'park' },
  { id: 'castle', icon: '🏰', name: '동화 속 성', cost: 2000, pop: 3.5, theme: 'park' },
]
export const DECOR_THEMES = [
  ['nature', '🌳 자연'], ['town', '🏙️ 거리'], ['beach', '🏖️ 바닷가'], ['snow', '❄️ 겨울'], ['park', '🎡 놀이공원'],
]
export const BIG_DECOR = new Set(['fountain', 'statue', 'tower', 'yacht', 'island', 'snowmtn', 'carousel', 'circus', 'ferris', 'coaster', 'castle'])

// ─── 장사 아이템 (사 두었다가 장사 중에 쓴다) ───
export const ITEMS = [
  { id: 'hourglass', icon: '⏳', name: '모래시계', cost: 60, desc: '장사 시계를 15초 되돌려요' },
  { id: 'megaphone', icon: '📣', name: '확성기', cost: 30, desc: '손님 3명을 바로 불러요' },
  { id: 'tipcoupon', icon: '💝', name: '팁 두 배 쿠폰', cost: 40, desc: '1분 동안 팁이 두 배' },
  { id: 'candybasket', icon: '🍬', name: '사탕 바구니', cost: 35, desc: '줄 선 손님 모두 다시 기분 좋게 (기다림이 처음부터)' },
]
export const MAX_ITEM = 5
export const itemById = (id) => ITEMS.find((x) => x.id === id)
export const decorById = (id) => DECOR.find((d) => d.id === id)

// ─── 마을 지도 (여러 장) ───
// R 길 · . 지을 수 있는 땅 · a/b 사야 쓰는 땅(시내) · ~ 바다 · I 얼음 호수 (지을 수 없는 풍경)
// 칸 이름: 시내는 'r,c', 다른 지도는 '지도:r,c' (예: 'beach:2,3')
export const MAP = [
  'bbbRbbbb',
  'b..R..bb',
  'a..R...a',
  'RRRRRRRR',
  'a..R...a',
  'aa.R..aa',
  'aaaRaaaa',
  'aaaRaaaa',
]
export const MAPS = [
  { id: 'main', icon: '🏙️', name: '시내', cost: 0, desc: '처음 마을', layout: MAP,
    colors: { land: ['#86d98f', '#7ccf86'], road: ['#d6d3d1', '#cfcac6'], locked: ['#5f9a69', '#578f61'] } },
  { id: 'beach', icon: '🏖️', name: '바닷가 마을', cost: 600, desc: '파도 소리 들리는 모래사장 마을. 아이스크림 가게와 수산시장을 지을 수 있어요.',
    layout: ['..R..~~~', '..R...~~', 'RRRRR..~', '..R.R..~', '..R.R...', 'RRRRRR..', '~~..R...', '~~~.R..~'],
    colors: { land: ['#fde68a', '#fcd97a'], road: ['#e7d3b0', '#dcc7a0'], water: ['#38bdf8', '#2fb0ee'] } },
  { id: 'snow', icon: '❄️', name: '눈꽃 마을', cost: 1500, desc: '얼음 호수가 있는 하얀 마을. 핫초코 카페와 겨울옷 가게를 지을 수 있어요.',
    layout: ['...R....', '.IIR....', '.IIR..II', '...R..II', 'RRRRRRRR', '...R....', '..IR....', '...R....'],
    colors: { land: ['#f1f5f9', '#e6edf5'], road: ['#cbd5e1', '#c3cedb'], water: ['#a5f3fc', '#99e9f4'] } },
  { id: 'park', icon: '🎡', name: '놀이공원', cost: 3000, desc: '빙글빙글 길이 도는 놀이공원. 팝콘 가게와 기념품 가게를 지을 수 있어요.',
    layout: ['........', '.RRRRRR.', '.R....R.', 'RR....RR', '.R....R.', '.R....R.', '.RRRRRR.', '....R...'],
    colors: { land: ['#fbcfe8', '#f9c2e0'], road: ['#ddd6fe', '#d3cbfb'] } },
]
export const mapById = (id) => MAPS.find((m) => m.id === id) || MAPS[0]
export const ROWS = MAP.length
export const COLS = MAP[0].length
export const ZONES = { a: { name: '마을 바깥 땅', cost: 150 }, b: { name: '북쪽 언덕', cost: 400 } }
export const tileAt = (r, c, m = 'main') => {
  const L = mapById(m).layout
  return r < 0 || c < 0 || r >= L.length || c >= L[0].length ? null : L[r][c]
}
export const isRoad = (r, c, m = 'main') => tileAt(r, c, m) === 'R'
export const key = (r, c, m = 'main') => (m === 'main' ? `${r},${c}` : `${m}:${r},${c}`)
export const mapOf = (k) => (k.includes(':') ? k.split(':')[0] : 'main')
export const parseKey = (k) => (k.includes(':') ? k.split(':')[1] : k).split(',').map(Number)
// 마을 입구 = 지도 가장자리의 길
export function entrancesOf(m = 'main') {
  const L = mapById(m).layout
  const out = []
  for (let r = 0; r < L.length; r++) for (let c = 0; c < L[0].length; c++)
    if (L[r][c] === 'R' && (r === 0 || c === 0 || r === L.length - 1 || c === L[0].length - 1)) out.push([r, c])
  return out
}
export const ENTRANCES = entrancesOf('main')
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function unlocked(town, r, c, m = 'main') {
  const t = tileAt(r, c, m)
  if (m !== 'main') return t === '.' && (town.maps || []).includes(m)
  if (t === '.') return true
  if (t === 'a' || t === 'b') return town.zones.includes(t)
  return false
}
// 길 옆 땅 = 가게를 지을 수 있는 땅
export const roadSide = (r, c, m = 'main') => DIRS.some(([dr, dc]) => isRoad(r + dr, c + dc, m))
export function frontRoad(r, c, m = 'main') {
  for (const [dr, dc] of DIRS) if (isRoad(r + dr, c + dc, m)) return [r + dr, c + dc]
  return null
}

// 길 찾기 (길 칸만 밟는다)
export function roadPath(from, to, m = 'main') {
  const seen = new Map([[key(...from), null]])
  const q = [from]
  while (q.length) {
    const cur = q.shift()
    if (cur[0] === to[0] && cur[1] === to[1]) break
    for (const [dr, dc] of DIRS) {
      const n = [cur[0] + dr, cur[1] + dc]
      if (!isRoad(...n, m) || seen.has(key(...n))) continue
      seen.set(key(...n), cur)
      q.push(n)
    }
  }
  if (!seen.has(key(...to))) return [from]
  const path = []
  for (let cur = to; cur; cur = seen.get(key(...cur))) path.unshift(cur)
  return path
}

// ─── 오늘 장사 = 교과서 차시 ───
export const LESSONS = [
  { type: 'dn1', lesson: '2차시', name: '(소수)×(자연수) · 소수 한 자리', kind: 'count', ex: '1개에 2.4G 사탕 3개' },
  { type: 'dn2', lesson: '3차시', name: '(소수)×(자연수) · 소수 두 자리', kind: 'count', ex: '1개에 1.25G 풍선 4개' },
  { type: 'nd1', lesson: '4차시', name: '(자연수)×(소수) · 소수 한 자리', kind: 'measure', ex: '1kg에 6G 포도 0.7kg' },
  { type: 'nd2', lesson: '5차시', name: '(자연수)×(소수) · 소수 두 자리', kind: 'measure', ex: '1kg에 8G 딸기 1.25kg' },
  { type: 'dd1', lesson: '6차시', name: '(소수)×(소수) · 소수 한 자리', kind: 'measure', ex: '1kg에 2.4G 포도 1.5kg' },
  { type: 'dd2', lesson: '7차시', name: '(소수)×(소수) · 소수 두 자리', kind: 'measure', ex: '1kg에 1.25G 딸기 0.8kg' },
  { type: 'shift', lesson: '8차시', name: '곱의 소수점 위치', kind: 'any', ex: '1개에 0.35G 사탕 100개 묶음' },
  { type: 'mix', lesson: '단원 정리', name: '모든 유형 섞어서', kind: 'any', ex: '모든 가게가 문을 열어요' },
]
const TWO_PLACE = ['dn2', 'nd2', 'dd2', 'mix']
const TYPES_FOR = { count: ['dn1', 'dn2', 'shift'], measure: ['nd1', 'nd2', 'dd1', 'dd2', 'shift'] }

// 상품 등급별 가격 범위 — 소수 자리 수(p)는 차시가, 크기는 등급이 정한다
const PRICE_V = {
  0: { 1: [2, 9], 2: [6, 19], 3: [12, 39], 4: [25, 79] },
  1: { 1: [11, 59], 2: [21, 129], 3: [51, 299], 4: [101, 599] },
  2: { 1: [101, 599], 2: [301, 1299], 3: [601, 2999], 4: [1201, 5999] },
}
const priceOf = (r, p, tier) => decV(r, ...PRICE_V[p][tier], p)
export function pricePlaces(type, kind) {
  if (type === 'dn1' || type === 'dd1') return 1
  if (type === 'dn2' || type === 'dd2') return 2
  if (type === 'nd1' || type === 'nd2') return 0
  return kind === 'count' ? 1 : 0
}

// 마을의 가게 목록 [{ key, r, c, shop, lv }]
export function shopsIn(town) {
  return Object.entries(town.built)
    .filter(([, b]) => b.kind === 'shop')
    .map(([k, b]) => {
      const [r, c] = parseKey(k)
      return { key: k, map: mapOf(k), r, c, shop: shopById(b.id), lv: b.lv || 1 }
    })
}
// 오늘 문을 여는 가게 (차시가 개수/무게 중 무엇인지에 맞춰)
export const openShops = (lesson, town) => shopsIn(town).filter((s) => lesson.kind === 'any' || s.shop.kind === lesson.kind)

// 오늘의 가격표 — 같은 날 같은 상품은 같은 가격
export function todaysPrices(type, productIds, rng = Math.random) {
  const out = {}
  for (const id of productIds) {
    const pr = productById(id)
    out[id] = priceOf(rng, pricePlaces(type, pr.kind), pr.tier)
  }
  return out
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

function qtyOf(r, type, vip) {
  if (type === 'dn1' || type === 'dn2') return D(vip ? rint(r, 11, 25) : rint(r, 2, 9), 0)
  if (type === 'nd2') return decV(r, vip ? 101 : 11, vip ? 999 : 499, 2)
  return decV(r, vip ? 21 : 1, vip ? 99 : 49, 1) // nd1·dd1·dd2(가격이 두 자리면 양은 한 자리)
}

// 곱의 소수점 위치(8차시): 묶음(×10, ×100) / 맛보기(×0.1, ×0.01)
function shiftOrder(r, pr) {
  const k = rint(r, 1, 2)
  if (pr.kind === 'count') {
    const a = priceOf(r, rint(r, 1, 2), Math.min(pr.tier, 2))
    const b = D(10 ** k, 0)
    const ans = norm(mul(a, b))
    return { a, b, answer: ans, steps: [`${show(b)}을 곱하면 소수점이 오른쪽으로 ${k}칸 옮겨 가요`, `${show(a)} → ${show(ans)}`] }
  }
  const a = priceOf(r, 0, Math.min(4, pr.tier + 1))
  const b = D(1, k)
  const ans = norm(mul(a, b))
  return { a, b, answer: ans, steps: [`${show(b)}을 곱하면 소수점이 왼쪽으로 ${k}칸 옮겨 가요`, `${show(a)} → ${show(ans)}`] }
}

function helperOf(a, b, type) {
  if (type === 'shift') return `${show(b)}을 곱하면 소수점이 몇 칸, 어느 쪽으로 옮겨 갈까요?`
  return `소수점을 잠깐 떼고 ${a.v} × ${b.v}를 계산한 뒤, 소수점 아래 자리 수를 ${a.p} + ${b.p} = ${a.p + b.p}자리로 맞춰요`
}

let uid = 0
// 손님 한 명 = 가게 하나에서 사는 주문 + 계산 문제
// 같은 식이 다시 나오지 않게 — 오늘 이미 낸 식(recent: Set of '가격×양')과 겹치면 다시 만든다
export const orderKey = (c) => `${c.price}×${show(c.b)}`
export function makeFreshCustomer(lesson, shop, prices, opts = {}) {
  const recent = opts.recent || new Set()
  let c
  for (let i = 0; i < 60; i++) {
    c = makeCustomer(lesson, shop, prices, opts)
    if (!recent.has(orderKey(c))) break
  }
  return c
}

export function makeCustomer(lesson, shop, prices, { rng = Math.random, vipChance = 0.1, met = {} } = {}) {
  const pr = productById(pick(rng, shop.products))
  const type = lesson.type === 'mix' ? pick(rng, TYPES_FOR[pr.kind]) : lesson.type
  const vip = rng() < vipChance
  let a
  let b
  let answer
  let steps
  if (type === 'shift') {
    ;({ a, b, answer, steps } = shiftOrder(rng, pr))
  } else {
    a = lesson.type === 'mix' || !prices[pr.id] ? priceOf(rng, pricePlaces(type, pr.kind), pr.tier) : prices[pr.id]
    b = qtyOf(rng, type, vip)
    ;({ answer, steps } = mulProblem(type, a, b))
  }
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

// ─── 마을 인기 · 하루 규칙 ───
export const ADS = [
  { cost: 0 },
  { cost: 50, name: '전단지', icon: '📄', desc: '손님이 더 빨리 와요 → 기록 단축' },
  { cost: 180, name: '라디오 광고', icon: '📻', desc: '손님이 더 빨리 오고, VIP 손님이 더 자주' },
]
// 인기 ★(1~5): 장식과 가게 레벨이 올린다 → 손님이 더 많이 오고, 더 오래 기다리고, VIP가 자주
export function popularityOf(town) {
  let p = 1
  for (const b of Object.values(town.built)) {
    if (b.kind === 'decor') p += decorById(b.id).pop
    else p += ((b.lv || 1) - 1) * 0.3
  }
  return Math.min(5, p)
}
// 가게 유지비 (하루) = 등급 × 레벨
export const upkeepOf = (town) => shopsIn(town).reduce((s, x) => s + x.shop.tier * x.lv, 0)

// ─── 타임 어택 ───
// 하루 = 손님 30명(계산 30문제)을 받으면 끝. 시계가 돌고, 틀리면 +5초, 손님을 놓치면 +10초.
// 10명·20명째에 러시 타임(1분 동안 손님이 두 배 빨리 오고 팁 두 배).
export const GOAL = 30
export const PENALTY = { wrong: 5, lost: 10 }
export const RUSH_AT = [10, 20]
export const RUSH_MS = 60 * 1000
// 별 기준 (초) — [★★★, ★★] 안에 끝내면. 그보다 늦어도 끝까지 하면 ★
export function starTimes(lesson, relaxed) {
  const base = TWO_PLACE.includes(lesson.type) ? [14 * 60, 20 * 60] : [9 * 60, 13 * 60]
  return relaxed ? base.map((x) => x * 1.5) : base
}
export const starsFor = (secs, times) => (secs <= times[0] ? 3 : secs <= times[1] ? 2 : 1)
export const clock = (secs) => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`

export function dayRules(lesson, town, relaxed) {
  const two = TWO_PLACE.includes(lesson.type)
  const pop = popularityOf(town)
  const open = openShops(lesson, town).length
  let patience = (two ? 100 : 70) * (1 + (pop - 1) * 0.08)
  let gap = ((two ? 10 : 6) * 0.85 ** town.ads) / Math.max(1, Math.sqrt(open) * 0.8)
  if (relaxed) {
    patience *= 2
    gap *= 1.5
  }
  return {
    patience, // 손님이 기다리는 초
    gap, // 새 손님 간격(초) — 러시 타임엔 절반
    goal: GOAL,
    stars: starTimes(lesson, relaxed),
    vipChance: 0.05 + pop * 0.025 + (town.ads >= 2 ? 0.05 : 0),
    upkeep: D(upkeepOf(town)),
  }
}
export const slotsOf = (lv) => 1 + lv // 가게 앞 줄 칸

export function moodOf(waited, patience) {
  const f = waited / patience
  return f < 0.4 ? 'happy' : f < 0.75 ? 'ok' : 'grumpy'
}
export const MOOD_FACE = { happy: '😊', ok: '😐', grumpy: '😤' }

export function tipFor({ firstTry, mood, vip, streak, lv = 1 }) {
  if (!firstTry) return 0
  let t = mood === 'happy' ? 2 : mood === 'ok' ? 1 : 0
  t += Math.min(3, Math.floor(streak / 3))
  t += lv - 1
  if (vip) t += 5
  return t
}

// 정산 — 재료비 = 매출 × 0.5 (소수의 곱셈!), 가게 유지비
export const COST_RATE = D(5, 1)
export function settle({ sales, tips, upkeep }) {
  const material = norm(mul(sales, COST_RATE))
  const profit = subD(addD(sales, tips), addD(material, upkeep))
  return { sales, tips, material, upkeep, profit }
}

// ─── 목표 ───
const countShops = (s) => shopsIn(s).length
const countDecor = (s) => Object.values(s.built).filter((b) => b.kind === 'decor').length
export const QUESTS = [
  { id: 'first', text: '첫 장사 마치기', reward: 10, done: (s) => s.days >= 1 },
  { id: 'tree', text: '마을에 장식 하나 놓기', reward: 15, done: (s) => countDecor(s) >= 1 },
  { id: 'profit30', text: '하루 이익 30G 넘기기', reward: 20, done: (s) => gte(s.bestProfit, D(30)) },
  { id: 'shop3', text: '가게 3곳 운영하기', reward: 30, done: (s) => countShops(s) >= 3 },
  { id: 'streak5', text: '한 번에 5명 연속으로 맞히기', reward: 30, done: (s) => s.bestStreak >= 5 },
  { id: 'lv2', text: '가게 하나를 Lv.2로 올리기', reward: 40, done: (s) => shopsIn(s).some((x) => x.lv >= 2) },
  { id: 'book10', text: '손님 도감 10종 채우기', reward: 50, done: (s) => Object.keys(s.met).length >= 10 },
  { id: 'land', text: '땅 넓히기', reward: 50, done: (s) => s.zones.length >= 1 },
  { id: 'profit100', text: '하루 이익 100G 넘기기', reward: 60, done: (s) => gte(s.bestProfit, D(100)) },
  { id: 'fountain', text: '분수 짓기', reward: 60, done: (s) => Object.values(s.built).some((b) => b.id === 'fountain') },
  { id: 'tier3', text: '3등급 가게 짓기', reward: 80, done: (s) => shopsIn(s).some((x) => x.shop.tier >= 3) },
  { id: 'earn1000', text: '총 매출 1000G', reward: 100, done: (s) => gte(s.totalSales, D(1000)) },
  { id: 'pop4', text: '마을 인기 ★4 만들기', reward: 120, done: (s) => popularityOf(s) >= 4 },
  { id: 'tier4', text: '4등급 가게 짓기', reward: 150, done: (s) => shopsIn(s).some((x) => x.shop.tier >= 4) },
  { id: 'all', text: '시내 가게 8곳 모두 짓기', reward: 300, done: (s) => shopsIn(s).filter((x) => !x.shop.map).length >= 8 },
  { id: 'all14', text: '가게 14곳 모두 짓기', reward: 800, done: (s) => countShops(s) >= SHOPS.length },
  { id: 'map1', text: '새 지도 열기', reward: 100, done: (s) => (s.maps || []).length >= 1 },
  { id: 'map3', text: '지도 세 곳 모두 열기', reward: 500, done: (s) => (s.maps || []).length >= 3 },
  { id: 'item1', text: '장사 아이템 써 보기', reward: 20, done: (s) => (s.itemsUsed || 0) >= 1 },
  { id: 'star3', text: '아무 차시나 ★★★ 기록 내기', reward: 80, done: (s) => Object.values(s.records || {}).some((r) => r.stars >= 3) },
  { id: 'star3x4', text: '네 차시에서 ★★★ 기록 내기', reward: 200, done: (s) => Object.values(s.records || {}).filter((r) => r.stars >= 3).length >= 4 },
]
export const TITLES = [
  [0, '꼬마 사장'], [200, '골목 사장님'], [600, '동네 사장님'], [1500, '시장 상인회장'], [4000, '마을 이장님'], [10000, '소수 마을 재벌'],
]
export function titleOf(totalSales) {
  const n = Number(show(totalSales))
  let t = TITLES[0][1]
  for (const [lim, name] of TITLES) if (n >= lim) t = name
  return t
}

// ─── 기록 (이 기기) ───
const KEY = 'boomarble_town_v1'
export const emptyTown = () => ({
  money: D(30),
  built: { '2,2': { kind: 'shop', id: 'candyshop', lv: 1 }, '2,4': { kind: 'shop', id: 'fruit', lv: 1 } },
  zones: [], ads: 0, met: {},
  days: 0, served: 0, lost: 0, bestStreak: 0, bestProfit: D(0), totalSales: D(0), claimed: [],
  records: {}, // 차시별 최고 기록 { [type]: { secs, stars } }
  maps: [], // 산 지도 ('beach', 'snow', 'park')
  items: {}, // 장사 아이템 { [id]: 개수 }
})
export function loadTown(who) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...emptyTown(), ...(all[who] || {}) }
  } catch {
    return emptyTown()
  }
}
export function saveTown(who, data) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}')
    all[who] = data
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* 저장 못 해도 게임은 된다 */
  }
}
