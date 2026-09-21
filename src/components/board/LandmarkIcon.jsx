// 도시 칸에 들어가는 랜드마크 아이콘 15종.
// 국기 대신 랜드마크를 쓰면 어느 나라 칸인지 한눈에 들어오고,
// 동물 아바타와 같은 외곽선·색감이라 보드 전체가 한 세트로 보인다.
// 36px 안팎에서 읽혀야 하므로 형태는 최대한 단순하게.

const LINE = '#5A2E1A'
const SW = 2.1

// 양파 지붕(성 바실리 대성당)처럼 반복되는 모양은 함수로 만든다.
function onion(cx, top, w, h) {
  return (
    `M${cx} ${top} C${cx + w} ${top + h * 0.3}, ${cx + w} ${top + h * 0.78}, ${cx} ${top + h} ` +
    `C${cx - w} ${top + h * 0.78}, ${cx - w} ${top + h * 0.3}, ${cx} ${top} Z`
  )
}

const LANDMARKS = {
  // 타이베이 101 — 단을 쌓아 올린 탑
  TW: (
    <g>
      <path d="M23 4 h2 v8 h-2 Z" fill="#9FB89C" />
      <path d="M19.5 12 h9 l1 7 h-11 Z" fill="#A8C4A2" />
      <path d="M18.5 19 h11 l1 7 h-13 Z" fill="#8FB28A" />
      <path d="M17.5 26 h13 l1 7 h-15 Z" fill="#A8C4A2" />
      <path d="M16 33 h16 l2 11 h-20 Z" fill="#8FB28A" />
    </g>
  ),
  // 베이징 천안문 — 노란 기와지붕 + 붉은 성벽
  CN: (
    <g>
      <path d="M7 23 L24 11 L41 23 Z" fill="#EFB63C" />
      <rect x="10" y="23" width="28" height="21" fill="#D9453C" />
      <path d="M20 32 h8 v12 h-8 Z" fill="#8E2A23" />
      <rect x="8" y="41" width="32" height="3" fill="#C2B39A" />
    </g>
  ),
  // 마닐라 대성당 — 돔과 십자가
  PH: (
    <g>
      <rect x="22.8" y="4" width="2.4" height="7" fill="#C9A227" />
      <rect x="20" y="6" width="8" height="2.4" fill="#C9A227" />
      <path d="M15 24 A9 9 0 0 1 33 24 Z" fill="#E8DCC2" />
      <rect x="15" y="24" width="18" height="20" fill="#F3EADA" />
      <path d="M21 34 A3 5 0 0 1 27 34 L27 44 h-6 Z" fill="#B98B4F" />
    </g>
  ),
  // 홍콩 — 높이가 다른 고층빌딩 스카이라인
  HK: (
    <g>
      <rect x="8" y="24" width="9" height="20" fill="#7FB3D5" />
      <rect x="19" y="12" width="10" height="32" fill="#4E8FC0" />
      <rect x="31" y="28" width="9" height="16" fill="#7FB3D5" />
      <g fill="#FDF3DC">
        <rect x="21.5" y="17" width="2" height="2" /><rect x="25" y="17" width="2" height="2" />
        <rect x="21.5" y="23" width="2" height="2" /><rect x="25" y="23" width="2" height="2" />
        <rect x="10.5" y="29" width="2" height="2" /><rect x="13.5" y="29" width="2" height="2" />
        <rect x="33.5" y="33" width="2" height="2" />
      </g>
    </g>
  ),
  // 도쿄 타워 — 붉은 철탑
  JP: (
    <g>
      <rect x="23" y="4" width="2" height="7" fill="#C23B22" />
      <path d="M24 9 L37 44 h-6 L24 22 L17 44 h-6 Z" fill="#E4572E" />
      <rect x="15" y="31" width="18" height="3.4" fill="#FDF3DC" />
      <rect x="19" y="20" width="10" height="3" fill="#FDF3DC" />
    </g>
  ),
  // 카이로 피라미드
  EG: (
    <g>
      <circle cx="37" cy="14" r="6" fill="#F6C453" />
      <path d="M3 44 L18 16 L33 44 Z" fill="#E4B95F" />
      <path d="M18 16 L18 44 L33 44 Z" fill="#CC9E45" />
      <path d="M29 44 L38 28 L47 44 Z" fill="#E4B95F" />
      <path d="M38 28 L38 44 L47 44 Z" fill="#CC9E45" />
    </g>
  ),
  // 아테네 파르테논 신전
  GR: (
    <g>
      <path d="M7 19 L24 8 L41 19 Z" fill="#E6DCC6" />
      <rect x="8" y="19" width="32" height="3.6" fill="#F3EADA" />
      <g fill="#F3EADA">
        <rect x="11" y="23" width="4" height="16" /><rect x="18" y="23" width="4" height="16" />
        <rect x="25" y="23" width="4" height="16" /><rect x="32" y="23" width="4" height="16" />
      </g>
      <rect x="7" y="39" width="34" height="5" fill="#E6DCC6" />
    </g>
  ),
  // 시드니 오페라하우스 — 겹쳐진 조개 지붕
  AU: (
    <g>
      <path d="M6 42 C6 28 14 21 23 20 C16 27 14 34 14 42 Z" fill="#F3EADA" />
      <path d="M15 42 C15 27 24 19 34 18 C26 26 23 34 23 42 Z" fill="#FBF6EC" />
      <path d="M25 42 C25 29 33 22 42 21 C35 28 33 35 33 42 Z" fill="#F3EADA" />
      <rect x="4" y="42" width="40" height="3" fill="#5FA8D3" />
    </g>
  ),
  // 모스크바 성 바실리 대성당 — 양파 지붕
  RU: (
    <g>
      <path d={onion(12, 16, 7, 12)} fill="#4E8FC0" />
      <path d={onion(36, 16, 7, 12)} fill="#5AA469" />
      <path d={onion(24, 6, 9, 15)} fill="#D9453C" />
      <rect x="8" y="28" width="8" height="16" fill="#F3EADA" />
      <rect x="32" y="28" width="8" height="16" fill="#F3EADA" />
      <rect x="18" y="21" width="12" height="23" fill="#FBF6EC" />
    </g>
  ),
  // 베를린 브란덴부르크 문
  DE: (
    <g>
      <rect x="18" y="4" width="12" height="6" fill="#C9A227" />
      <rect x="7" y="14" width="34" height="5" fill="#E6DCC6" />
      <g fill="#F3EADA">
        <rect x="9" y="19" width="4.5" height="21" /><rect x="16" y="19" width="4.5" height="21" />
        <rect x="27.5" y="19" width="4.5" height="21" /><rect x="34.5" y="19" width="4.5" height="21" />
      </g>
      <rect x="6" y="40" width="36" height="4" fill="#E6DCC6" />
    </g>
  ),
  // 런던 빅벤
  GB: (
    <g>
      <path d="M16 17 L24 4 L32 17 Z" fill="#C9A227" />
      <rect x="17" y="17" width="14" height="27" fill="#E0C48C" />
      <circle cx="24" cy="25" r="5.2" fill="#FDF3DC" />
      <path d="M24 22 L24 25 L26.6 26.4" stroke={LINE} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <rect x="15" y="40" width="18" height="4" fill="#C9A227" />
    </g>
  ),
  // 뉴욕 자유의 여신상 — 횃불 든 팔과 뿔 왕관으로 실루엣을 만든다
  US: (
    <g>
      <path d="M27 19 L34 9" stroke="#6FBF9B" strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <path d="M34 3 C37.5 7.5 37.5 11 34 12.5 C30.5 11 30.5 7.5 34 3 Z" fill="#F6C453" />
      <path d="M20 19 L14 37 h18 L26 19 Z" fill="#6FBF9B" />
      <circle cx="22.5" cy="14" r="5" fill="#6FBF9B" />
      <path d="M16.5 12.5 L18 6 L20.2 11 L22.5 4.5 L24.8 11 L27 6 L28.5 12.5 Z" fill="#6FBF9B" />
      <rect x="12" y="37" width="22" height="7" fill="#C9B79A" />
    </g>
  ),
  // 파리 에펠탑
  FR: (
    <g>
      <rect x="23.2" y="3" width="1.8" height="7" fill="#B07A3A" />
      <path d="M24 9 C24 20 20 30 11 44 L17 44 C21 33 23 25 24 19 C25 25 27 33 31 44 L37 44 C28 30 24 20 24 9 Z" fill="#C9903F" />
      <rect x="16" y="29" width="16" height="3.2" fill="#B07A3A" />
      <rect x="19.5" y="19" width="9" height="2.8" fill="#B07A3A" />
      <path d="M14 42 C18 36 30 36 34 42" stroke="#B07A3A" strokeWidth="2.6" fill="none" />
    </g>
  ),
  // 로마 콜로세움
  IT: (
    <g>
      <path d="M8 43 V25 A16 11 0 0 1 40 25 V43 Z" fill="#E6D3AC" />
      <g fill="#A97C4B">
        <rect x="12" y="24" width="4" height="7" rx="2" /><rect x="19" y="21.5" width="4" height="7" rx="2" />
        <rect x="26" y="21.5" width="4" height="7" rx="2" /><rect x="33" y="24" width="4" height="7" rx="2" />
        <rect x="12" y="34" width="4" height="8" rx="2" /><rect x="19" y="33" width="4" height="9" rx="2" />
        <rect x="26" y="33" width="4" height="9" rx="2" /><rect x="33" y="34" width="4" height="8" rx="2" />
      </g>
    </g>
  ),
  // 서울 N서울타워 — 남산 위에 올라앉은 전망대
  KR: (
    <g>
      <rect x="23" y="2" width="2" height="9" fill="#5A8FC7" />
      <path d="M21.5 11 h5 l1.5 5 h-8 Z" fill="#7FB3D5" />
      <ellipse cx="24" cy="20" rx="9.5" ry="5" fill="#4E8FC0" />
      <path d="M21 24 h6 l2.5 13 h-11 Z" fill="#D9D4CB" />
      <path d="M9 44 C15 32 33 32 39 44 Z" fill="#6BA368" />
    </g>
  ),
}

export default function LandmarkIcon({ code, className = '' }) {
  const art = LANDMARKS[code]
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
