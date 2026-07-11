// 명령형 juice 헬퍼 — Web Animations API 기반.
// React의 className 재조정과 무관하게 동작하므로 리렌더가 끼어들어도
// 애니메이션이 잘리지 않고, 매번 호출할 때마다 확실히 다시 재생된다.

function reduced() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// 요소를 톡 튀게 (입력·금액 강조). 겹쳐 호출돼도 최신 것이 자연스럽게 이어짐.
export function popEl(el, { scale = 1.16, duration = 280 } = {}) {
  if (!el || reduced() || typeof el.animate !== 'function') return
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: `scale(${scale})`, offset: 0.4 },
      { transform: 'scale(1)' },
    ],
    { duration, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  )
}

// 좌우로 흔들기 (오답 강조).
export function shakeEl(el, { duration = 480 } = {}) {
  if (!el || reduced() || typeof el.animate !== 'function') return
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px) rotate(-1deg)', offset: 0.15 },
      { transform: 'translateX(9px) rotate(1deg)', offset: 0.3 },
      { transform: 'translateX(-7px)', offset: 0.45 },
      { transform: 'translateX(5px)', offset: 0.6 },
      { transform: 'translateX(-3px)', offset: 0.75 },
      { transform: 'translateX(0)' },
    ],
    { duration, easing: 'ease-in-out' },
  )
}
