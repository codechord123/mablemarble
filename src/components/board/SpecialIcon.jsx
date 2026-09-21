// 특수칸(출발·황금열쇠·무인도·우주여행·세금·사회복지) 아이콘.
// 이모지는 기기·OS마다 그림이 달라서 보드 톤이 깨진다. 랜드마크·동물과 같은
// 외곽선과 색으로 직접 그려 하나의 세트로 묶는다.

const LINE = '#5A2E1A'
const SW = 2.1

const ICONS = {
  // 출발 — 체크무늬 깃발
  start: (
    <g>
      <path d="M13 6 v37" stroke={LINE} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M14 8 h24 v16 h-24 Z" fill="#FBF6EC" />
      <g fill={LINE} stroke="none">
        <rect x="14" y="8" width="6" height="5.3" /><rect x="26" y="8" width="6" height="5.3" />
        <rect x="20" y="13.3" width="6" height="5.3" /><rect x="32" y="13.3" width="6" height="5.3" />
        <rect x="14" y="18.6" width="6" height="5.4" /><rect x="26" y="18.6" width="6" height="5.4" />
      </g>
    </g>
  ),
  // 황금열쇠
  golden_key: (
    <g>
      <circle cx="17" cy="17" r="9" fill="#F6C453" />
      <circle cx="17" cy="17" r="3.4" fill="#FBF6EC" />
      <path d="M22 22 L38 38" stroke="#F6C453" strokeWidth="6" strokeLinecap="round" />
      <path d="M22 22 L38 38" stroke={LINE} strokeWidth="2.1" strokeLinecap="round" fill="none" />
      <path d="M31 36 L36 41" stroke="#F6C453" strokeWidth="6" strokeLinecap="round" />
      <path d="M31 36 L36 41" stroke={LINE} strokeWidth="2.1" strokeLinecap="round" fill="none" />
    </g>
  ),
  // 무인도 — 야자수가 있는 작은 섬
  island: (
    <g>
      <path d="M7 38 C14 31 34 31 41 38 Z" fill="#EFD79B" />
      <path d="M24 38 C24 30 24 24 24 20" stroke="#A9744F" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M24 20 C17 15 12 17 10 21 C15 19 20 20 24 23 Z" fill="#5AA469" />
      <path d="M24 20 C31 15 36 17 38 21 C33 19 28 20 24 23 Z" fill="#6BB877" />
      <path d="M4 40 C12 44 36 44 44 40 L44 44 L4 44 Z" fill="#5FA8D3" />
    </g>
  ),
  // 우주여행 — 로켓
  space: (
    <g>
      <path d="M24 4 C31 12 33 22 33 30 h-18 C15 22 17 12 24 4 Z" fill="#FBF6EC" />
      <path d="M15 26 L9 38 L16 34 Z" fill="#E4572E" />
      <path d="M33 26 L39 38 L32 34 Z" fill="#E4572E" />
      <circle cx="24" cy="17" r="4.6" fill="#5FA8D3" />
      <path d="M19 33 C21 41 27 41 29 33 Z" fill="#F6C453" />
    </g>
  ),
  // 세금 — 지폐 묶음
  tax: (
    <g>
      <rect x="7" y="16" width="34" height="20" rx="3" fill="#8FCB9B" />
      <rect x="10" y="12" width="34" height="20" rx="3" fill="#A8DDB5" />
      <circle cx="27" cy="22" r="5.4" fill="#FBF6EC" />
      <path d="M24.4 19.6 h5.2 M24.4 22 h5.2 M27 19 v6" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  ),
  // 사회복지 — 리본 달린 선물상자
  welfare: (
    <g>
      <rect x="9" y="19" width="30" height="6" rx="2" fill="#F6C453" />
      <rect x="11" y="25" width="26" height="18" rx="2" fill="#EF8FA6" />
      <rect x="21" y="19" width="6" height="24" fill="#F6C453" />
      <path d="M24 19 C20 19 16 16 17 12 C19 9 23 13 24 19 Z" fill="#F6C453" />
      <path d="M24 19 C28 19 32 16 31 12 C29 9 25 13 24 19 Z" fill="#F6C453" />
    </g>
  ),
}

export default function SpecialIcon({ type, className = '' }) {
  const art = ICONS[type]
  if (!art) return null
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <g stroke={LINE} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
        {art}
      </g>
    </svg>
  )
}
