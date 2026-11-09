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

// 예전에 저장된 문제(오답 노트 등)를 지금 내장 세트의 같은 번호 문제로 바꿔 보여 준다 —
// 그림이나 풀이를 고친 뒤에도 고친 모습이 보이게. 내장 세트에 없는 문제(업로드 문제)는 그대로.
let qById = null
function bundledById() {
  if (!qById) {
    qById = new Map()
    for (const s of BUNDLED_SETS) for (const x of s.questions) if (!qById.has(x.id)) qById.set(x.id, x)
  }
  return qById
}
// 내장 문제 번호인지 — 내장 문제는 글을 고쳐도 번호가 같으면 같은 문제로 본다
export const isBundledId = (id) => id != null && bundledById().has(id)
export function latestQuestion(q) {
  if (!q?.id) return q
  const cur = bundledById().get(q.id)
  // 같은 번호라도 문제 글이 완전히 다른 업로드 문제와 섞이지 않게, 정답 형식이 같을 때만 바꾼다
  return cur && cur.type === q.type ? cur : q
}
