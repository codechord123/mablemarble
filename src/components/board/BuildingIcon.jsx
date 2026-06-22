// 부르마블 클래식 스타일 건물 SVG. 레벨에 따라 크기/디테일이 커진다.
// size를 안 주면 부모 컨테이너에 100% 채움 (fluid 사이즈).

function Condo({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow" preserveAspectRatio="xMidYMid meet">
      <polygon points="2,14 16,3 30,14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.6" />
      <rect x="5" y="14" width="22" height="15" fill="#fef3c7" stroke="#92400e" strokeWidth="0.6" />
      <rect x="14" y="20" width="4" height="9" fill="#92400e" />
      <rect x="8" y="17" width="3" height="3" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.4" />
      <rect x="21" y="17" width="3" height="3" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.4" />
    </svg>
  )
}

function Apartment({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow" preserveAspectRatio="xMidYMid meet">
      <rect x="3" y="11" width="6" height="18" fill="#fde68a" stroke="#92400e" strokeWidth="0.6" />
      <rect x="10" y="4" width="12" height="25" fill="#fef3c7" stroke="#92400e" strokeWidth="0.6" />
      <rect x="23" y="11" width="6" height="18" fill="#fde68a" stroke="#92400e" strokeWidth="0.6" />
      {[7, 12, 17, 22].map((y) => (
        <g key={y}>
          <rect x="12" y={y} width="2.5" height="2.5" fill="#7dd3fc" />
          <rect x="17" y={y} width="2.5" height="2.5" fill="#7dd3fc" />
        </g>
      ))}
      <rect x="14.5" y="25" width="3" height="4" fill="#92400e" />
    </svg>
  )
}

function Hotel({ size = '100%' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="drop-shadow-md" preserveAspectRatio="xMidYMid meet">
      <polygon points="1,11 16,1 31,11" fill="#dc2626" stroke="#7f1d1d" strokeWidth="0.6" />
      <polygon points="14,3 16,1 18,3 17,5 15,5" fill="#facc15" />
      <rect x="2" y="11" width="28" height="19" fill="#fbbf24" stroke="#92400e" strokeWidth="0.8" />
      {[14, 19, 24].map((y) => (
        <g key={y}>
          {[4, 9, 14, 19, 24].map((x) => (
            <rect key={x} x={x} y={y} width="3" height="3" fill="#fef3c7" stroke="#92400e" strokeWidth="0.3" />
          ))}
        </g>
      ))}
      <rect x="13" y="24" width="6" height="6" fill="#7f1d1d" />
      <text x="16" y="29" fontSize="3" textAnchor="middle" fill="#fef3c7" fontWeight="bold">★</text>
    </svg>
  )
}

export default function BuildingIcon({ level, size }) {
  if (level === 1) return <Condo size={size} />
  if (level === 2) return <Apartment size={size} />
  if (level === 3) return <Hotel size={size} />
  return null
}
