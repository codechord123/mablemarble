// 선생님 — 우리 반 학생들의 부르마블 기록 읽기.
// 보안 규칙: 선생님 토큰의 반(classId)과 같은 반 기록만 읽을 수 있다.
import { collection, query, where, getDocs } from 'firebase/firestore'
import { authOf, dbOf, ME } from './firebase.js'

export async function loadClassProgress(classId) {
  await authOf(ME).authStateReady()
  const snap = await getDocs(query(collection(dbOf(ME), 'boomarble_progress'), where('classId', '==', classId)))
  return snap.docs.map((d) => d.data())
}
