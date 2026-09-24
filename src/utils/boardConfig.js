// 24칸 보드 정의 (시계방향, index 0 = 출발). 모두의 마블 클래식 세계도시 구성.
// 코너 4개(출발/무인도/우주여행/사회복지)는 매 6칸. 가장자리 20칸 = 13 도시 + 2 랜드마크 + 4 황금열쇠 + 1 세금.
// country는 ISO 국가 코드 (LandmarkIcon에서 도시 랜드마크 SVG로 렌더링)

export const TILE_TYPES = {
  START: 'start',
  CITY: 'city',
  LANDMARK: 'landmark',
  GOLDEN_KEY: 'golden_key',
  ISLAND: 'island',
  SPACE: 'space',
  TAX: 'tax',
  WELFARE: 'welfare',
}

export const BOARD = [
  { id: 0,  type: TILE_TYPES.START },
  { id: 1,  type: TILE_TYPES.CITY,      name: '타이베이', country: 'TW', price: 100, difficulty: 1 },
  { id: 2,  type: TILE_TYPES.CITY,      name: '베이징',   country: 'CN', price: 120, difficulty: 1 },
  { id: 3,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 4,  type: TILE_TYPES.CITY,      name: '마닐라',   country: 'PH', price: 130, difficulty: 1 },
  { id: 5,  type: TILE_TYPES.CITY,      name: '홍콩',     country: 'HK', price: 150, difficulty: 1 },
  { id: 6,  type: TILE_TYPES.ISLAND },
  { id: 7,  type: TILE_TYPES.CITY,      name: '도쿄',     country: 'JP', price: 180, difficulty: 2 },
  { id: 8,  type: TILE_TYPES.CITY,      name: '카이로',   country: 'EG', price: 200, difficulty: 2 },
  { id: 9,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 10, type: TILE_TYPES.CITY,      name: '아테네',   country: 'GR', price: 220, difficulty: 2 },
  { id: 11, type: TILE_TYPES.LANDMARK,  name: '시드니',   country: 'AU', price: 350, difficulty: 3 },
  { id: 12, type: TILE_TYPES.SPACE },
  { id: 13, type: TILE_TYPES.CITY,      name: '모스크바', country: 'RU', price: 250, difficulty: 2 },
  { id: 14, type: TILE_TYPES.CITY,      name: '베를린',   country: 'DE', price: 270, difficulty: 2 },
  { id: 15, type: TILE_TYPES.GOLDEN_KEY },
  { id: 16, type: TILE_TYPES.CITY,      name: '런던',     country: 'GB', price: 300, difficulty: 2 },
  { id: 17, type: TILE_TYPES.TAX,       amount: 100 },
  { id: 18, type: TILE_TYPES.WELFARE },
  { id: 19, type: TILE_TYPES.CITY,      name: '뉴욕',     country: 'US', price: 330, difficulty: 2 },
  { id: 20, type: TILE_TYPES.GOLDEN_KEY },
  { id: 21, type: TILE_TYPES.CITY,      name: '파리',     country: 'FR', price: 380, difficulty: 2 },
  { id: 22, type: TILE_TYPES.CITY,      name: '로마',     country: 'IT', price: 400, difficulty: 2 },
  { id: 23, type: TILE_TYPES.LANDMARK,  name: '서울',     country: 'KR', price: 500, difficulty: 3 },
]

export const BOARD_SIZE = BOARD.length

// 도시 그룹 색. 보드 한 변이 한 그룹이고 한 바퀴 돌수록 비싸진다.
// 칸 아래 띠 색만 보고도 '비싼 동네'를 알아볼 수 있게 한다 (모두의 마블식).
export const GROUP_OF = {
  1: 'A', 2: 'A', 4: 'A', 5: 'A',
  7: 'B', 8: 'B', 10: 'B',
  13: 'C', 14: 'C', 16: 'C',
  19: 'D', 21: 'D', 22: 'D',
  11: 'L', 23: 'L',
}
export const GROUP_COLORS = {
  A: { band: '#65A30D', deep: '#3F6212' }, // 연두 — 가장 싼 동네
  B: { band: '#0284C7', deep: '#075985' }, // 파랑
  C: { band: '#EA580C', deep: '#9A3412' }, // 주황
  D: { band: '#DC2626', deep: '#991B1B' }, // 빨강 — 가장 비싼 동네
  L: { band: '#B45309', deep: '#78350F', gold: true }, // 랜드마크
}
export function tileGroup(tileId) {
  return GROUP_COLORS[GROUP_OF[tileId]] || null
}
// 같은 색 줄에 속한 칸 id 목록
export function groupTiles(groupKey) {
  return Object.keys(GROUP_OF).filter((id) => GROUP_OF[id] === groupKey).map(Number)
}

export const START_MONEY = 1500
export const SALARY = 200
export const LANDMARK_TOLL_MULTIPLIER = 1.5
export const ISLAND_TURNS = 3
export const MAX_CONSECUTIVE_DOUBLES = 3

// ─── 건물 시스템 ───
// 0=땅, 1=콘도, 2=아파트, 3=호텔
export const MAX_BUILDING_LEVEL = 3
export const BUILDING_LABELS = ['땅', '콘도', '아파트', '호텔']
export const BUILDING_ICONS = ['', '🏠', '🏢', '🏨']

// 통행료 = price × TOLL_MULTIPLIERS[level]   (랜드마크는 추가 LANDMARK_TOLL_MULTIPLIER)
// G1 밸런스 완화: 호텔 2.5 → 2.0 (서울 랜드마크 호텔 1500원 — 시작자금과 같은 수준으로 조정)
export const TOLL_MULTIPLIERS = [0.2, 0.6, 1.3, 2.0]
// 다음 레벨 업그레이드 비용 = price × BUILDING_COSTS[targetLevel]
export const BUILDING_COSTS = [null, 0.4, 0.7, 1.0]

// 사회복지 초기 시드 자금 (G2)
export const INITIAL_WELFARE_POOL = 100
// 무인도 탈출 실패 패널티 (G4)
export const ISLAND_ESCAPE_FAIL_PENALTY = 50

// ─── 문제 시간 제한(초) ───
export const QUESTION_TIME_BY_DIFFICULTY = { 1: 20, 2: 30, 3: 45 }

// 7x7 그리드 좌표 (UI 렌더링용). 시계방향 외곽 24칸을 0..23으로 매핑.
// 보드 격자 한 줄의 칸 비율. 모서리 칸(출발·무인도·우주여행·사회복지)을 넓게 잡아
// 모두의 마블처럼 네 귀퉁이가 크게 보이게 한다. CSS grid-template과 말 위치 계산이
// 같은 값을 쓴다.
export const CORNER_WEIGHT = 1.28
export const TRACK = [CORNER_WEIGHT, 1, 1, 1, 1, 1, CORNER_WEIGHT]
const TRACK_TOTAL = TRACK.reduce((a, b) => a + b, 0)
// minmax(0, …) — 그림이 커도 칸이 늘어나지 않게 최소 크기를 0으로 묶는다
export const GRID_TEMPLATE = TRACK.map((w) => `minmax(0, ${w}fr)`).join(' ')

// 격자 한 줄에서 i번째 칸의 시작 위치와 폭(%). 칸 사이 간격(몇 px)은 무시한다.
export function trackSpan(i) {
  let start = 0
  for (let k = 0; k < i; k++) start += TRACK[k]
  return { start: (start / TRACK_TOTAL) * 100, size: (TRACK[i] / TRACK_TOTAL) * 100 }
}
// 칸 한가운데 좌표(%) — 말·착지 링 배치용
export function tileCenterPct(index) {
  const { x, y } = getTileCoord(index)
  const cx = trackSpan(x)
  const cy = trackSpan(y)
  return { left: cx.start + cx.size / 2, top: cy.start + cy.size / 2, size: Math.min(cx.size, cy.size) }
}

export function getTileCoord(index) {
  const side = 7
  const last = side - 1
  if (index <= last)                  return { x: index,             y: 0 }
  if (index <= last * 2)              return { x: last,              y: index - last }
  if (index <= last * 3)              return { x: last * 3 - index,  y: last }
  return                                     { x: 0,                 y: last * 4 - index }
}
