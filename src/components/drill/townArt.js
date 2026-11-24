// 소수 마을 그림 — Kenney 'Isometric Landscape'·'Isometric Buildings' 타일 (CC0, 무료·출처 표시 없이 써도 됨)
// 원본 파일: public/kenney/ (라이선스 파일 함께). 원본 타일 너비 132px → 지도 칸 너비(TW)에 맞춰 줄인다.

export const ART_BASE = '/kenney/'
const land = (n) => `${ART_BASE}landscapeTiles_${String(n).padStart(3, '0')}.png`
const bld = (n) => `${ART_BASE}buildingTiles_${String(n).padStart(3, '0')}.png`

// 원본 크기(픽셀) — 땅 타일은 132×99(위 마름모 132×66 + 두께 33), 물은 132×83
export const SRC_W = 132
export const GROUND_H = 99
export const BUILDING_H = 127 // 1층 건물(밑받침 포함)
export const FLOOR_STEP = 32 // 위층 하나 올릴 때 높이
export const UPPER_X = 16 // 위층·지붕은 몸통 너비(99)라 가운데로

export const GROUND = {
  grass: { src: land(67), h: 99 },
  sand: { src: land(59), h: 99 },
  water: { src: land(66), h: 83 },
  asphalt: { src: land(81), h: 99 },
}

// 길 — 이어진 방향(지도에서 위·오른쪽·아래·왼쪽 = 화면에서 ↗ ↘ ↙ ↖)에 맞는 타일
// 열쇠: NE(r-1) SE(c+1) SW(r+1) NW(c-1) 순서의 1/0
const ROAD = {
  1111: 90,
  '0111': 97, 1011: 89, 1101: 104, 1110: 96, // 세 갈래
  1010: 82, '0101': 74, // 곧은 길
  1100: 118, '0110': 114, '0011': 119, 1001: 122, // 꺾인 길
  1000: 117, '0100': 105, '0010': 111, '0001': 112, // 막다른 길
  '0000': 81,
}
export const roadSrc = (ne, se, sw, nw) => land(ROAD[`${+ne}${+se}${+sw}${+nw}`] ?? 81)

// 가게마다 1층 가게 건물 · 위층 · 지붕 (Lv가 오르면 위층이 올라간다)
const SHOP_ART = {
  candyshop: [115, 52, 82],
  fruit: [100, 44, 62],
  donutshop: [99, 47, 65],
  fabric: [34, 53, 89],
  bakery: [113, 49, 70],
  farm: [108, 43, 62],
  jewel: [116, 55, 89],
  deli: [107, 45, 69],
  iceshop: [40, 50, 74],
  fishmarket: [9, 56, 81],
  cafe: [18, 47, 65],
  winterwear: [4, 54, 83],
  popcornshop: [12, 51, 69],
  souvenir: [117, 48, 82],
  flowershop: [20, 53, 82],
  juicebar: [26, 51, 65],
  stationery: [14, 43, 62],
  ricestore: [22, 44, 70],
  pizzeria: [92, 52, 69],
  chocolatier: [101, 47, 62],
  toyshop: [41, 54, 74],
  artshop: [106, 55, 81],
}
export function shopArt(id, lv = 1) {
  const [base, floor, roof] = SHOP_ART[id] || SHOP_ART.candyshop
  // Lv1: 가게 + 지붕 · Lv2~4: 위층 1~3 · Lv5: 위층 3 + 금빛 지붕(명물 가게)
  return { base: bld(base), floors: Array.from({ length: Math.min(3, Math.max(0, lv - 1)) }, () => bld(floor)), roof: bld(roof), gold: lv >= 5 }
}

// 지도마다 땅 색 (같은 풀 타일에 색 필터)
export const MAP_FILTER = {
  main: { land: null, locked: 'brightness(0.72) saturate(0.8)' },
  beach: { land: null },
  snow: { land: 'saturate(0) brightness(1.55)', water: 'saturate(0.35) brightness(1.25)' },
  park: { land: 'hue-rotate(205deg) saturate(0.85) brightness(1.18)' },
}
export const landKind = (mapId) => (mapId === 'beach' ? 'sand' : 'grass')

// 처음 열 때 깜빡이지 않게 미리 받아 둔다
let preloaded = false
export function preloadTownArt() {
  if (preloaded || typeof Image === 'undefined') return
  preloaded = true
  const all = new Set([...Object.values(GROUND).map((g) => g.src), ...Object.values(ROAD).map(land)])
  Object.keys(SHOP_ART).forEach((id) => { const a = shopArt(id, 3); all.add(a.base); a.floors.forEach((f) => all.add(f)); all.add(a.roof) })
  all.forEach((src) => { const im = new Image(); im.src = src })
}
