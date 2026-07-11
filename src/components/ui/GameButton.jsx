// 상용 보드게임 스타일 3D 글로시 버튼.
// 아래쪽 단(ledge)과 상단 하이라이트로 입체감, 누르면 살짝 눌리는 촉감.
const PALETTE = {
  orange: ['#fb923c', '#ea580c', '#9a3412'],
  amber: ['#fbbf24', '#d97706', '#92400e'],
  green: ['#4ade80', '#16a34a', '#15803d'],
  blue: ['#60a5fa', '#2563eb', '#1e40af'],
  yellow: ['#fcd34d', '#f59e0b', '#b45309'],
  red: ['#f87171', '#dc2626', '#991b1b'],
  gray: ['#d1d5db', '#9ca3af', '#6b7280'],
}

export default function GameButton({
  color = 'amber',
  children,
  className = '',
  disabled,
  style,
  ...props
}) {
  const [light, base, dark] = PALETTE[color] || PALETTE.amber
  return (
    <button
      {...props}
      disabled={disabled}
      className={`relative select-none rounded-2xl font-extrabold text-white leading-tight transition-transform duration-75 active:translate-y-[3px] disabled:opacity-50 disabled:active:translate-y-0 ${className}`}
      style={{
        background: `linear-gradient(180deg, ${light}, ${base})`,
        boxShadow: `0 5px 0 ${dark}, 0 8px 14px rgba(69,26,3,0.18), inset 0 1px 0 rgba(255,255,255,0.55)`,
        textShadow: '0 1px 1px rgba(0,0,0,0.22)',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
