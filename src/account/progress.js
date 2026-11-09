// 학생별 기록 — Firestore boomarble_progress/{아이디}
// { uid, classId, name, wrong, mastered, drill: { xp, solved, correct, bestStreak }, updatedAt }
// 규칙: 본인만 읽고 쓰기, 같은 반 담임은 읽기.
import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore'
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

// fresh: 기기에 기억해 둔 기록 대신 서버에서 새로 읽는다(다른 기기에서 쌓인 오답까지 보이게)
export async function loadProgress(slot, { fresh = false } = {}) {
  const uid = await uidOf(slot)
  if (!uid) return null
  if (fresh) cache.delete(uid)
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
    const acc = currentAccount(slot)
    const stamp = (cur) => ({ ...fn(cur), uid, classId: acc?.classId || null, name: acc?.name || '', updatedAt: Date.now() })
    let next
    try {
      // 서버의 지금 기록을 읽어 그 위에 더한다(한 번에 처리). 예전에는 처음 읽어 둔 기록 위에 덮어써서,
      // 한 학생이 두 기기(교실 게임 자리 + 자기 디벗)를 쓰면 다른 기기에서 쌓인 오답이 안 보이거나 지워졌다.
      next = await runTransaction(dbOf(slot), async (tx) => {
        const snap = await tx.get(ref(slot, uid))
        const n = stamp(snap.exists() ? snap.data() : { uid, ...emptyBook(), drill: null })
        tx.set(ref(slot, uid), n)
        return n
      })
    } catch (e) {
      // 보안 규칙에 막힌 건 다시 해도 안 된다. 인터넷이 잠깐 끊긴 경우는 예전처럼 기억해 둔 기록 위에 써서
      // 연결되면 올라가게 한다.
      if (String(e?.code || '').includes('permission')) throw e
      next = stamp(await loadProgress(slot))
      await setDoc(ref(slot, uid), next)
    }
    cache.set(uid, Promise.resolve(next))
    return next
  }
  chain = chain.then(run, run)
  return chain
}

// 문제 하나 풀 때마다 — 틀리면 노트에 넣고, 노트에 있던 문제를 맞히면 졸업에 가까워진다
// key: 오답 다시 풀기에서 그 기록의 열쇠(노트에 저장된 원래 문제)로 기록할 때
export function recordResult(slot, question, correct, { key = null } = {}) {
  return update(slot, (cur) => ({ ...cur, ...applyResult(cur, question, correct, Date.now(), key), stats: applyStats(cur.stats, question, correct) }))
}

export function saveDrill(slot, drill) {
  return update(slot, (cur) => ({ ...cur, drill })).catch((e) => {
    console.warn('수련장 기록 저장 실패', e)
    return null
  })
}
