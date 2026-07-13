// 넓이 문제용 도형 그림(SVG). figure 스펙을 받아 치수 라벨과 함께 그린다.
// figure 예: { shape:'triangle', base:8, height:5, unit:'cm' }
// shape: rectangle | parallelogram | triangle | rhombus | house | paratri
// 그림은 개념 설명용이라 실제 비율과 정확히 일치하지 않을 수 있음(교과서식).

const FILL = '#fef3c7'
const STROKE = '#b45309'
const DIM = '#dc2626' // 높이·대각선 등 보조선
const LABEL = '#7c2d12'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

// 오른쪽 아래 직각 표시
function RightAngle({ x, y, dx = 1, dy = -1, size = 8 }) {
  return (
    <path
      d={`M ${x} ${y + dy * size} L ${x + dx * size} ${y + dy * size} L ${x + dx * size} ${y}`}
      fill="none"
      stroke={DIM}
      strokeWidth="1.4"
    />
  )
}

function Rectangle({ w, h, unit }) {
  const a = clamp(w / h, 0.5, 2.2)
  let rw = 120, rh = 120 / a
  if (rh > 84) { rh = 84; rw = 84 * a }
  const x0 = (200 - rw) / 2, y0 = 20
  return (
    <>
      <rect x={x0} y={y0} width={rw} height={rh} rx="3" fill={FILL} stroke={STROKE} strokeWidth="2.5" />
      <text x={x0 + rw / 2} y={y0 + rh + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {w} {unit}
      </text>
      <text x={x0 - 10} y={y0 + rh / 2} textAnchor="end" dominantBaseline="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {h} {unit}
      </text>
    </>
  )
}

function Parallelogram({ base, height, slant, unit }) {
  const a = clamp(base / height, 0.7, 2.4)
  let bw = 118, bh = 118 / a
  if (bh > 78) { bh = 78; bw = 78 * a }
  const skew = Math.min(34, bw * 0.34)
  const x0 = (200 - bw - skew) / 2, yBot = 20 + bh
  const p = [
    [x0 + skew, 20],
    [x0 + skew + bw, 20],
    [x0 + bw, yBot],
    [x0, yBot],
  ]
  const hx = x0 + skew // 높이 보조선 x (왼쪽 위 꼭짓점에서 아래로)
  return (
    <>
      <polygon points={p.map((q) => q.join(',')).join(' ')} fill={FILL} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 높이 (점선 + 직각) */}
      <line x1={hx} y1={20} x2={hx} y2={yBot} stroke={DIM} strokeWidth="1.8" strokeDasharray="4 3" />
      <RightAngle x={hx} y={yBot} dx={1} dy={-1} />
      <text x={hx - 6} y={(20 + yBot) / 2} textAnchor="end" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={DIM}>
        {height} {unit}
      </text>
      {/* 밑변 */}
      <text x={(x0 + x0 + bw) / 2} y={yBot + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {base} {unit}
      </text>
      {/* 옆변(함정) */}
      {slant != null && (
        <text x={x0 + skew + bw + 8} y={(20 + yBot) / 2} textAnchor="start" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={STROKE}>
          {slant} {unit}
        </text>
      )}
    </>
  )
}

function Triangle({ base, height, side, unit }) {
  const a = clamp(base / height, 0.7, 2.4)
  let bw = 118, bh = 118 / a
  if (bh > 82) { bh = 82; bw = 82 * a }
  const x0 = (200 - bw) / 2, yBot = 20 + bh
  const apexX = x0 + bw * 0.62 // 살짝 치우친 꼭짓점
  const p = [
    [x0, yBot],
    [x0 + bw, yBot],
    [apexX, 20],
  ]
  return (
    <>
      <polygon points={p.map((q) => q.join(',')).join(' ')} fill={FILL} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 높이 (꼭짓점 → 밑변, 점선 + 직각) */}
      <line x1={apexX} y1={20} x2={apexX} y2={yBot} stroke={DIM} strokeWidth="1.8" strokeDasharray="4 3" />
      <RightAngle x={apexX} y={yBot} dx={-1} dy={-1} />
      <text x={apexX + 6} y={(20 + yBot) / 2} textAnchor="start" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={DIM}>
        {height} {unit}
      </text>
      {/* 밑변 */}
      <text x={x0 + bw / 2} y={yBot + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {base} {unit}
      </text>
      {/* 한 변(함정) */}
      {side != null && (
        <text x={(x0 + bw + apexX) / 2 + 8} y={(20 + yBot) / 2} textAnchor="start" dominantBaseline="middle" fontSize="13" fontWeight="700" fill={STROKE}>
          {side} {unit}
        </text>
      )}
    </>
  )
}

function Rhombus({ d1, d2, unit }) {
  // d1 = 가로 대각선(hw), d2 = 세로 대각선(hh). a = hw/hh = d1/d2
  const a = clamp(d1 / d2, 0.5, 2.0)
  // 세로 반지름 hh는 48 이하로 제한 → 도형+아래 라벨이 viewBox(150) 안에 들어옴
  let hh = 48, hw = 48 * a
  if (hw > 66) { hw = 66; hh = 66 / a }
  const cx = 100, cy = 20 + hh
  const p = [
    [cx, cy - hh],
    [cx + hw, cy],
    [cx, cy + hh],
    [cx - hw, cy],
  ]
  return (
    <>
      <polygon points={p.map((q) => q.join(',')).join(' ')} fill={FILL} stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 대각선 (점선) */}
      <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} stroke={DIM} strokeWidth="1.8" strokeDasharray="4 3" />
      <line x1={cx} y1={cy - hh} x2={cx} y2={cy + hh} stroke={DIM} strokeWidth="1.8" strokeDasharray="4 3" />
      <text x={cx} y={cy + hh + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {d1} {unit}
      </text>
      <text x={cx + hw + 8} y={cy} textAnchor="start" dominantBaseline="middle" fontSize="14" fontWeight="700" fill={LABEL}>
        {d2} {unit}
      </text>
    </>
  )
}

function House({ w, h, roofH, unit }) {
  const rw = 96, rh = 62
  const x0 = (200 - rw) / 2, yTop = 34, yBot = yTop + rh
  const apexX = x0 + rw / 2, apexY = yTop - 26
  return (
    <>
      {/* 삼각형 지붕 */}
      <polygon points={`${x0},${yTop} ${x0 + rw},${yTop} ${apexX},${apexY}`} fill="#fecaca" stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />
      <line x1={apexX} y1={apexY} x2={apexX} y2={yTop} stroke={DIM} strokeWidth="1.6" strokeDasharray="3 3" />
      <text x={apexX + 6} y={(apexY + yTop) / 2} textAnchor="start" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={DIM}>
        {roofH} {unit}
      </text>
      {/* 직사각형 몸통 */}
      <rect x={x0} y={yTop} width={rw} height={rh} fill={FILL} stroke={STROKE} strokeWidth="2.2" />
      <text x={x0 + rw / 2} y={yBot + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={LABEL}>{w} {unit}</text>
      <text x={x0 - 8} y={yTop + rh / 2} textAnchor="end" dominantBaseline="middle" fontSize="12" fontWeight="700" fill={LABEL}>{h} {unit}</text>
    </>
  )
}

function ParaTri({ base, pHeight, tHeight, unit }) {
  const pw = 92, ph = 66, skew = 26
  const x0 = 24, yTop = 22, yBot = yTop + ph
  // 평행사변형
  const para = [[x0 + skew, yTop], [x0 + skew + pw, yTop], [x0 + pw, yBot], [x0, yBot]]
  // 오른쪽에 삼각형 (밑변을 공유하듯 이어 붙임)
  const tx = x0 + skew + pw
  const tri = [[x0 + pw, yBot], [tx, yTop], [tx + 30, yBot]]
  return (
    <>
      <polygon points={para.map((q) => q.join(',')).join(' ')} fill={FILL} stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />
      <polygon points={tri.map((q) => q.join(',')).join(' ')} fill="#dbeafe" stroke={STROKE} strokeWidth="2.2" strokeLinejoin="round" />
      <text x={x0 + skew / 2 + pw / 2} y={yBot + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill={LABEL}>밑변 {base} {unit}</text>
      <text x={x0 + skew - 6} y={(yTop + yBot) / 2} textAnchor="end" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={DIM}>{pHeight} {unit}</text>
      <text x={tx + 34} y={(yTop + yBot) / 2} textAnchor="start" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={DIM}>{tHeight} {unit}</text>
    </>
  )
}

// 모눈종이(1 cm²) 위의 직각다각형. poly는 격자 좌표(오른쪽·아래로 증가) 꼭짓점.
function Grid({ gw, gh, poly, unit }) {
  const cell = Math.min(122 / gw, 104 / gh)
  const w = cell * gw, h = cell * gh
  const x0 = (200 - w) / 2, y0 = (150 - h) / 2 - 4
  const pts = poly.map(([gx, gy]) => `${x0 + gx * cell},${y0 + gy * cell}`).join(' ')
  const lines = []
  for (let i = 0; i <= gw; i++) lines.push(<line key={'v' + i} x1={x0 + i * cell} y1={y0} x2={x0 + i * cell} y2={y0 + h} stroke="#cbd5e1" strokeWidth="1" />)
  for (let j = 0; j <= gh; j++) lines.push(<line key={'h' + j} x1={x0} y1={y0 + j * cell} x2={x0 + w} y2={y0 + j * cell} stroke="#cbd5e1" strokeWidth="1" />)
  return (
    <>
      {lines}
      <polygon points={pts} fill="#93c5fd" fillOpacity="0.55" stroke="#1d4ed8" strokeWidth="2.5" strokeLinejoin="round" />
      {/* 단위 칸 표시 */}
      <rect x={x0} y={y0 - 0} width={cell} height={cell} fill="none" />
      <text x={x0 + w / 2} y={y0 + h + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={LABEL}>
        (한 칸 = 1 {unit}²)
      </text>
    </>
  )
}

export default function ShapeDiagram({ figure, className = '' }) {
  if (!figure) return null
  const unit = figure.unit || 'cm'
  let body = null
  switch (figure.shape) {
    case 'rectangle': body = <Rectangle w={figure.w} h={figure.h} unit={unit} />; break
    case 'parallelogram': body = <Parallelogram base={figure.base} height={figure.height} slant={figure.slant} unit={unit} />; break
    case 'triangle': body = <Triangle base={figure.base} height={figure.height} side={figure.side} unit={unit} />; break
    case 'rhombus': body = <Rhombus d1={figure.d1} d2={figure.d2} unit={unit} />; break
    case 'house': body = <House w={figure.w} h={figure.h} roofH={figure.roofH} unit={unit} />; break
    case 'paratri': body = <ParaTri base={figure.base} pHeight={figure.pHeight} tHeight={figure.tHeight} unit={unit} />; break
    case 'grid': body = <Grid gw={figure.gw} gh={figure.gh} poly={figure.poly} unit={unit} />; break
    default: return null
  }
  return (
    <div className={`flex justify-center ${className}`}>
      <svg viewBox="0 0 200 150" width="200" height="150" className="max-w-full" role="img" aria-label="도형 그림">
        {body}
      </svg>
    </div>
  )
}
