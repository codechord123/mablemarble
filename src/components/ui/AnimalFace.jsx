// 플레이어 캐릭터 얼굴 10종.
// 캔바 이미지 생성으로 만든 3D 점토 스타일 동물 얼굴이다. 보드 칸의 3D 미니어처,
// 인트로 일러스트와 같은 화풍이라 한 게임 안에서 그림 톤이 맞는다.
// 저장된 게임과 호환되도록 아바타 값은 예전처럼 이모지 문자를 키로 쓴다.

const ART = import.meta.glob('../../assets/avatars/*.webp', { eager: true, import: 'default' })

const SPECS = {
  '🐶': { key: 'dog', label: '강아지' },
  '🐱': { key: 'cat', label: '고양이' },
  '🐰': { key: 'rabbit', label: '토끼' },
  '🦊': { key: 'fox', label: '여우' },
  '🐻': { key: 'bear', label: '곰' },
  '🐼': { key: 'panda', label: '판다' },
  '🦁': { key: 'lion', label: '사자' },
  '🐯': { key: 'tiger', label: '호랑이' },
  '🐵': { key: 'monkey', label: '원숭이' },
  '🐸': { key: 'frog', label: '개구리' },
}

export const ANIMAL_KEYS = Object.keys(SPECS)

export function animalLabel(emoji) {
  return SPECS[emoji]?.label || ''
}

export function animalSrc(emoji) {
  const spec = SPECS[emoji]
  return spec ? ART[`../../assets/avatars/${spec.key}.webp`] : null
}

export default function AnimalFace({ emoji, size, className = '', title }) {
  const spec = SPECS[emoji]
  const src = animalSrc(emoji)

  // 등록되지 않은 아바타는 원래 문자를 그대로 보여준다 (저장된 예전 게임 호환)
  if (!spec || !src) {
    return (
      <span className={className} style={{ fontSize: size ? size * 0.8 : undefined, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={title || spec.label}
      draggable={false}
      className={`block object-contain select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    />
  )
}
