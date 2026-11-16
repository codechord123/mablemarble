// 새 버전 알림 — 배포가 바뀌면 화면 위에 '새로고침' 띠를 띄운다.
// 이미 열려 있는 화면은 예전 버전으로 계속 돌아가서, 아이들이 새로고침을 안 하면 고친 게 안 보였다.
// 3분마다(그리고 다시 화면으로 돌아올 때) 첫 페이지를 받아 와서 지금 쓰는 파일 이름(해시)과 비교한다.
import { useEffect, useState } from 'react'

const CHECK_MS = 3 * 60 * 1000
const assetOf = (html) => (html.match(/\/assets\/index-[\w-]+\.js/) || [])[0] || null

export default function UpdateNotice() {
  const [stale, setStale] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    const mine = document.querySelector('script[type="module"][src*="/assets/index-"]')?.getAttribute('src')
    if (!mine) return
    let alive = true
    const check = async () => {
      if (document.hidden) return
      try {
        const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' })
        const latest = assetOf(await res.text())
        if (alive && latest && !mine.endsWith(latest)) setStale(true)
      } catch {
        /* 인터넷이 잠깐 끊긴 건 무시 */
      }
    }
    const t = setInterval(check, CHECK_MS)
    const onVis = () => !document.hidden && check()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      alive = false
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  if (!stale) return null
  return (
    <div className="fixed inset-x-0 top-2 z-[100] mx-auto flex w-fit max-w-[95%] items-center gap-2 rounded-full bg-violet-600 py-1.5 pl-4 pr-1.5 text-sm font-black text-white shadow-xl" role="alert">
      🆕 새 버전이 나왔어요!
      <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-white px-3 py-1 text-violet-700">
        새로고침
      </button>
    </div>
  )
}
