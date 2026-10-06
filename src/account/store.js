// 메뉴에서 쓰는 '내 계정' 상태. Firebase는 필요할 때만 불러온다(첫 화면을 가볍게).
import { create } from 'zustand'

const FLAG = 'boomarble_me' // 이 기기에 로그인해 둔 학생이 있으면 시작할 때 확인한다

let mods = null
export const accountApi = () =>
  (mods ||= Promise.all([import('./account.js'), import('./progress.js'), import('./firebase.js')]).then(
    ([a, p, f]) => ({ ...a, ...p, ME: f.ME }),
  ))

export const useAccount = create(() => ({ me: null, checking: false, notice: null }))

function setMe(me) {
  try {
    if (me) localStorage.setItem(FLAG, '1')
    else localStorage.removeItem(FLAG)
  } catch {
    /* 무시 */
  }
  useAccount.setState({ me, checking: false })
}

let watching = false
async function watch() {
  const a = await accountApi()
  if (watching) return
  watching = true
  a.watchAccount(a.ME, setMe)
}

// 앱 시작 때 한 번 — 역사게임에서 넘어온 입장권(?ticket=)이 있으면 바로 로그인
export async function initAccount() {
  let ticket = null
  try {
    const url = new URL(window.location.href)
    ticket = url.searchParams.get('ticket')
    if (ticket) {
      url.searchParams.delete('ticket')
      window.history.replaceState(null, '', url.pathname + url.search + url.hash)
    }
  } catch {
    /* 무시 */
  }
  let remembered = false
  try {
    remembered = Boolean(localStorage.getItem(FLAG))
  } catch {
    /* 무시 */
  }
  if (!ticket && !remembered) return
  useAccount.setState({ checking: true })
  try {
    const a = await accountApi()
    if (ticket) {
      try {
        const me = await a.redeemTicket(ticket)
        setMe(me)
        useAccount.setState({ notice: `${a.displayName(me)}, 어서 와요! 🎲` })
      } catch (e) {
        useAccount.setState({ notice: e.message })
      }
    }
    await watch()
  } catch {
    useAccount.setState({ checking: false })
  }
}

export async function loginMe(username, password) {
  const a = await accountApi()
  const me = await a.login(a.ME, username, password)
  setMe(me)
  await watch()
  return me
}

export async function logoutMe() {
  const a = await accountApi()
  await a.logout(a.ME)
  setMe(null)
}

export const clearNotice = () => useAccount.setState({ notice: null })

// 보드게임 자리별 로그인
export async function loginSeat(seat, username, password) {
  const a = await accountApi()
  return a.login(seat, username, password)
}
export async function logoutSeat(seat) {
  const a = await accountApi()
  return a.logout(seat)
}

// 문제를 풀 때마다 그 학생 오답 노트에 기록 (실패해도 게임은 그대로)
export function recordFor(slot, question, correct) {
  if (!slot || !question) return
  accountApi()
    .then((a) => a.recordResult(slot, question, correct))
    .catch(() => {})
}
