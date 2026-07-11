// "부르마블" 로고 — 지구본 + 랜드마크 실루엣 + 주사위 + 리본 배너.
// 레퍼런스(상용 보드게임)의 따뜻하고 입체적인 톤을 순수 SVG/CSS로 재현.

function GlobeMark({ size = 132 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" fill="none" role="img" aria-label="부르마블 지구본">
      <defs>
        <radialGradient id="lg-globe" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="0.6" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </radialGradient>
        <linearGradient id="lg-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>

      {/* 랜드마크 실루엣 (지구본 뒤로 살짝 솟음) */}
      <g fill="#b45309" opacity="0.9">
        {/* 에펠탑 */}
        <path d="M34 58 L39 24 L44 58 L41 58 L39 40 L37 58 Z" />
        {/* 타워(빅벤류) */}
        <rect x="66" y="20" width="8" height="34" rx="1.5" />
        <path d="M66 20 L70 12 L74 20 Z" />
        {/* 자유의 여신상(단순화) */}
        <path d="M100 54 L100 30 L104 26 L108 30 L108 54 Z" />
        <circle cx="104" cy="24" r="4" />
      </g>

      {/* 지구본 */}
      <circle cx="70" cy="74" r="46" fill="url(#lg-globe)" stroke="#0369a1" strokeWidth="2.5" />
      {/* 대륙 */}
      <g fill="#4ade80" opacity="0.92">
        <path d="M46 60 q10 -6 20 0 q6 6 -2 12 q-10 4 -18 -2 q-6 -6 0 -10 Z" />
        <path d="M78 78 q12 -4 18 4 q4 8 -6 14 q-12 2 -16 -8 q-2 -6 4 -10 Z" />
        <path d="M54 92 q8 -2 12 4 q2 6 -6 8 q-8 0 -10 -6 q-1 -4 4 -6 Z" />
      </g>
      {/* 경위선 */}
      <g stroke="#e0f2fe" strokeWidth="1.5" fill="none" opacity="0.6">
        <ellipse cx="70" cy="74" rx="20" ry="46" />
        <line x1="24" y1="74" x2="116" y2="74" />
      </g>

      {/* 주사위 두 개 (앞쪽 아래) */}
      <g transform="rotate(-12 44 116)">
        <rect x="34" y="106" width="22" height="22" rx="6" fill="url(#lg-die)" stroke="#9ca3af" strokeWidth="1.5" />
        <circle cx="45" cy="117" r="2.4" fill="#374151" />
      </g>
      <g transform="rotate(10 96 116)">
        <rect x="86" y="106" width="22" height="22" rx="6" fill="url(#lg-die)" stroke="#9ca3af" strokeWidth="1.5" />
        <circle cx="92" cy="112" r="2.1" fill="#374151" />
        <circle cx="102" cy="122" r="2.1" fill="#374151" />
      </g>
    </svg>
  )
}

export default function Logo({ globeSize = 132, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="float-soft drop-shadow-md">
        <GlobeMark size={globeSize} />
      </div>

      {/* 워드마크 — 두꺼운 3D 레터링 (레이어드 섀도) */}
      <div className="logo-wordmark" aria-label="부르마블">부르마블</div>

      {/* 리본 배너 */}
      <div className="logo-ribbon">전 세계 도시를 사고 파는 여행!</div>
    </div>
  )
}
