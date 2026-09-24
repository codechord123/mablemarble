import { create } from 'zustand'
import { rollDice, nextPosition, getTile, calculateToll } from '../utils/gameEngine.js'
import {
  activeRoundEvent, comboBonus, isRoundEventRound, monopolyGroupOf,
  purchaseCost, rollRoundEvent, salaryFor, sellValue, totalSellValue, upgradeCost,
  underdogId, CHARITY_AMOUNT, ITEMS, TOLL_CHALLENGE,
} from '../utils/rules.js'
import { BOARD } from '../utils/boardConfig.js'
import { pickQuestion, isCorrect } from '../utils/questionPicker.js'
import { applyCardEffect } from '../utils/goldenKeyEngine.js'
import { drawGoldenKeyCard } from '../data/goldenKeyCards.js'
import {
  START_MONEY,
  MAX_CONSECUTIVE_DOUBLES,
  TILE_TYPES,
  ISLAND_TURNS,
  INITIAL_WELFARE_POOL,
  ISLAND_ESCAPE_FAIL_PENALTY,
} from '../utils/boardConfig.js'
import { GAME_MODES, DEFAULT_MODE } from '../data/gameModes.js'
import { useQuestionStore } from './questionStore.js'
import { sfx } from '../utils/sounds.js'
import { persistSnapshot, loadSnapshot, clearSnapshot, persistLastSetup } from '../utils/persistence.js'

const emptyStats = () => ({ answered: 0, correct: 0, byCategory: {}, wrong: [] })

// 틀린 문제는 게임 끝 '오답 노트'에 보여 주려고 따로 모은다 (최근 30개)
const MAX_WRONG = 30

function recordAnswer(stats, question, correct) {
  const cat = question.category || '기타'
  const prev = stats.byCategory[cat] || { answered: 0, correct: 0 }
  const wrong = stats.wrong || []
  return {
    answered: stats.answered + 1,
    correct: stats.correct + (correct ? 1 : 0),
    byCategory: {
      ...stats.byCategory,
      [cat]: { answered: prev.answered + 1, correct: prev.correct + (correct ? 1 : 0) },
    },
    wrong: correct
      ? wrong
      : [...wrong, {
          id: question.id,
          type: question.type,
          question: question.question,
          choices: question.choices,
          answer: question.answer,
          explanation: question.explanation,
          category: cat,
        }].slice(-MAX_WRONG),
  }
}


const COLORS = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

const initialState = {
  players: [],
  currentTurn: 0,
  phase: 'setup', // setup|rolling|tile|question|result|golden-key|space-pick|gameover
  lastRoll: null,
  ownership: {},
  welfarePool: INITIAL_WELFARE_POOL,  // G2: 시드 자금
  usedQuestions: [],
  currentQuestion: null,
  pendingAction: null,
  lastResult: null,
  currentCard: null,
  extraTurnReason: null,  // G3: 'double' | 'card' — 추가 턴 토스트용
  poolJustReset: false,   // G6: 문제 풀 리셋 알림
  currentRound: 1,        // 턴 제한용 라운드 카운터
  turnLimit: null,        // null = 무제한
  startMoney: START_MONEY,
  modeId: DEFAULT_MODE,
  recentCardIds: [],      // 황금열쇠 최근 3장 — 연속 중복 방지
  persistError: false,    // localStorage 저장 실패 토스트용
  hotelFirstBuilt: false, // T17: 첫 호텔 건설 안내 (한 게임에 한 번)
  salaryReceived: 0,      // 출발 통과 시 받은 월급 — 토스트 알림용
  // 큰 사건 연출(통행료·건설·파산 등). key가 바뀔 때마다 한 번 재생된다.
  bigEvent: null,
  // 3라운드마다 터지는 판 전체 사건 { kind, round, tileId? } — 그 라운드에만 유효
  roundEvent: null,
  // 돈이 모자라 땅을 파는 중인 플레이어
  sellerId: null,
  // 우주여행 칸 선택이 '우주여행'인지 '순간이동 카드'인지
  spaceMode: 'space',
  // 월급에 붙은 보너스 이유 ('underdog' | 'boom' | null) — 토스트용
  salaryNote: null,
}

let eventSeq = 0
const makeEvent = (ev) => ({ ...ev, key: ++eventSeq })

export const useGameStore = create((set, get) => ({
  ...initialState,

  initGame(playerConfigs, modeId = DEFAULT_MODE) {
    // playerConfigs: 문자열 배열(이름만) 또는 {name, avatar} 객체 배열
    const normalized = playerConfigs.map((p) =>
      typeof p === 'string' ? { name: p, avatar: null } : p,
    )
    const mode = GAME_MODES[modeId] || GAME_MODES[DEFAULT_MODE]
    clearSnapshot()
    // T23: 마지막 설정 저장 — 같은 친구들로 다시 시작 기능
    persistLastSetup({ players: normalized, modeId: mode.id })
    set({
      ...initialState,
      modeId: mode.id,
      startMoney: mode.startMoney,
      turnLimit: mode.turnLimit,
      players: normalized.map((p, i) => ({
        id: i,
        name: p.name,
        avatar: p.avatar || '●',
        color: COLORS[i % COLORS.length],
        position: 0,
        money: mode.startMoney,
        alive: true,
        consecutiveDoubles: 0,
        islandTurnsLeft: 0,
        extraTurnGranted: false,
        streak: 0,
        items: [],
        stats: emptyStats(),
      })),
      phase: 'rolling',
    })
  },

  rollAndMove() {
    sfx.dice()
    const { players, currentTurn, ownership, roundEvent, currentRound } = get()
    const roll = rollDice()
    const me = players[currentTurn]
    const { to, passedStart } = nextPosition(me.position, roll.total)
    const ev = activeRoundEvent(roundEvent, currentRound)
    const salary = passedStart ? salaryFor(me, players, ownership, ev) : 0
    let moved = { ...me, position: to, money: me.money + salary }
    if (getTile(moved.position).type === TILE_TYPES.ISLAND) {
      moved = { ...moved, islandTurnsLeft: ISLAND_TURNS }
    }
    const updated = [...players]
    updated[currentTurn] = moved
    set({
      players: updated,
      lastRoll: roll,
      phase: 'tile',
      salaryReceived: salary,
      salaryNote: !passedStart ? null
        : underdogId(players, ownership) === me.id ? 'underdog'
          : ev?.kind === 'boom' ? 'boom' : null,
    })
    return { roll, tile: getTile(moved.position) }
  },

  clearSalaryToast() {
    set({ salaryReceived: 0 })
  },

  // ─── 칸 액션 진입점 ───
  // 땅 사기·건물 짓기·통행료 면제는 먼저 난이도를 고른다 (어려울수록 보상 큼)
  attemptPurchase(tile) {
    set({ phase: 'difficulty', pendingAction: { type: 'purchase', tile } })
  },

  attemptSkipToll(tile, toll) {
    set({ phase: 'difficulty', pendingAction: { type: 'skip-toll', tile, toll } })
  },

  chooseDifficulty(difficulty) {
    const pending = get().pendingAction
    if (!pending) return
    get()._askQuestion({ ...pending, difficulty })
  },

  cancelDifficulty() {
    set({ phase: 'tile', pendingAction: null })
  },

  // ─── 보관 카드 사용 ───
  _takeItem(kind) {
    const { players, currentTurn } = get()
    const me = players[currentTurn]
    const idx = (me.items || []).indexOf(kind)
    if (idx < 0) return null
    const items = [...me.items]
    items.splice(idx, 1)
    const updated = [...players]
    updated[currentTurn] = { ...me, items }
    return updated
  },

  useAngelCard(tile, toll) {
    const updated = get()._takeItem('angel')
    if (!updated) return
    sfx.correct()
    set({
      players: updated,
      bigEvent: makeEvent({ kind: 'saved', amount: toll, tileName: `${ITEMS.angel.icon} ${ITEMS.angel.name}` }),
    })
    get()._resolveTurn()
  },

  useHalfCoupon(tile, toll) {
    const updated = get()._takeItem('half')
    if (!updated) return
    set({ players: updated })
    get().payToll(tile, Math.round(toll / 2))
  },

  useTeleport() {
    const updated = get()._takeItem('teleport')
    if (!updated) return
    sfx.card()
    set({ players: updated, phase: 'space-pick', spaceMode: 'teleport', lastRoll: null })
  },

  payToll(tile, toll) {
    const { players, currentTurn, ownership } = get()
    const owner = ownership[tile.id]
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money - toll }
    updated[owner.ownerId] = { ...updated[owner.ownerId], money: updated[owner.ownerId].money + toll }
    set({
      players: updated,
      bigEvent: makeEvent({
        kind: 'toll',
        amount: toll,
        payer: players[currentTurn].name,
        receiver: players[owner.ownerId].name,
        tileName: tile.name,
      }),
    })
    get()._resolveTurn()
  },

  clearBigEvent() {
    set({ bigEvent: null })
  },

  payTax(amount) {
    const { players, currentTurn, welfarePool } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money - amount }
    set({ players: updated, welfarePool: welfarePool + amount })
    get()._resolveTurn()
  },

  claimWelfare() {
    const { players, currentTurn, welfarePool } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], money: updated[currentTurn].money + welfarePool }
    set({ players: updated, welfarePool: 0 })
    get()._resolveTurn()
  },

  skipTile() {
    get()._resolveTurn()
  },

  // ─── 건물 업그레이드 — 문제 풀이 후 한 단계만 짓기 ───
  attemptUpgrade(tile) {
    const { players, currentTurn, ownership } = get()
    const owner = ownership[tile.id]
    if (!owner || owner.ownerId !== currentTurn) return
    const ev = activeRoundEvent(get().roundEvent, get().currentRound)
    // 가장 어려운 도전(최대 할인)으로도 못 사면 시작하지 않는다
    const cheapest = upgradeCost(tile, owner.houses, ev, 3)
    if (cheapest == null) return
    if (players[currentTurn].money < cheapest) return
    set({ phase: 'difficulty', pendingAction: { type: 'upgrade', tile } })
  },

  clearHotelHint() {
    set({ hotelFirstBuilt: false })
  },

  // ─── 황금열쇠 ───
  drawCard() {
    sfx.card()
    const { recentCardIds } = get()
    const card = drawGoldenKeyCard(recentCardIds)
    const nextRecent = [...recentCardIds, card.id].slice(-3)
    set({ phase: 'golden-key', currentCard: card, recentCardIds: nextRecent })
  },

  confirmCard(success) {
    const card = get().currentCard
    if (!card) return

    // 미션 카드 — 사용자가 성공/포기를 직접 선언
    if (card.effect?.type === 'mission') {
      const { players, currentTurn } = get()
      const updated = [...players]
      const delta = success ? card.effect.winAmount : -card.effect.loseAmount
      updated[currentTurn] = {
        ...updated[currentTurn],
        money: updated[currentTurn].money + delta,
      }
      success ? sfx.correct() : sfx.wrong()
      set({
        players: updated,
        currentCard: null,
        phase: 'result',
        lastResult: {
          correct: !!success,
          message: success
            ? `${card.title}: 성공! +${card.effect.winAmount.toLocaleString()}원`
            : `${card.title}: 포기 -${card.effect.loseAmount.toLocaleString()}원`,
          explanation: card.description,
          postAction: 'end-turn',
        },
      })
      return
    }

    const result = applyCardEffect(card, get())

    // 보너스 문제: 문제 모달로
    if (result.bonusQuestion) {
      const { usedQuestions } = get()
      const pool = useQuestionStore.getState().activeQuestions
      const { question: q, poolReset } = pickQuestion(2, usedQuestions, pool)
      set({
        phase: 'question',
        currentQuestion: q,
        pendingAction: {
          type: 'bonus-question',
          winAmount: result.bonusQuestion.winAmount,
          loseAmount: result.bonusQuestion.loseAmount,
        },
        usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
        currentCard: null,
        poolJustReset: poolReset || get().poolJustReset,
      })
      return
    }

    // 추가 턴
    if (result.extraTurn) {
      const { players, currentTurn } = get()
      const updated = [...players]
      updated[currentTurn] = { ...updated[currentTurn], extraTurnGranted: true }
      set({
        players: updated,
        currentCard: null,
        phase: 'result',
        lastResult: {
          correct: true,
          message: `${card.title} — 한 번 더 굴립니다!`,
          explanation: card.description,
          postAction: 'roll-again',
        },
      })
      return
    }

    // 우주여행 카드 → 도시 선택 모달로
    if (result.triggerSpace) {
      set({
        players: result.players,
        currentCard: null,
        phase: 'space-pick',
      })
      return
    }

    // 머니/이동 카드 — 결과만 보여주고 endTurn
    set({
      players: result.players,
      currentCard: null,
      phase: 'result',
      lastResult: {
        correct: true,
        message: `${card.title}: ${result.message}`,
        explanation: card.description,
        postAction: 'end-turn',
      },
    })
  },

  // ─── 무인도 ───
  attemptIslandEscape() {
    const { usedQuestions } = get()
    const pool = useQuestionStore.getState().activeQuestions
    const { question: q, poolReset } = pickQuestion(2, usedQuestions, pool)
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction: { type: 'escape-island' },
      usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
      poolJustReset: poolReset || get().poolJustReset,
    })
  },

  skipIslandTurn() {
    const { players, currentTurn } = get()
    const updated = [...players]
    const left = Math.max(0, (updated[currentTurn].islandTurnsLeft || 0) - 1)
    updated[currentTurn] = { ...updated[currentTurn], islandTurnsLeft: left }
    set({ players: updated })
    get().endTurn()
  },

  // ─── 우주여행 ───
  goToSpacePick() {
    set({ phase: 'space-pick', spaceMode: 'space' })
  },

  pickSpaceDestination(tileId) {
    const { players, currentTurn } = get()
    const updated = [...players]
    updated[currentTurn] = { ...updated[currentTurn], position: tileId }
    set({ players: updated, phase: 'tile', spaceMode: 'space' })
  },

  cancelSpacePick() {
    // 순간이동 카드는 취소하면 카드를 돌려주고 굴리기로 돌아간다
    if (get().spaceMode === 'teleport') {
      const { players, currentTurn } = get()
      const updated = [...players]
      updated[currentTurn] = { ...updated[currentTurn], items: [...(updated[currentTurn].items || []), 'teleport'] }
      set({ players: updated, phase: 'rolling', spaceMode: 'space' })
      return
    }
    set({ phase: 'tile' })
  },

  // ─── 문제 흐름 ───
  _askQuestion(pendingAction) {
    const { usedQuestions } = get()
    const pool = useQuestionStore.getState().activeQuestions
    const { question: q, poolReset } = pickQuestion(
      pendingAction.difficulty || pendingAction.tile?.difficulty || 2,
      usedQuestions,
      pool,
    )
    set({
      phase: 'question',
      currentQuestion: q,
      pendingAction,
      usedQuestions: poolReset ? [q.id] : [...usedQuestions, q.id],
      poolJustReset: poolReset || get().poolJustReset,
    })
  },

  submitAnswer(answer) {
    const { currentQuestion, pendingAction, players, currentTurn, ownership, roundEvent, currentRound } = get()
    const ev = activeRoundEvent(roundEvent, currentRound)
    // 보상은 고른 난이도와 실제로 나온 문제 난이도 중 낮은 쪽 (그 난이도 문제가 없을 때 대비)
    const level = Math.min(pendingAction.difficulty || 1, currentQuestion.difficulty || 1)
    const isTimeout = answer === '__TIMEOUT__'
    const correct = isCorrect(currentQuestion, answer)
    correct ? sfx.correct() : sfx.wrong()
    let message = ''
    let postAction = 'end-turn'
    let event = null
    let updatedPlayers = [...players]
    let updatedOwnership = ownership

    // 통계 기록 (탈출/구매/통행료/보너스 모두 포함)
    updatedPlayers[currentTurn] = {
      ...updatedPlayers[currentTurn],
      stats: recordAnswer(
        updatedPlayers[currentTurn].stats || emptyStats(),
        currentQuestion,
        correct,
      ),
    }

    if (pendingAction.type === 'purchase') {
      if (correct) {
        const tile = pendingAction.tile
        const cost = purchaseCost(tile, ev, level)
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - cost,
        }
        updatedOwnership = {
          ...ownership,
          [tile.id]: { ownerId: currentTurn, houses: 0 },
        }
        message = `${tile.name} 땅 구매 성공! (-${cost.toLocaleString()}원)`
        event = { kind: 'buy', tileName: tile.name, tileId: tile.id }
        const group = monopolyGroupOf(updatedOwnership, tile.id)
        if (group) {
          message += ' 👑 라인 독점 — 이 줄 통행료 2배!'
          event = { kind: 'monopoly', group, tileName: tile.name, owner: players[currentTurn].name }
        }
      } else {
        message = '구매 실패 — 다음 기회에!'
      }
    } else if (pendingAction.type === 'upgrade') {
      if (correct) {
        const tile = pendingAction.tile
        const owner = ownership[tile.id]
        const cost = upgradeCost(tile, owner.houses, ev, level)
        const newLevel = owner.houses + 1
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - cost,
        }
        updatedOwnership = {
          ...ownership,
          [tile.id]: { ...owner, houses: newLevel },
        }
        sfx.coin()
        const labels = ['땅', '콘도', '아파트', '호텔']
        message = `${tile.name} ${labels[newLevel]} 건설 성공! (-${cost.toLocaleString()}원)`
        event = { kind: newLevel === 3 ? 'hotel' : 'build', level: newLevel, label: labels[newLevel], tileName: tile.name, tileId: tile.id }
      } else {
        message = '건설 실패 — 다음 기회에!'
      }
    } else if (pendingAction.type === 'skip-toll') {
      if (correct) {
        const { tile, toll } = pendingAction
        const rule = TOLL_CHALLENGE[level]
        const pay = Math.round(toll * (1 - rule.waive))
        const owner = ownership[tile.id]
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - pay + rule.bonus,
        }
        if (pay > 0) {
          updatedPlayers[owner.ownerId] = {
            ...updatedPlayers[owner.ownerId],
            money: updatedPlayers[owner.ownerId].money + pay,
          }
        }
        message = pay > 0
          ? `통행료 반값! ${pay.toLocaleString()}원만 내요`
          : `통행료 ${toll.toLocaleString()}원 면제!${rule.bonus ? ` 보너스 +${rule.bonus}원` : ''}`
        event = { kind: 'saved', amount: toll - pay, tileName: tile.name }
      } else {
        const { tile, toll } = pendingAction
        const owner = ownership[tile.id]
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          money: updatedPlayers[currentTurn].money - toll,
        }
        updatedPlayers[owner.ownerId] = {
          ...updatedPlayers[owner.ownerId],
          money: updatedPlayers[owner.ownerId].money + toll,
        }
        message = `오답 — 통행료 ${toll.toLocaleString()}원 지불`
        event = {
          kind: 'toll',
          amount: toll,
          payer: players[currentTurn].name,
          receiver: players[owner.ownerId].name,
          tileName: tile.name,
        }
      }
    } else if (pendingAction.type === 'bonus-question') {
      const delta = correct ? pendingAction.winAmount : -pendingAction.loseAmount
      updatedPlayers[currentTurn] = {
        ...updatedPlayers[currentTurn],
        money: updatedPlayers[currentTurn].money + delta,
      }
      message = correct
        ? `+${pendingAction.winAmount.toLocaleString()}원 보너스!`
        : `-${pendingAction.loseAmount.toLocaleString()}원`
    } else if (pendingAction.type === 'escape-island') {
      if (correct) {
        updatedPlayers[currentTurn] = { ...updatedPlayers[currentTurn], islandTurnsLeft: 0 }
        message = '탈출 성공! 한 번 굴려보세요.'
        postAction = 'roll-again'
      } else {
        // G4: 탈출 실패 패널티 추가
        const left = Math.max(0, (updatedPlayers[currentTurn].islandTurnsLeft || 0) - 1)
        updatedPlayers[currentTurn] = {
          ...updatedPlayers[currentTurn],
          islandTurnsLeft: left,
          money: updatedPlayers[currentTurn].money - ISLAND_ESCAPE_FAIL_PENALTY,
        }
        message = left === 0
          ? `탈출 실패 -${ISLAND_ESCAPE_FAIL_PENALTY}원… 그래도 갇힘 기간 종료!`
          : `탈출 실패 -${ISLAND_ESCAPE_FAIL_PENALTY}원… 다음에 다시!`
      }
    }

    // 연속 정답 콤보 — 3연속부터 보너스
    const streak = correct ? (updatedPlayers[currentTurn].streak || 0) + 1 : 0
    const bonus = comboBonus(streak)
    updatedPlayers[currentTurn] = {
      ...updatedPlayers[currentTurn],
      streak,
      money: updatedPlayers[currentTurn].money + bonus,
    }
    const combo = bonus ? { streak, bonus } : null

    // 시간 초과 시 메시지 앞에 명시 (학생 혼동 방지)
    const finalMessage = isTimeout ? `⏰ 시간 초과! ${message}` : message

    // T17: 정답 업그레이드로 호텔(Lv3) 첫 건설 시 안내 플래그
    const builtHotel =
      pendingAction.type === 'upgrade' &&
      correct &&
      (ownership[pendingAction.tile.id]?.houses ?? 0) === 2
    const hotelFirstBuilt = builtHotel && !get().hotelFirstBuilt
      ? true
      : get().hotelFirstBuilt

    set({
      players: updatedPlayers,
      ownership: updatedOwnership,
      phase: 'result',
      currentQuestion: null,
      pendingAction: null,
      lastResult: {
        correct,
        timeout: isTimeout,
        message: finalMessage,
        explanation: currentQuestion.explanation,
        question: currentQuestion,
        postAction,
        event,
        combo,
      },
      hotelFirstBuilt,
    })
  },

  closeResult() {
    const post = get().lastResult?.postAction
    const ev = get().lastResult?.event
    set({ lastResult: null, ...(ev ? { bigEvent: makeEvent(ev) } : {}) })
    if (post === 'roll-again') {
      set({ phase: 'rolling', lastRoll: null })
      return
    }
    get()._resolveTurn()
  },

  // ─── 파산/승리 판정 — 전체 플레이어 스캔 ───
  _resolveTurn() {
    const { players, currentTurn, ownership } = get()

    // 돈이 모자란 사람이 땅을 팔아 버틸 수 있으면 파산 대신 '땅 팔기'로
    const debtor = players.find(
      (p) => p.alive && p.money < 0 && p.money + totalSellValue(ownership, p.id) >= 0,
    )
    if (debtor) {
      set({ phase: 'sell', sellerId: debtor.id })
      return
    }

    let updated = [...players]
    let updatedOwnership = ownership
    let anyBankrupt = false

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].money < 0 && updated[i].alive) {
        updated[i] = { ...updated[i], alive: false }
        anyBankrupt = true
        // 해당 플레이어의 도시 일괄 해제
        updatedOwnership = Object.fromEntries(
          Object.entries(updatedOwnership).filter(([, v]) => v.ownerId !== i),
        )
      }
    }
    if (anyBankrupt) {
      sfx.bankrupt()
      const names = updated.filter((p, i) => !p.alive && players[i].alive).map((p) => p.name)
      set({ bigEvent: makeEvent({ kind: 'bankrupt', names }) })
    }

    const aliveCount = updated.filter((p) => p.alive).length
    if (aliveCount <= 1) {
      sfx.victory()
      clearSnapshot()
      set({ players: updated, ownership: updatedOwnership, phase: 'gameover' })
      return
    }

    set({ players: updated, ownership: updatedOwnership })
    get().endTurn()
  },

  // 땅 팔기 — 지은 값의 절반을 받고 은행에 넘긴다
  sellTile(tileId) {
    const { players, ownership, sellerId } = get()
    const info = ownership[tileId]
    if (sellerId == null || !info || info.ownerId !== sellerId) return
    const value = sellValue(BOARD[tileId], info.houses)
    const updated = [...players]
    updated[sellerId] = { ...updated[sellerId], money: updated[sellerId].money + value }
    const nextOwnership = { ...ownership }
    delete nextOwnership[tileId]
    sfx.coin()
    set({ players: updated, ownership: nextOwnership })
    if (updated[sellerId].money >= 0) {
      set({ sellerId: null })
      get()._resolveTurn()
    }
  },

  endTurn() {
    const { players, currentTurn, lastRoll, currentRound, turnLimit } = get()
    const player = players[currentTurn]
    const updated = [...players]

    const doubleAgain =
      lastRoll?.isDouble && player.consecutiveDoubles + 1 < MAX_CONSECUTIVE_DOUBLES
    const extra = player.extraTurnGranted

    if (player.alive && (doubleAgain || extra)) {
      updated[currentTurn] = {
        ...player,
        consecutiveDoubles: doubleAgain ? player.consecutiveDoubles + 1 : player.consecutiveDoubles,
        extraTurnGranted: false,
      }
      set({
        players: updated,
        phase: 'rolling',
        lastRoll: null,
        extraTurnReason: doubleAgain ? 'double' : 'card',
      })
      if (!persistSnapshot(get()) && !get().persistError) {
      set({ persistError: true })
    }
      return
    }

    updated[currentTurn] = { ...player, consecutiveDoubles: 0, extraTurnGranted: false }
    let next = (currentTurn + 1) % players.length
    let safety = players.length
    while (!updated[next].alive && safety-- > 0) {
      next = (next + 1) % players.length
    }

    // 라운드 wrap 감지 — next가 currentTurn보다 같거나 작으면 한 바퀴 돈 것
    const wrapped = next <= currentTurn
    const newRound = wrapped ? currentRound + 1 : currentRound

    // 턴 제한 도달 시 게임 종료
    if (turnLimit && newRound > turnLimit) {
      sfx.victory()
      clearSnapshot()
      set({
        players: updated,
        currentTurn: next,
        currentRound: newRound,
        phase: 'gameover',
        lastRoll: null,
        extraTurnReason: null,
      })
      return
    }

    // 새 라운드가 이벤트 라운드면 판 전체 사건을 터뜨린다
    let roundEvent = get().roundEvent
    let bigEvent = get().bigEvent
    if (wrapped && isRoundEventRound(newRound)) {
      roundEvent = rollRoundEvent(newRound)
      if (roundEvent.kind === 'charity') {
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].alive) updated[i] = { ...updated[i], money: updated[i].money + CHARITY_AMOUNT }
        }
      }
      // 사건 종류는 eventKind로 따로 싣는다 (kind는 연출 종류 'round')
      bigEvent = makeEvent({ ...roundEvent, kind: 'round', eventKind: roundEvent.kind })
    }

    set({
      players: updated,
      currentTurn: next,
      currentRound: newRound,
      phase: 'rolling',
      lastRoll: null,
      extraTurnReason: null,
      roundEvent,
      bigEvent,
    })
    if (!persistSnapshot(get()) && !get().persistError) {
      set({ persistError: true })
    }
  },

  clearExtraTurnToast() {
    set({ extraTurnReason: null })
  },

  clearPoolResetToast() {
    set({ poolJustReset: false })
  },

  clearPersistError() {
    set({ persistError: false })
  },

  // 이어하기 — localStorage에서 스냅샷 복구
  resumeGame() {
    const snap = loadSnapshot()
    if (!snap) return false
    set({
      ...initialState,
      players: snap.players,
      currentTurn: snap.currentTurn,
      ownership: snap.ownership || {},
      welfarePool: snap.welfarePool ?? INITIAL_WELFARE_POOL,
      usedQuestions: snap.usedQuestions || [],
      currentRound: snap.currentRound || 1,
      turnLimit: snap.turnLimit ?? null,
      startMoney: snap.startMoney ?? START_MONEY,
      modeId: snap.modeId || DEFAULT_MODE,
      roundEvent: snap.roundEvent || null,
      phase: 'rolling',
    })
    return true
  },

  restart() {
    clearSnapshot()
    set({ ...initialState })
  },
}))

export { TILE_TYPES, calculateToll }

// 개발 모드에서만 — 브라우저 테스트가 게임 상태를 직접 만들 수 있게 연다
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__game = useGameStore
}
