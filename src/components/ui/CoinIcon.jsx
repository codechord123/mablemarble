// 금화 아이콘 — 💰 이모지 대신 일관된 SVG. 원화(₩) 각인.
export default function CoinIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block align-[-0.15em] ${className}`}
      role="img"
      aria-label="원"
    >
      <defs>
        <linearGradient id="coin-face" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#coin-face)" stroke="#b45309" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="7.3" fill="none" stroke="#fef3c7" strokeWidth="1.1" strokeOpacity="0.8" />
      <text
        x="12"
        y="16.2"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#92400e"
        fontFamily="Pretendard Variable, sans-serif"
      >
        ₩
      </text>
    </svg>
  )
}
