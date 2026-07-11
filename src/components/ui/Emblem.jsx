// 부르마블 로고 엠블럼 — 세계 여행 테마(지구본) + 주사위.
// 순수 인라인 SVG라 어떤 기기에서도 동일하게 렌더된다.
export default function Emblem({ size = 96, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="img"
      aria-label="부르마블 로고"
    >
      <defs>
        <linearGradient id="emblem-globe" x1="20" y1="16" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d" />
          <stop offset="0.55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="emblem-die" x1="66" y1="66" x2="104" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#fef3c7" />
        </linearGradient>
        <radialGradient id="emblem-shine" cx="0.35" cy="0.3" r="0.8">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 지구본 */}
      <circle cx="54" cy="56" r="40" fill="url(#emblem-globe)" />
      {/* 경위선 */}
      <g stroke="#ffffff" strokeOpacity="0.65" strokeWidth="2" fill="none" strokeLinecap="round">
        <ellipse cx="54" cy="56" rx="40" ry="40" strokeOpacity="0.35" />
        <ellipse cx="54" cy="56" rx="16" ry="40" />
        <ellipse cx="54" cy="56" rx="34" ry="40" strokeOpacity="0.45" />
        <line x1="14" y1="56" x2="94" y2="56" />
        <path d="M18 38 H90" strokeOpacity="0.5" />
        <path d="M18 74 H90" strokeOpacity="0.5" />
      </g>
      {/* 빛 반사 */}
      <circle cx="54" cy="56" r="40" fill="url(#emblem-shine)" />

      {/* 주사위 — 오른쪽 아래에 살짝 겹쳐서 배치 */}
      <g transform="rotate(12 86 86)">
        <rect x="66" y="66" width="40" height="40" rx="11" fill="url(#emblem-die)" stroke="#f59e0b" strokeWidth="2.5" />
        <circle cx="79" cy="79" r="4.2" fill="#b45309" />
        <circle cx="93" cy="79" r="4.2" fill="#b45309" />
        <circle cx="79" cy="93" r="4.2" fill="#b45309" />
        <circle cx="93" cy="93" r="4.2" fill="#b45309" />
      </g>
    </svg>
  )
}
