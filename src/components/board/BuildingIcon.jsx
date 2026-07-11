// 부르마블 건물 SVG — 레벨별로 지붕 색이 초록→파랑→빨강으로 커지는 progression.
// (레퍼런스 아트: 1단계 초록·2단계 파랑·3단계 빨강 지붕)
// size를 안 주면 부모 컨테이너에 100% 채움 (fluid 사이즈).

// 콘도(1) — 아담한 초록 지붕 단독주택
function Condo({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow" preserveAspectRatio="xMidYMid meet">
      <rect x="6" y="15" width="20" height="14" rx="1.5" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="4,16 16,6 28,16" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points="4,16 16,6 16,8 6,16" fill="#4ade80" opacity="0.7" />
      <rect x="13.5" y="21" width="5" height="8" rx="0.5" fill="#92400e" />
      <circle cx="17.4" cy="25" r="0.5" fill="#fde68a" />
      <rect x="8" y="18" width="3.5" height="3.5" rx="0.4" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.4" />
      <rect x="20.5" y="18" width="3.5" height="3.5" rx="0.4" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.4" />
    </svg>
  )
}

// 아파트(2) — 파랑 지붕 2층 건물
function Apartment({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow" preserveAspectRatio="xMidYMid meet">
      <rect x="6" y="12" width="20" height="17" rx="1.5" fill="#fef3c7" stroke="#b45309" strokeWidth="0.8" />
      <polygon points="4,13 16,5 28,13" fill="#3b82f6" stroke="#1e40af" strokeWidth="0.8" strokeLinejoin="round" />
      <polygon points="4,13 16,5 16,7 6,13" fill="#60a5fa" opacity="0.7" />
      {[15, 21].map((y) => (
        <g key={y}>
          {[8.5, 14, 19.5].map((x) => (
            <rect key={x} x={x} y={y} width="3" height="3" rx="0.4" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.4" />
          ))}
        </g>
      ))}
      <rect x="13.5" y="25.5" width="5" height="3.5" rx="0.4" fill="#92400e" />
    </svg>
  )
}

// 호텔(3) — 빨강 지붕 고급 건물 + 별
function Hotel({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow-md" preserveAspectRatio="xMidYMid meet">
      <rect x="5" y="11" width="22" height="18" rx="1.5" fill="#fbbf24" stroke="#b45309" strokeWidth="0.9" />
      <polygon points="3,12 16,3 29,12" fill="#ef4444" stroke="#991b1b" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points="3,12 16,3 16,5 5,12" fill="#f87171" opacity="0.7" />
      <polygon points="14.6,4 16,2.3 17.4,4 16.7,5.6 15.3,5.6" fill="#fde047" stroke="#ca8a04" strokeWidth="0.3" />
      {[14, 19, 24].map((y) => (
        <g key={y}>
          {[7, 11.5, 16, 20.5].map((x) => (
            <rect key={x} x={x} y={y} width="3" height="3" rx="0.4" fill="#fef3c7" stroke="#b45309" strokeWidth="0.3" />
          ))}
        </g>
      ))}
      <rect x="13.5" y="25.5" width="5" height="3.5" rx="0.4" fill="#7f1d1d" />
    </svg>
  )
}

export default function BuildingIcon({ level, size }) {
  if (level === 1) return <Condo size={size} />
  if (level === 2) return <Apartment size={size} />
  if (level === 3) return <Hotel size={size} />
  return null
}
