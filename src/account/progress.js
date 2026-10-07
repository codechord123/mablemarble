// 학생별 기록 — Firestore boomarble_progress/{아이디}
// { uid, classId, name, wrong, mastered, drill: { xp, solved, correct, bestStreak }, updatedAt }
// 규칙: 본인만 읽고 쓰기, 같은 반 담임은 읽기.
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { authOf, dbOf } from './firebase.js'
import { applyResult, applyStats, emptyBook } from './wrongBook.js'
import { currentAccount } from './account.js'

const cache = new Map() // uid → Promise<doc>
let chain = Promise.resolve() // 쓰기를 한 줄로 (순서 꼬임 방지)

function ref(slot, uid) {
  return doc(dbOf(slot), 'boomarble_progress', uid)
}

// 새로고침 직후엔 로그인 정보를 불러오는 중이라 currentUser가 잠깐 비어 있다 — 기다렸다가 쓴다
// (예전엔 이때 푼 문제가 오답 노트에 안 들어갔다)
async function uidOf(slot) {
  const a = authOf(slot)
  await a.authStateReady()
  return a.currentUser?.uid || null
}

export async function loadProgress(slot) {
  const uid = await uidOf(slot)
  if (!uid) return null
  if (!cache.has(uid)) {
    const p = getDoc(ref(slot, uid))
      .then((s) => (s.exists() ? s.data() : { uid, ...emptyBook(), drill: null }))
      .catch((e) => {
        cache.delete(uid)
        throw e
      })
    cache.set(uid, p)
  }
  return cache.get(uid)
}

async function update(slot, fn) {
  const uid = await uidOf(slot)
  if (!uid) throw new Error('not-signed-in')
  const run = async () => {
    const cur = await loadProgress(slot)
    const acc = currentAccount(slot)
    const next = { ...fn(cur), uid, classId: acc?.classId || null, name: acc?.name || '', updatedAt: Date.now() }
    cache.set(uid, Promise.resolve(next))
    await setDoc(ref(slot, uid), next)
    return next
  }
  chain = chain.then(run, run)
  return chain
}

// 문제 하나 풀 때마다 — 틀리면 노트에 넣고, 노트에 있던 문제를 맞히면 졸업에 가까워진다
export function recordResult(slot, question, correct) {
  return update(slot, (cur) => ({ ...cur, ...applyResult(cur, question, correct), stats: applyStats(cur.stats, question, correct) }))
}

export function saveDrill(slot, drill) {
  return update(slot, (cur) => ({ ...cur, drill })).catch((e) => {
    console.warn('수련장 기록 저장 실패', e)
    return null
  })
}
