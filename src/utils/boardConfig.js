// 24칸 보드 정의 (시계방향, index 0 = 출발). 모두의 마블 클래식 세계도시 구성.
// 코너 4개(출발/무인도/우주여행/사회복지)는 매 6칸. 가장자리 20칸 = 13 도시 + 2 랜드마크 + 4 황금열쇠 + 1 세금.
// country는 ISO 국가 코드 (FlagIcon에서 SVG 렌더링)

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
export function getTileCoord(index) {
  const side = 7
  const last = side - 1
  if (index <= last)                  return { x: index,             y: 0 }
  if (index <= last * 2)              return { x: last,              y: index - last }
  if (index <= last * 3)              return { x: last * 3 - index,  y: last }
  return                                     { x: 0,                 y: last * 4 - index }
}
