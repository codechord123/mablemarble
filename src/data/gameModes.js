// 게임 모드 프리셋. 시작 자금·턴 제한·기타 룰을 한 곳에서.

export const GAME_MODES = {
  quick: {
    id: 'quick',
    label: '⚡ 빠른 게임',
    startMoney: 2000,
    turnLimit: 15,
    description: '15라운드 / 시작 2000원 — 한 차시(40분) 안에 마무리',
  },
  normal: {
    id: 'normal',
    label: '🎲 일반 게임',
    startMoney: 1500,
    turnLimit: null,
    description: '무제한 / 시작 1500원 — 파산까지 끝없이',
  },
  marathon: {
    id: 'marathon',
    label: '🏔 마라톤',
    startMoney: 1000,
    turnLimit: null,
    description: '무제한 / 시작 1000원 — 박빙·전략 중심',
  },
}

export const DEFAULT_MODE = 'normal'
