// 화면 회전·크기 감지. 보드 레이아웃이 가로/세로 모드에 적응할 수 있게.

import { useEffect, useState } from 'react'

function read() {
  if (typeof window === 'undefined') {
    return { w: 1024, h: 768, isLandscape: true, isCompact: false }
  }
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    w,
    h,
    isLandscape: w > h,
    isCompact: Math.min(w, h) < 480, // 폰 크기
  }
}

export default function useViewport() {
  const [vp, setVp] = useState(read)

  useEffect(() => {
    let raf = 0
    const onChange = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setVp(read()))
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('orientationchange', onChange)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])

  return vp
}
