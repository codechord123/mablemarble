// 학생 계정 — 로그인 확인은 역사게임 서버(/api/auth)가 하고, 받은 토큰으로 Firebase에 로그인한다.
// 비밀번호는 이 앱에 저장하지 않는다.
import { signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth'
import { authOf, ME } from './firebase.js'

export const ACCOUNT_API = (import.meta.env.VITE_ACCOUNT_API || 'https://studyapple.vercel.app').replace(/\/$/, '')

const INFO_KEY = (uid) => `boomarble_account_${uid}` // 서버가 준 공개 정보(이름·반)

async function api(slot, action, payload = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const cu = authOf(slot).currentUser
  if (cu) headers.Authorization = `Bearer ${await cu.getIdToken()}`
  let res
  let data
  try {
    res = await fetch(`${ACCOUNT_API}/api/auth`, { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) })
    data = await res.json()
  } catch {
    throw new Error('계정 서버에 연결할 수 없어요. 인터넷을 확인해 주세요')
  }
  if (res.status === 503) throw new Error('아직 학생 로그인 준비가 안 됐어요. 선생님께 알려 주세요')
  if (!res.ok) throw new Error(data?.error || '잠시 후 다시 해 주세요')
  return data
}

function remember(account) {
  try {
    localStorage.setItem(INFO_KEY(account.username), JSON.stringify(account))
  } catch {
    /* 무시 */
  }
}
function recall(uid) {
  try {
    return JSON.parse(localStorage.getItem(INFO_KEY(uid)) || 'null')
  } catch {
    return null
  }
}

async function establish(slot, { token, account }) {
  await signInWithCustomToken(authOf(slot), token)
  remember(account)
  return account
}

export async function login(slot, username, password) {
  const u = (username || '').trim().toLowerCase()
  if (!u || !password) throw new Error('아이디와 비밀번호를 입력해 주세요')
  return establish(slot, await api(slot, 'login', { username: u, password }))
}

// 역사게임에서 넘어올 때 붙어 온 1회용 입장권
export async function redeemTicket(ticket) {
  return establish(ME, await api(ME, 'redeem', { ticket }))
}

export async function logout(slot) {
  await signOut(authOf(slot)).catch(() => {})
}

// 지금 그 자리에 로그인한 학생 (없으면 null) — { username, name, nickname, avatar, classId, role }
export function currentAccount(slot) {
  const cu = authOf(slot).currentUser
  if (!cu) return null
  return recall(cu.uid) || { username: cu.uid, name: cu.uid, role: 'student', classId: null }
}

// 로그인 상태가 바뀔 때마다 cb(account|null). 처음 한 번은 저장된 로그인을 확인한 뒤 부른다.
export function watchAccount(slot, cb) {
  return onAuthStateChanged(authOf(slot), (u) => cb(u ? currentAccount(slot) : null))
}

export const displayName = (a) => (a ? a.name || a.nickname || a.username : '')
