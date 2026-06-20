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

  // ─── 미션 카드 (몸으로 하는 미니 챌린지) ───
  { id: 'gk_13', emoji: '🐘', title: '코끼리 코 챌린지',
    description: '한 팔로 코를 잡고 그 팔에 반대 손을 끼워 코끼리 코를 만든 뒤, 제자리에서 5바퀴 빙글빙글 돌기! 성공하면 +200원.',
    effect: { type: 'mission', winAmount: 200, loseAmount: 50 } },

  { id: 'gk_14', emoji: '🦩', title: '한 발 균형',
    description: '한 발로 10초 동안 균형 잡기! 성공하면 +150원.',
    effect: { type: 'mission', winAmount: 150, loseAmount: 40 } },

  { id: 'gk_15', emoji: '🎤', title: '동요 한 곡',
    description: '교실 친구들이 다 아는 동요 한 곡을 처음부터 끝까지 부르기! 성공하면 +250원.',
    effect: { type: 'mission', winAmount: 250, loseAmount: 50 } },

  { id: 'gk_16', emoji: '🤸', title: '팔벌려뛰기 20번',
    description: '제자리에서 팔벌려뛰기 20번 연속! 성공하면 +200원.',
    effect: { type: 'mission', winAmount: 200, loseAmount: 50 } },

  { id: 'gk_17', emoji: '🐸', title: '개구리 점프',
    description: '쪼그려 앉은 상태로 개구리처럼 5번 콩콩 뛰기! 성공하면 +180원.',
    effect: { type: 'mission', winAmount: 180, loseAmount: 40 } },

  { id: 'gk_18', emoji: '😆', title: '웃음 참기',
    description: '다른 친구들이 30초 동안 웃기려 해도 절대 웃지 않기! 성공하면 +300원.',
    effect: { type: 'mission', winAmount: 300, loseAmount: 60 } },

  { id: 'gk_19', emoji: '🪞', title: '거울 따라하기',
    description: '오른쪽 옆 친구의 동작을 거울처럼 10초 동안 똑같이 따라하기! 성공하면 +180원.',
    effect: { type: 'mission', winAmount: 180, loseAmount: 40 } },

  { id: 'gk_20', emoji: '🤐', title: '한 번도 말하지 않기',
    description: '다음 자기 차례가 올 때까지 한 마디도 안 하기! 성공하면 +250원.',
    effect: { type: 'mission', winAmount: 250, loseAmount: 50 } },
]

export function drawGoldenKeyCard() {
  return GOLDEN_KEY_CARDS[Math.floor(Math.random() * GOLDEN_KEY_CARDS.length)]
}
