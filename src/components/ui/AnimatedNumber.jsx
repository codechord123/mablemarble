import { useEffect, useRef } from 'react'
import { popEl } from '../../utils/juice.js'

// 값이 바뀌면 이전 값에서 새 값으로 숫자를 부드럽게 세어 올리고,
// 바뀌는 순간 살짝 튕기는 강조 효과를 준다.
export default function AnimatedNumber({ value, duration = 600, className = '' }) {
  const spanRef = useRef(null)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return

    popEl(spanRef.current, { scale: 1.18, duration: 420 })

    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const cur = Math.round(from + (to - from) * eased)
      if (spanRef.current) spanRef.current.textContent = cur.toLocaleString()
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        if (spanRef.current) spanRef.current.textContent = to.toLocaleString()
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      fromRef.current = to
    }
  }, [value, duration])

  return (
    <span ref={spanRef} className={`inline-block ${className}`}>
      {fromRef.current.toLocaleString()}
    </span>
  )
}
