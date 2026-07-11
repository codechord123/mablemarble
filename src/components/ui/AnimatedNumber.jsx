import { useEffect, useRef, useState } from 'react'

// 값이 바뀌면 이전 값에서 새 값으로 숫자를 부드럽게 세어 올리고,
// 바뀌는 순간 살짝 튕기는 강조 효과를 준다.
export default function AnimatedNumber({ value, duration = 600, className = '' }) {
  const [display, setDisplay] = useState(value)
  const [pop, setPop] = useState(false)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return

    // 값 변경 강조 (증가/감소 무관)
    setPop(true)
    const popTimer = setTimeout(() => setPop(false), 450)

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(popTimer)
      fromRef.current = to
    }
  }, [value, duration])

  return (
    <span className={`inline-block ${pop ? 'value-pop' : ''} ${className}`}>
      {display.toLocaleString()}
    </span>
  )
}
