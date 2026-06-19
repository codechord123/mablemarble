// 황금열쇠 카드 12종. 효과는 type + payload로 표현 → 엔진이 해석.
// 카드 분포: 머니 효과 6 / 이동 4 / 보너스 문제 1 / 추가 턴 1

export const GOLDEN_KEY_CARDS = [
  { id: 'gk_01', emoji: '🎁', title: '행운의 발견', description: '300원을 받습니다.',
    effect: { type: 'gain-money', amount: 300 } },

  { id: 'gk_02', emoji: '💸', title: '세금 폭탄', description: '200원을 잃습니다.',
    effect: { type: 'lose-money', amount: 200 } },

  { id: 'gk_03', emoji: '🎯', title: '보너스 문제!', description: '문제를 풀어보세요. 정답이면 +200원, 오답이면 -100원.',
    effect: { type: 'bonus-question', winAmount: 200, loseAmount: 100 } },

  { id: 'gk_04', emoji: '🏝️', title: '함정에 빠졌다!', description: '무인도로 직행합니다.',
    effect: { type: 'move-to-island' } },

  { id: 'gk_05', emoji: '🏁', title: '집으로 출발!', description: '출발 칸으로 이동하고 200원을 받습니다.',
    effect: { type: 'move-to-start' } },

  { id: 'gk_06', emoji: '🎲', title: '재도전 기회', description: '한 번 더 주사위를 굴립니다.',
    effect: { type: 'extra-turn' } },

  { id: 'gk_07', emoji: '🎂', title: '생일 파티', description: '다른 모든 플레이어에게서 50원씩 받습니다.',
    effect: { type: 'collect-from-others', amount: 50 } },

  { id: 'gk_08', emoji: '🍔', title: '점심값 한턱', description: '다른 모든 플레이어에게 50원씩 줍니다.',
    effect: { type: 'pay-to-others', amount: 50 } },

  { id: 'gk_09', emoji: '⭐', title: '학교 시상식', description: '500원의 상금을 받습니다.',
    effect: { type: 'gain-money', amount: 500 } },

  { id: 'gk_10', emoji: '🚀', title: '우주여행 티켓', description: '우주여행 칸으로 이동합니다.',
    effect: { type: 'move-to-space' } },

  { id: 'gk_11', emoji: '🔄', title: '되돌아가기', description: '3칸 뒤로 이동합니다.',
    effect: { type: 'move-relative', steps: -3 } },

  { id: 'gk_12', emoji: '⚡', title: '점프!', description: '5칸 앞으로 이동합니다.',
    effect: { type: 'move-relative', steps: 5 } },
]

export function drawGoldenKeyCard() {
  return GOLDEN_KEY_CARDS[Math.floor(Math.random() * GOLDEN_KEY_CARDS.length)]
}
