// 국기 SVG (15개국). Windows Chrome이 flag emoji를 렌더링 못 하는 문제 해결.
// 모든 국기는 viewBox 60x40 기준 단순화된 표현 — 칸 크기에 따라 자동 스케일.

const FLAGS = {
  TW: (
    <>
      <rect width="60" height="40" fill="#FE0000" />
      <rect width="30" height="20" fill="#000095" />
      <circle cx="15" cy="10" r="5" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="2.5" fill="#000095" />
    </>
  ),
  CN: (
    <>
      <rect width="60" height="40" fill="#DE2910" />
      <text x="8" y="20" fontSize="14" fill="#FFDE00" fontWeight="bold">★</text>
      <text x="22" y="8" fontSize="6" fill="#FFDE00">★</text>
      <text x="26" y="13" fontSize="6" fill="#FFDE00">★</text>
      <text x="26" y="19" fontSize="6" fill="#FFDE00">★</text>
      <text x="22" y="23" fontSize="6" fill="#FFDE00">★</text>
    </>
  ),
  PH: (
    <>
      <rect width="60" height="20" fill="#0038A8" />
      <rect width="60" height="20" y="20" fill="#CE1126" />
      <polygon points="0,0 0,40 25,20" fill="#FFFFFF" />
      <text x="6" y="24" fontSize="9" fill="#FCD116" fontWeight="bold">☀</text>
    </>
  ),
  HK: (
    <>
      <rect width="60" height="40" fill="#DE2910" />
      <text x="22" y="28" fontSize="18" fill="#FFFFFF">✿</text>
    </>
  ),
  JP: (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="10" fill="#BC002D" />
    </>
  ),
  EG: (
    <>
      <rect width="60" height="13.34" fill="#CE1126" />
      <rect width="60" height="13.34" y="13.34" fill="#FFFFFF" />
      <rect width="60" height="13.32" y="26.68" fill="#000000" />
      <text x="25" y="24" fontSize="8" fill="#C09300">★</text>
    </>
  ),
  GR: (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      {[0, 8.89, 17.78, 26.67, 35.56].map((y) => (
        <rect key={y} width="60" height="4.44" y={y} fill="#0D5EAF" />
      ))}
      <rect width="20" height="22.22" fill="#0D5EAF" />
      <rect width="20" height="4.44" y="8.89" fill="#FFFFFF" />
      <rect x="7.78" width="4.44" height="22.22" fill="#FFFFFF" />
    </>
  ),
  AU: (
    <>
      <rect width="60" height="40" fill="#012169" />
      {/* Simplified Union Jack canton */}
      <line x1="0" y1="0" x2="30" y2="20" stroke="#FFFFFF" strokeWidth="3" />
      <line x1="30" y1="0" x2="0" y2="20" stroke="#FFFFFF" strokeWidth="3" />
      <rect width="30" height="3" y="8.5" fill="#FFFFFF" />
      <rect width="3" height="20" x="13.5" fill="#FFFFFF" />
      <rect width="30" height="1.5" y="9.25" fill="#E4002B" />
      <rect width="1.5" height="20" x="14.25" fill="#E4002B" />
      {/* Stars */}
      <text x="38" y="35" fontSize="9" fill="#FFFFFF" fontWeight="bold">★</text>
      <text x="48" y="14" fontSize="5" fill="#FFFFFF">★</text>
      <text x="42" y="20" fontSize="4" fill="#FFFFFF">★</text>
      <text x="52" y="22" fontSize="4" fill="#FFFFFF">★</text>
      <text x="50" y="30" fontSize="4" fill="#FFFFFF">★</text>
    </>
  ),
  RU: (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect width="60" height="13.33" y="13.33" fill="#0033A0" />
      <rect width="60" height="13.34" y="26.67" fill="#DA291C" />
    </>
  ),
  DE: (
    <>
      <rect width="60" height="13.33" fill="#000000" />
      <rect width="60" height="13.33" y="13.33" fill="#DD0000" />
      <rect width="60" height="13.34" y="26.67" fill="#FFCE00" />
    </>
  ),
  GB: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <line x1="0" y1="0" x2="60" y2="40" stroke="#FFFFFF" strokeWidth="6" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="6" />
      <line x1="0" y1="0" x2="60" y2="40" stroke="#C8102E" strokeWidth="3" />
      <line x1="60" y1="0" x2="0" y2="40" stroke="#C8102E" strokeWidth="3" />
      <rect width="60" height="8" y="16" fill="#FFFFFF" />
      <rect width="8" height="40" x="26" fill="#FFFFFF" />
      <rect width="60" height="4" y="18" fill="#C8102E" />
      <rect width="4" height="40" x="28" fill="#C8102E" />
    </>
  ),
  US: (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      {[0, 6.16, 12.32, 18.48, 24.64, 30.8, 36.92].map((y, i) => (
        <rect key={i} width="60" height="3.08" y={y} fill="#B22234" />
      ))}
      <rect width="24" height="21.5" fill="#3C3B6E" />
      <text x="2" y="16" fontSize="13" fill="#FFFFFF" fontWeight="bold">★</text>
    </>
  ),
  FR: (
    <>
      <rect width="20" height="40" fill="#0055A4" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#EF4135" />
    </>
  ),
  IT: (
    <>
      <rect width="20" height="40" fill="#009246" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#CE2B37" />
    </>
  ),
  KR: (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="9" fill="#CD2E3A" />
      <path d="M 21 20 A 9 9 0 0 1 30 11 A 4.5 4.5 0 1 1 30 20 A 4.5 4.5 0 1 0 30 29 A 9 9 0 0 1 21 20 Z" fill="#0047A0" />
      {/* 4 trigrams (simplified) */}
      <g fill="#000000">
        <rect x="6" y="9" width="7" height="1.2" />
        <rect x="6" y="11.5" width="7" height="1.2" />
        <rect x="6" y="14" width="7" height="1.2" />
        <rect x="47" y="9" width="7" height="1.2" />
        <rect x="47" y="11.5" width="3" height="1.2" />
        <rect x="51" y="11.5" width="3" height="1.2" />
        <rect x="47" y="14" width="7" height="1.2" />
        <rect x="6" y="25" width="3" height="1.2" />
        <rect x="10" y="25" width="3" height="1.2" />
        <rect x="6" y="27.5" width="7" height="1.2" />
        <rect x="6" y="30" width="3" height="1.2" />
        <rect x="10" y="30" width="3" height="1.2" />
        <rect x="47" y="25" width="3" height="1.2" />
        <rect x="51" y="25" width="3" height="1.2" />
        <rect x="47" y="27.5" width="3" height="1.2" />
        <rect x="51" y="27.5" width="3" height="1.2" />
        <rect x="47" y="30" width="7" height="1.2" />
      </g>
    </>
  ),
}

export default function FlagIcon({ code, className = '', size }) {
  const flag = FLAGS[code]
  if (!flag) return null
  return (
    <svg
      viewBox="0 0 60 40"
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      className={`inline-block rounded-sm shadow-sm ${className}`}
      style={{ width: size || '100%', height: size ? undefined : '100%' }}
    >
      {flag}
    </svg>
  )
}

export const FLAG_CODES = Object.keys(FLAGS)
