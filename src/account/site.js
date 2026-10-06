// 두 게임 공용 로그인 화면이 있는 곳 (역사게임 사이트). 로그인 서버(/api/auth)도 여기에 있다.
export const ACCOUNT_SITE = (import.meta.env.VITE_ACCOUNT_API || 'https://studyapple.vercel.app').replace(/\/$/, '')

// 공용 로그인 화면으로 — 로그인하고 '부르마블'을 고르면 입장권을 들고 돌아온다
export function goToLogin() {
  window.location.href = `${ACCOUNT_SITE}/?next=boomarble`
}
