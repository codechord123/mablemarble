// 동물 캐릭터 아바타 10종을 SVG로 직접 그린다.
// 이모지를 쓰면 기기마다 모양이 달라지고, 이미지로 만들면 10마리 화풍을 맞추기 어렵다.
// 같은 머리 모양·같은 선 굵기·같은 눈 위에 털색과 귀 모양만 바꿔 끼우는 구조라
// 10마리가 자동으로 한 세트로 보인다. 28px까지 줄여도 실루엣이 유지된다.

import { useId } from 'react'

const LINE = '#5A2E1A' // 공통 외곽선
const SW = 4.2 // 공통 선 굵기
const EYE = '#3B2116'

// 사자 갈기처럼 가장자리가 물결치는 원. 바깥 반지름과 봉우리 수로 경로를 만든다.
function scallop(cx, cy, rOuter, rInner, bumps) {
  const step = Math.PI / bumps
  let d = ''
  for (let i = 0; i < bumps * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = i * step - Math.PI / 2
    const x = cx + Math.cos(a) * r
    const y = cy + Math.sin(a) * r
    d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d + 'Z'
}

const MANE = scallop(50, 55, 42, 33, 13)

// 동물별로 달라지는 부분만 정의. 나머지 생김새는 전부 공통.
const SPECS = {
  '🐶': { key: 'dog', label: '강아지', fur: '#EFAC61', shade: '#D98B3A', ear: 'point', earIn: '#C9762E', muzzle: '#F8EAD2', nose: '#3B2116', brows: true },
  '🐱': { key: 'cat', label: '고양이', fur: '#A9A6A2', shade: '#8C8985', ear: 'point', earIn: '#EFA9AE', muzzle: '#F4EFE6', nose: '#E58B97', whiskers: true },
  '🐰': { key: 'rabbit', label: '토끼', fur: '#FBF6F0', shade: '#E4D9CC', ear: 'long', earIn: '#F3AEB4', muzzle: '#FFFFFF', nose: '#E58B97', whiskers: true },
  '🦊': { key: 'fox', label: '여우', fur: '#F2833E', shade: '#D96A26', ear: 'point', earIn: '#3B2116', muzzle: '#FDF6EC', nose: '#3B2116', brows: true },
  '🐻': { key: 'bear', label: '곰', fur: '#B07A4E', shade: '#94623A', ear: 'round', earIn: '#8A5A34', muzzle: '#EBD0AC', nose: '#3B2116' },
  '🐼': { key: 'panda', label: '판다', fur: '#FBF7F2', shade: '#E2DAD0', ear: 'round', earIn: '#2E2118', earFill: '#33261C', muzzle: '#FFFFFF', nose: '#33261C', patches: true },
  '🦁': { key: 'lion', label: '사자', fur: '#F4BC55', shade: '#DDA038', ear: 'round', earIn: '#D98B3A', muzzle: '#FBEBC8', nose: '#3B2116', mane: '#DD9A32' },
  '🐯': { key: 'tiger', label: '호랑이', fur: '#F9A63C', shade: '#E08A20', ear: 'round', earIn: '#E08A20', muzzle: '#FDF3E2', nose: '#3B2116', stripes: true },
  '🐵': { key: 'monkey', label: '원숭이', fur: '#AB7950', shade: '#8D6039', ear: 'side', earIn: '#E9BE93', muzzle: '#EDC49B', nose: '#5A3A22', facePatch: '#E9BE93' },
  '🐸': { key: 'frog', label: '개구리', fur: '#5FBE4E', shade: '#48A339', ear: 'none', muzzle: null, nose: '#2F6B26', bulgeEyes: true, wideMouth: true },
}

export const ANIMAL_KEYS = Object.keys(SPECS)

export function animalLabel(emoji) {
  return SPECS[emoji]?.label || ''
}

function Ears({ spec }) {
  const fill = spec.earFill || spec.fur
  const common = { fill, stroke: LINE, strokeWidth: SW, strokeLinejoin: 'round' }
  if (spec.ear === 'point') {
    return (
      <g>
        <path d="M23 44 L26 11 L49 29 Z" {...common} />
        <path d="M77 44 L74 11 L51 29 Z" {...common} />
        <path d="M29 38 L31 21 L43 31 Z" fill={spec.earIn} />
        <path d="M71 38 L69 21 L57 31 Z" fill={spec.earIn} />
      </g>
    )
  }
  if (spec.ear === 'round') {
    return (
      <g>
        <circle cx="25" cy="27" r="13" {...common} />
        <circle cx="75" cy="27" r="13" {...common} />
        <circle cx="25" cy="27" r="6.5" fill={spec.earIn} />
        <circle cx="75" cy="27" r="6.5" fill={spec.earIn} />
      </g>
    )
  }
  if (spec.ear === 'long') {
    return (
      <g>
        <ellipse cx="36" cy="20" rx="9" ry="21" transform="rotate(-11 36 20)" {...common} />
        <ellipse cx="64" cy="20" rx="9" ry="21" transform="rotate(11 64 20)" {...common} />
        <ellipse cx="36" cy="21" rx="4.2" ry="14" transform="rotate(-11 36 21)" fill={spec.earIn} />
        <ellipse cx="64" cy="21" rx="4.2" ry="14" transform="rotate(11 64 21)" fill={spec.earIn} />
      </g>
    )
  }
  if (spec.ear === 'side') {
    return (
      <g>
        <circle cx="16" cy="56" r="12" {...common} />
        <circle cx="84" cy="56" r="12" {...common} />
        <circle cx="16" cy="56" r="6" fill={spec.earIn} />
        <circle cx="84" cy="56" r="6" fill={spec.earIn} />
      </g>
    )
  }
  return null
}

// 개구리 눈 혹. 머리보다 먼저 그려서 머리 위로 솟은 부분만 보이게 한다.
function EyeBulges({ spec }) {
  return (
    <g fill={spec.fur} stroke={LINE} strokeWidth={SW}>
      <circle cx="27" cy="26" r="14" />
      <circle cx="73" cy="26" r="14" />
    </g>
  )
}

function Eyes({ spec }) {
  if (spec.bulgeEyes) {
    return (
      <g>
        <circle cx="27" cy="26" r="8" fill="#fff" stroke={LINE} strokeWidth="2.6" />
        <circle cx="73" cy="26" r="8" fill="#fff" stroke={LINE} strokeWidth="2.6" />
        <circle cx="27" cy="27" r="4.6" fill={EYE} />
        <circle cx="73" cy="27" r="4.6" fill={EYE} />
        <circle cx="25.2" cy="24.6" r="1.8" fill="#fff" />
        <circle cx="71.2" cy="24.6" r="1.8" fill="#fff" />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx="38" cy="55" rx="7" ry="8.2" fill={EYE} />
      <ellipse cx="62" cy="55" rx="7" ry="8.2" fill={EYE} />
      <circle cx="35.6" cy="51.6" r="2.7" fill="#fff" />
      <circle cx="59.6" cy="51.6" r="2.7" fill="#fff" />
    </g>
  )
}

export default function AnimalFace({ emoji, size, className = '', title }) {
  const uid = useId().replace(/:/g, '')
  const spec = SPECS[emoji]

  // 등록되지 않은 아바타는 원래 문자를 그대로 보여준다 (저장된 예전 게임 호환)
  if (!spec) {
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
        {emoji}
      </span>
    )
  }

  const gloss = `gl-${uid}`
  const noseY = spec.wideMouth ? 56 : 61

  return (
    <svg
      viewBox="0 0 100 100"
      {...(size ? { width: size, height: size } : {})}
      className={className}
      role="img"
      aria-label={title || spec.label}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={gloss} cx="38%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
        </radialGradient>
      </defs>

      {spec.mane && <path d={MANE} fill={spec.mane} stroke={LINE} strokeWidth={SW} strokeLinejoin="round" />}

      {spec.bulgeEyes ? <EyeBulges spec={spec} /> : <Ears spec={spec} />}

      <ellipse cx="50" cy="56" rx="31" ry="29" fill={spec.fur} stroke={LINE} strokeWidth={SW} />

      {/* 아래쪽을 살짝 어둡게 해 입체감을 준다 */}
      <ellipse cx="50" cy="66" rx="30" ry="19" fill={spec.shade} opacity="0.28" />

      {spec.facePatch && <ellipse cx="50" cy="62" rx="21" ry="20" fill={spec.facePatch} />}

      {spec.patches && (
        <g fill="#33261C">
          <ellipse cx="37" cy="54" rx="11" ry="12.5" transform="rotate(-20 37 54)" />
          <ellipse cx="63" cy="54" rx="11" ry="12.5" transform="rotate(20 63 54)" />
        </g>
      )}

      {spec.stripes && (
        <g stroke={LINE} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M50 30 L50 39" />
          <path d="M41 32 L38.5 40" />
          <path d="M59 32 L61.5 40" />
          <path d="M23 50 L31 52" />
          <path d="M77 50 L69 52" />
        </g>
      )}

      {spec.brows && (
        <g fill={spec.muzzle}>
          <ellipse cx="37" cy="40" rx="6.8" ry="4.4" />
          <ellipse cx="63" cy="40" rx="6.8" ry="4.4" />
        </g>
      )}

      {spec.muzzle && <ellipse cx="50" cy="70" rx="23" ry="14" fill={spec.muzzle} />}

      <Eyes spec={spec} />

      {/* 코 */}
      {spec.wideMouth ? (
        <g fill={spec.nose}>
          <circle cx="45" cy="52" r="2.1" />
          <circle cx="55" cy="52" r="2.1" />
        </g>
      ) : (
        <path
          d={`M50 ${noseY + 5.5} C45 ${noseY + 5.5} 42.6 ${noseY + 2.6} 42.6 ${noseY} C42.6 ${noseY - 2.6} 46 ${noseY - 3.4} 50 ${noseY - 3.4} C54 ${noseY - 3.4} 57.4 ${noseY - 2.6} 57.4 ${noseY} C57.4 ${noseY + 2.6} 55 ${noseY + 5.5} 50 ${noseY + 5.5} Z`}
          fill={spec.nose}
        />
      )}

      {/* 입 */}
      <g stroke={LINE} strokeWidth="2.6" strokeLinecap="round" fill="none">
        {spec.wideMouth ? (
          <path d="M29 61 Q50 80 71 61" />
        ) : (
          <>
            <path d={`M50 ${noseY + 5} Q50 ${noseY + 11} 43 ${noseY + 9}`} />
            <path d={`M50 ${noseY + 5} Q50 ${noseY + 11} 57 ${noseY + 9}`} />
          </>
        )}
      </g>

      {spec.whiskers && (
        <g stroke={LINE} strokeWidth="1.9" strokeLinecap="round" opacity="0.75">
          <path d="M22 64 L10 61" />
          <path d="M22 69 L10 70" />
          <path d="M78 64 L90 61" />
          <path d="M78 69 L90 70" />
        </g>
      )}

      {/* 볼터치 */}
      <g fill="#EF9AA1" opacity="0.6">
        <ellipse cx="25" cy="63" rx="6.5" ry="4.2" />
        <ellipse cx="75" cy="63" rx="6.5" ry="4.2" />
      </g>

      {/* 광택 — 맨 위에 덮어 전체를 하나의 입체로 묶는다 */}
      <ellipse cx="50" cy="56" rx="31" ry="29" fill={`url(#${gloss})`} />
      <ellipse cx="50" cy="56" rx="31" ry="29" fill="none" stroke={LINE} strokeWidth={SW} />
    </svg>
  )
}
