// 24칸 보드 정의 (시계방향, index 0 = 출발)
// 코너 4개(출발/무인도/우주여행/사회복지)는 매 6칸마다 배치 → 7x7 외곽과 자연스럽게 정렬
// 가장자리 20칸 = 13 도시 + 2 랜드마크 + 4 황금열쇠 + 1 세금
//   * 기획서의 12 도시 + 1 도시 추가 → 코너 정렬을 위한 디자인 보정

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
  { id: 1,  type: TILE_TYPES.CITY,      name: '서울',     price: 100, difficulty: 1 },
  { id: 2,  type: TILE_TYPES.CITY,      name: '부산',     price: 100, difficulty: 1 },
  { id: 3,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 4,  type: TILE_TYPES.CITY,      name: '인천',     price: 120, difficulty: 1 },
  { id: 5,  type: TILE_TYPES.CITY,      name: '대구',     price: 120, difficulty: 1 },
  { id: 6,  type: TILE_TYPES.ISLAND },
  { id: 7,  type: TILE_TYPES.CITY,      name: '광주',     price: 150, difficulty: 2 },
  { id: 8,  type: TILE_TYPES.CITY,      name: '대전',     price: 150, difficulty: 2 },
  { id: 9,  type: TILE_TYPES.GOLDEN_KEY },
  { id: 10, type: TILE_TYPES.CITY,      name: '울산',     price: 180, difficulty: 2 },
  { id: 11, type: TILE_TYPES.LANDMARK,  name: '경주',     price: 300, difficulty: 3 },
  { id: 12, type: TILE_TYPES.SPACE },
  { id: 13, type: TILE_TYPES.CITY,      name: '제주',     price: 200, difficulty: 2 },
  { id: 14, type: TILE_TYPES.CITY,      name: '강릉',     price: 200, difficulty: 2 },
  { id: 15, type: TILE_TYPES.GOLDEN_KEY },
  { id: 16, type: TILE_TYPES.CITY,      name: '전주',     price: 220, difficulty: 2 },
  { id: 17, type: TILE_TYPES.TAX,       amount: 100 },
  { id: 18, type: TILE_TYPES.WELFARE },
  { id: 19, type: TILE_TYPES.CITY,      name: '춘천',     price: 250, difficulty: 2 },
  { id: 20, type: TILE_TYPES.GOLDEN_KEY },
  { id: 21, type: TILE_TYPES.CITY,      name: '평창',     price: 280, difficulty: 2 },
  { id: 22, type: TILE_TYPES.CITY,      name: '여수',     price: 280, difficulty: 1 },
  { id: 23, type: TILE_TYPES.LANDMARK,  name: '제주국제', price: 350, difficulty: 3 },
]

export const BOARD_SIZE = BOARD.length

export const START_MONEY = 1500
export const SALARY = 200
export const LANDMARK_TOLL_MULTIPLIER = 2
export const TOLL_RATE = 0.2
export const ISLAND_TURNS = 3
export const MAX_CONSECUTIVE_DOUBLES = 3

// 7x7 그리드 좌표 (UI 렌더링용). 시계방향 외곽 24칸을 0..23으로 매핑.
export function getTileCoord(index) {
  const side = 7
  const last = side - 1
  if (index <= last)                  return { x: index,             y: 0 }
  if (index <= last * 2)              return { x: last,              y: index - last }
  if (index <= last * 3)              return { x: last * 3 - index,  y: last }
  return                                     { x: 0,                 y: last * 4 - index }
}
