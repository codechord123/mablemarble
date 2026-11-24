// 🎈 소수점 풍선 터뜨리기 — 곱셈식의 답이 적힌 풍선 중 맞는 것을 터뜨린다.
// 틀린 풍선은 소수점 자리만 다른 답(×10, ÷10, ÷100)과 자연수 곱이 조금 다른 답 — '곱의 소수점 위치'를 연습한다.
import { makeProblem, show, norm } from './decimalGame.js'

export const MINI_SECS = 45
export const MINI_REWARD_PLAYS = 3 // 하루에 보상 받는 판 수 (그다음은 연습)
export const MINI_REWARD_MAX = 40
export const miniReward = (score) => Math.min(MINI_REWARD_MAX, score * 2)
const TYPES = ['dn1', 'nd1', 'dd1', 'dn2', 'nd2', 'dd2', 'shift']

// 같은 숫자에서 소수점만 옮긴 값들 + 곱이 조금 다른 값
export function distractors(answer, rng = Math.random) {
  const { v, p } = answer
  const out = []
  const add = (d) => {
    const n = norm(d)
    if (n.v <= 0) return
    const s = show(n)
    if (s !== show(answer) && !out.some((x) => show(x) === s)) out.push(n)
  }
  add({ v, p: p + 1 }) // ÷10
  if (p > 0) add({ v, p: p - 1 }) // ×10
  else add({ v: v * 10, p: 0 })
  add({ v, p: p + 2 }) // ÷100
  // 자연수처럼 곱한 값이 조금 다른 답 (계산 실수)
  for (let i = 0; i < 6 && out.length < 4; i++) {
    const delta = [1, 2, 10, 9, 11][Math.floor(rng() * 5)] * (rng() < 0.5 ? -1 : 1)
    add({ v: v + delta, p })
  }
  return out.slice(0, 3)
}

export function makeRound(rng = Math.random) {
  const q = makeProblem(TYPES[Math.floor(rng() * TYPES.length)], { rng })
  const answer = norm(q.answer)
  const choices = [answer, ...distractors(answer, rng)]
  // 섞기
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { text: q.text, answer: show(answer), choices: choices.map(show) }
}

// 오늘 보상 받은 판 수 — town.mini = { best, day: 'YYYY-MM-DD', plays }
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export function playsToday(mini, today = todayKey()) {
  return mini?.day === today ? mini.plays || 0 : 0
}
