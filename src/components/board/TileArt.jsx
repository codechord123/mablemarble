// 보드 칸 그림 — 캔바 이미지 생성으로 만든 3D 미니어처(도시 랜드마크 15종 + 특수칸 6종).
// 인트로 일러스트와 같은 '반짝이는 점토 미니어처' 화풍으로 맞춰서, 인트로에서 본
// 섬들이 보드 위 칸으로 그대로 옮겨 온 것처럼 보이게 한다.
// 키는 도시의 국가 코드(소문자) 또는 특수칸 타입(start, island, …)이다.

const ART = import.meta.glob('../../assets/tiles/*.webp', { eager: true, import: 'default' })

export function tileArtSrc(key) {
  if (!key) return null
  return ART[`../../assets/tiles/${String(key).toLowerCase()}.webp`] || null
}

export default function TileArt({ artKey, alt = '', className = '' }) {
  const src = tileArtSrc(artKey)
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`tile-art block max-h-full max-w-full object-contain select-none ${className}`}
    />
  )
}
