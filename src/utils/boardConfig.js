// 24칸 보드 정의 (시계방향, index 0 = 출발). 모두의 마블 클래식 세계도시 구성.
// 코너 4개(출발/무인도/우주여행/사회복지)는 매 6칸. 가장자리 20칸 = 13 도시 + 2 랜드마크 + 4 황금열쇠 + 1 세금.

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
  { id: 1,  type: TILE_TYPES.CITY,      name: '타이베이', country: '🇹🇼', price: 100, difficulty: 1 },
  { id: 2,  type: TILE_TYPES.CITY,      name: '베이징',   country: '🇨🇳', price: 120, difficulty: 1 },
  { id: 3,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 4,  type: TILE_TYPES.CITY,      name: '마닐라',   country: '🇵🇭', price: 130, difficulty: 1 },
  { id: 5,  type: TILE_TYPES.CITY,      name: '홍콩',     country: '🇭🇰', price: 150, difficulty: 1 },
  { id: 6,  type: TILE_TYPES.ISLAND },
  { id: 7,  type: TILE_TYPES.CITY,      name: '도쿄',     country: '🇯🇵', price: 180, difficulty: 2 },
  { id: 8,  type: TILE_TYPES.CITY,      name: '카이로',   country: '🇪🇬', price: 200, difficulty: 2 },
  { id: 9,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 10, type: TILE_TYPES.CITY,      name: '아테네',   country: '🇬🇷', price: 220, difficulty: 2 },
  { id: 11, type: TILE_TYPES.LANDMARK,  name: '시드니',   country: '🇦🇺', price: 350, difficulty: 3 },
  { id: 12, type: TILE_TYPES.SPACE },
  { id: 13, type: TILE_TYPES.CITY,      name: '모스크바', country: '🇷🇺', price: 250, difficulty: 2 },
  { id: 14, type: TILE_TYPES.CITY,      name: '베를린',   country: '🇩🇪', price: 270, difficulty: 2 },
  { id: 15, type: TILE_TYPES.GOLDEN_KEY },
  { id: 16, type: TILE_TYPES.CITY,      name: '런던',     country: '🇬🇧', price: 300, difficulty: 2 },
  { id: 17, type: TILE_TYPES.TAX,       amount: 100 },
  { id: 18, type: TILE_TYPES.WELFARE },
  { id: 19, type: TILE_TYPES.CITY,      name: '뉴욕',     country: '🇺🇸', price: 330, difficulty: 2 },
  { id: 20, type: TILE_TYPES.GOLDEN_KEY },
  { id: 21, type: TILE_TYPES.CITY,      name: '파리',     country: '🇫🇷', price: 380, difficulty: 2 },
  { id: 22, type: TILE_TYPES.CITY,      name: '로마',     country: '🇮🇹', price: 400, difficulty: 2 },
  { id: 23, type: TILE_TYPES.LANDMARK,  name: '서울',     country: '🇰🇷', price: 500, difficulty: 3 },
]

export const BOARD_SIZE = BOARD.length

export const START_MONEY = 1500
export const SALARY = 200
export const LANDMARK_TOLL_MULTIPLIER = 1.5
export const ISLAND_TURNS = 3
export const MAX_CONSECUTIVE_DOUBLES = 3

// ─── 건물 시스템 ───
// 0=땅, 1=콘도, 2=빌딩, 3=호텔
export const MAX_BUILDING_LEVEL = 3
export const BUILDING_LABELS = ['땅', '콘도', '빌딩', '호텔']
export const BUILDING_ICONS = ['', '🏠', '🏢', '🏨']

// 통행료 = price × TOLL_MULTIPLIERS[level]   (랜드마크는 추가 LANDMARK_TOLL_MULTIPLIER)
export const TOLL_MULTIPLIERS = [0.1, 0.3, 0.7, 1.5]
// 다음 레벨 업그레이드 비용 = price × BUILDING_COSTS[targetLevel]
export const BUILDING_COSTS = [null, 0.4, 0.7, 1.0]

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
