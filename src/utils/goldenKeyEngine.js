// 황금열쇠 카드 효과 적용 (순수 함수).
// state slice: { players, currentTurn, ownership } → 변경된 slice를 반환.
// 이동 효과는 별도 처리(`movePlayerTo`, `movePlayerBy`)로 위임.

import { BOARD, BOARD_SIZE, TILE_TYPES, SALARY } from './boardConfig.js'

const adjustMoney = (player, delta) => ({ ...player, money: player.money + delta })

export function applyCardEffect(card, state) {
  const { players, currentTurn } = state
  const updated = [...players]
  const me = updated[currentTurn]
  const eff = card.effect

  switch (eff.type) {
    case 'gain-money':
      updated[currentTurn] = adjustMoney(me, eff.amount)
      return { players: updated, message: `+${eff.amount}원` }

    case 'lose-money':
      updated[currentTurn] = adjustMoney(me, -eff.amount)
      return { players: updated, message: `-${eff.amount}원` }

    case 'collect-from-others': {
      let total = 0
      for (let i = 0; i < updated.length; i++) {
        if (i === currentTurn || !updated[i].alive) continue
        updated[i] = adjustMoney(updated[i], -eff.amount)
        total += eff.amount
      }
      updated[currentTurn] = adjustMoney(me, total)
      return { players: updated, message: `각 50원씩 ${total}원 수령` }
    }

    case 'pay-to-others': {
      let total = 0
      for (let i = 0; i < updated.length; i++) {
        if (i === currentTurn || !updated[i].alive) continue
        updated[i] = adjustMoney(updated[i], eff.amount)
        total += eff.amount
      }
      updated[currentTurn] = adjustMoney(me, -total)
      return { players: updated, message: `각 50원씩 ${total}원 지급` }
    }

    case 'move-to-start':
      updated[currentTurn] = { ...adjustMoney(me, SALARY), position: 0 }
      return { players: updated, message: `출발로 이동 (+${SALARY}원)`, movedTo: 0 }

    case 'move-to-island': {
      const island = BOARD.findIndex((t) => t.type === TILE_TYPES.ISLAND)
      updated[currentTurn] = { ...me, position: island, islandTurnsLeft: 3 }
      return { players: updated, message: '무인도 이동', movedTo: island }
    }

    case 'move-to-space': {
      const space = BOARD.findIndex((t) => t.type === TILE_TYPES.SPACE)
      updated[currentTurn] = { ...me, position: space }
      return { players: updated, message: '우주여행 칸으로 이동', movedTo: space, triggerSpace: true }
    }

    case 'move-relative': {
      const next = ((me.position + eff.steps) % BOARD_SIZE + BOARD_SIZE) % BOARD_SIZE
      const passedStart = eff.steps > 0 && me.position + eff.steps >= BOARD_SIZE
      updated[currentTurn] = {
        ...me,
        position: next,
        money: me.money + (passedStart ? SALARY : 0),
      }
      return {
        players: updated,
        message: `${eff.steps > 0 ? `+${eff.steps}` : eff.steps}칸 이동${passedStart ? ` (+${SALARY}원 통과)` : ''}`,
        movedTo: next,
      }
    }

    case 'extra-turn':
      return { players, message: '같은 플레이어가 한 번 더 굴립니다.', extraTurn: true }

    case 'bonus-question':
      return { players, bonusQuestion: { winAmount: eff.winAmount, loseAmount: eff.loseAmount } }

    default:
      return { players, message: '알 수 없는 카드입니다.' }
  }
}
