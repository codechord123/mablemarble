// 부르마블 건물 — 레벨별로 지붕 색이 초록 → 파랑 → 빨강으로 커지는 progression.
// 그림은 캔바 이미지 생성으로 만든 3D 렌더(호텔을 기준 이미지로 삼아 세 채의
// 화풍·각도·외곽선을 맞췄다). 비스듬한 입체 시점으로 그려져 있어서 칸 위에
// 올리기만 해도 서 있는 건물처럼 보인다.
// size를 안 주면 부모 컨테이너를 100% 채운다.

import condo from '../../assets/buildings/b1_condo.png'
import apartment from '../../assets/buildings/b2_apartment.png'
import hotel from '../../assets/buildings/b3_hotel.png'

const ART = {
  1: { src: condo, alt: '콘도' },
  2: { src: apartment, alt: '아파트' },
  3: { src: hotel, alt: '호텔' },
}

export default function BuildingIcon({ level, size, className = '' }) {
  const art = ART[level]
  if (!art) return null
  return (
    <img
      src={art.src}
      alt={art.alt}
      draggable={false}
      className={`block object-contain select-none ${className}`}
      style={{ width: size ?? '100%', height: size ?? '100%' }}
    />
  )
}
