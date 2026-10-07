// 문제가 어느 단원(문제 세트)인지 — 오답 노트·통계를 단원별로 나눠 보기 위해.
// 새 기록은 문제에 unit을 실어 저장하고, unit이 없는 예전 기록은 내장 세트에서 문제 아이디로 찾는다.
import { BUNDLED_SETS } from './bundledSets.js'

let byId = null
function bundledIndex() {
  if (!byId) {
    byId = new Map()
    for (const s of BUNDLED_SETS) for (const q of s.questions) if (!byId.has(q.id)) byId.set(q.id, s.name)
  }
  return byId
}

export const OTHER_UNIT = '기타 문제'

export function unitOfQuestion(q) {
  if (!q) return OTHER_UNIT
  if (q.unit) return q.unit
  return bundledIndex().get(q.id) || OTHER_UNIT
}
