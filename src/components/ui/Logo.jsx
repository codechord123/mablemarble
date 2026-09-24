// "부르마블" 로고 — 캔바로 그린 엠블럼(지구본 + 랜드마크 + 주사위 + 금화) 위에
// 코드로 그린 3D 한글 워드마크와 리본 배너를 얹는다.
// 한글 글자는 이미지 생성이 자주 틀리므로 글자만은 CSS로 그린다.

import emblem from '../../assets/art/logo-emblem.webp'

// size는 CSS 길이(예: 'clamp(150px, 24vh, 250px)')도 받는다 — 화면 높이에 맞춰 커지게.
export default function Logo({ size = 180, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src={emblem}
        alt="부르마블 엠블럼"
        className="logo-emblem float-soft select-none"
        style={{ width: size, height: size }}
        draggable={false}
      />

      {/* 워드마크 — 두꺼운 3D 레터링 (레이어드 섀도) */}
      <div className="logo-wordmark" aria-label="부르마블">부르마블</div>

      {/* 리본 배너 */}
      <div className="logo-ribbon">전 세계 도시를 사고 파는 여행!</div>
    </div>
  )
}
