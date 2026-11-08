// 넓이 문제용 도형 그림(SVG). figure 스펙을 받아 치수 라벨과 함께 그린다.
// figure 예: { shape:'triangle', base:8, height:5, unit:'cm' }
// shape: rectangle | parallelogram | triangle | rhombus | house | paratri | array | geo(합동과 대칭)
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

// 분수의 곱셈 넓이 모델 — 한 변이 1인 정사각형을 가로 ad칸·세로 bd칸으로 나누고,
// 가로 an칸 × 세로 bn칸이 겹치는 부분이 곱의 결과.
function FracArea({ an, ad, bn, bd, unit }) {
  const SQ = 96
  const x = 58, y = 22
  const cw = SQ / ad, rh = SQ / bd
  const lines = []
  for (let i = 1; i < ad; i++) lines.push(<line key={'v' + i} x1={x + i * cw} y1={y} x2={x + i * cw} y2={y + SQ} stroke="#cbd5e1" strokeWidth="0.9" />)
  for (let j = 1; j < bd; j++) lines.push(<line key={'h' + j} x1={x} y1={y + j * rh} x2={x + SQ} y2={y + j * rh} stroke="#cbd5e1" strokeWidth="0.9" />)
  return (
    <>
      <rect x={x} y={y} width={SQ} height={SQ} fill="#f8fafc" />
      {/* 가로 an/ad (파랑 띠) · 세로 bn/bd (노랑 띠) */}
      <rect x={x} y={y} width={an * cw} height={SQ} fill="#bfdbfe" fillOpacity="0.75" />
      <rect x={x} y={y} width={SQ} height={bn * rh} fill="#fde68a" fillOpacity="0.7" />
      {/* 겹친 부분 = 답 */}
      <rect x={x} y={y} width={an * cw} height={bn * rh} fill="#34d399" fillOpacity="0.85" />
      <rect x={x} y={y} width={an * cw} height={bn * rh} fill="none" stroke="#059669" strokeWidth="2.2" />
      {lines}
      <rect x={x} y={y} width={SQ} height={SQ} fill="none" stroke="#475569" strokeWidth="1.6" />
      {/* 라벨 */}
      <text x={x + (an * cw) / 2} y={y - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1d4ed8">
        {an}/{ad}{unit ? ` ${unit}` : ''}
      </text>
      <text x={x - 8} y={y + (bn * rh) / 2 + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#b45309">
        {bn}/{bd}{unit ? ` ${unit}` : ''}
      </text>
      <text x={x + SQ / 2} y={y + SQ + 16} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={LABEL}>
        전체 {ad} × {bd} = {ad * bd}칸 · 겹친 {an * bn}칸
      </text>
      <text x={x + SQ / 2} y={y + SQ + 30} textAnchor="middle" fontSize="10" fill="#6b7280">
        (한 변이 1{unit ? ` ${unit}` : ''}인 정사각형)
      </text>
    </>
  )
}

// 곱셈구구의 배열(묶어 세기) 모델. 한 줄에 몇 개씩 몇 줄인지를 점으로 보여 준다.
// 초2는 "3씩 4묶음"을 눈으로 세어 보고 3 × 4를 만들어 내는 단계라 그림이 중요하다.
function DotArray({ rows, cols, group }) {
  const r = clamp(rows, 1, 9)
  const c = clamp(cols, 1, 9)
  const areaW = 140
  const areaH = 92
  const step = Math.min(areaW / c, areaH / r, 18)
  const dot = clamp(step * 0.26, 2.2, 4.6)
  const gridW = step * c
  const gridH = step * r
  const x0 = 48 + (areaW - gridW) / 2
  const y0 = 26 + (areaH - gridH) / 2

  const dots = []
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      dots.push(
        <circle key={`${i}-${j}`} cx={x0 + step * (j + 0.5)} cy={y0 + step * (i + 0.5)} r={dot} fill={STROKE} />,
      )
    }
  }

  return (
    <g>
      {/* 묶음 표시 — 한 줄이 한 묶음임을 드러낸다 */}
      {group &&
        Array.from({ length: r }, (_, i) => (
          <rect
            key={i}
            x={x0 + 1.5}
            y={y0 + step * i + 1.5}
            width={gridW - 3}
            height={step - 3}
            rx={Math.min(6, step / 2)}
            fill={FILL}
            stroke={STROKE}
            strokeWidth="1.2"
          />
        ))}
      {dots}

      {/* 한 줄에 몇 개씩 */}
      <path d={`M ${x0} ${y0 - 7} L ${x0 + gridW} ${y0 - 7}`} stroke={DIM} strokeWidth="1.4" fill="none" />
      <text x={x0 + gridW / 2} y={y0 - 11} fontSize="11" fill={LABEL} textAnchor="middle" fontWeight="bold">
        {c}개씩
      </text>

      {/* 몇 줄 */}
      <path d={`M ${x0 - 7} ${y0} L ${x0 - 7} ${y0 + gridH}`} stroke={DIM} strokeWidth="1.4" fill="none" />
      <text x={x0 - 12} y={y0 + gridH / 2 + 4} fontSize="11" fill={LABEL} textAnchor="end" fontWeight="bold">
        {r}줄
      </text>
    </g>
  )
}

// 합동과 대칭용 일반 도형 그림.
// figure 예: { shape:'geo', polys:[{ pts:[[0,0],[6,0],[2,4]], labels:['ㄱ','ㄴ','ㄷ'],
//   edges:{0:'6 cm'}, angles:{2:'70°'}, tone:'a' }], axis:[[x1,y1],[x2,y2]], center:[x,y], segs:[[[x,y],[x,y]]] }
// 좌표는 수학처럼 위로 갈수록 y가 크다. 그림 크기에 맞게 알아서 늘이고 줄인다.
// edges의 i는 pts[i]→pts[i+1] 변, angles의 i는 pts[i] 꼭짓점. 값이 '?'면 빨갛게 강조한다.
const TONES = {
  a: { fill: '#fef3c7', stroke: '#b45309' },
  b: { fill: '#dbeafe', stroke: '#1d4ed8' },
}
// grid:[w,h]면 0~w, 0~h 모눈을 깔고(한 칸 = 1), points:[{at:[x,y], label, color}]는 이름이나 값을 그 자리에 쓴다.
// 길이는 교과서처럼 '길이 표시선'(양 끝이 꺾인 짧은 선, ├──┤)과 함께, 각은 꼭짓점의 '각 표시(호)'와 함께 쓴다.
//   dims:[{a:[x,y], b:[x,y], t:'12 cm', away:[x,y], far}] — 변이 아닌 선분(대각선·접기 전 변 등)의 길이. away 반대쪽에 표시,
//     far(px)를 주면 그만큼 바깥으로 빼서 점선 보조선으로 잇는다
//   arcs:[{at:[x,y], from:[x,y], to:[x,y], t:'?'}] — 도형의 꼭짓점 각이 아닌 각(접은 뒤 생긴 각 등)
const ANGLE = '#7c3aed'
function Geo({ polys = [], axis, center, centerLabel = 'ㅇ', segs = [], grid, points = [], dims = [], arcs = [] }) {
  const all = []
  if (grid) all.push([0, 0], [grid[0], grid[1]])
  polys.forEach((p) => all.push(...p.pts))
  points.forEach((pt) => all.push(pt.at))
  if (axis) all.push(...axis)
  if (center) all.push(center)
  segs.forEach((sg) => all.push(...sg))
  dims.forEach((d) => all.push(d.a, d.b))
  const xs = all.map((q) => q[0]), ys = all.map((q) => q[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const w = Math.max(maxX - minX, 1e-6), h = Math.max(maxY - minY, 1e-6)
  const k = Math.min(150 / w, 98 / h)
  const ox = 100 - ((minX + maxX) / 2) * k
  const oy = 76 + ((minY + maxY) / 2) * k
  const P = ([x, y]) => [ox + x * k, oy - y * k]
  const out = []
  const marks = []
  const labels = []
  const unit = (dx, dy) => {
    const l = Math.hypot(dx, dy) || 1
    return [dx / l, dy / l]
  }
  // 글자 뒤에 흰 테두리 — 선 위에 놓여도 읽히게
  const halo = { stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round' }

  // 길이 표시선 + 길이 — a, b는 화면 좌표, (nx, ny)는 표시선을 그을 바깥쪽 방향
  const dimension = (a, b, nx, ny, text, key, far = 0) => {
    const color = text === '?' ? DIM : STROKE
    const [ux, uy] = unit(b[0] - a[0], b[1] - a[1])
    const g = far || 6 // 변에서 표시선까지 거리 — 도형 안쪽이 붐비면 바깥으로 멀리 빼고 보조선으로 잇는다
    if (far) {
      marks.push(
        <path key={'e' + key} d={`M ${a[0]} ${a[1]} L ${a[0] + nx * (g + 3)} ${a[1] + ny * (g + 3)} M ${b[0]} ${b[1]} L ${b[0] + nx * (g + 3)} ${b[1] + ny * (g + 3)}`} stroke={color} strokeWidth="0.8" strokeDasharray="2 2" fill="none" opacity="0.7" />,
      )
    }
    const sa = [a[0] + nx * g + ux * 2.5, a[1] + ny * g + uy * 2.5]
    const sb = [b[0] + nx * g - ux * 2.5, b[1] + ny * g - uy * 2.5]
    const tick = (q) => `M ${q[0] - nx * 3} ${q[1] - ny * 3} L ${q[0] + nx * 3} ${q[1] + ny * 3}`
    marks.push(
      <path key={'d' + key} d={`${tick(sa)} M ${sa[0]} ${sa[1]} L ${sb[0]} ${sb[1]} ${tick(sb)}`} stroke={color} strokeWidth="1.1" fill="none" opacity="0.85" />,
    )
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
    const hw = String(text).length * 3.3
    // 비스듬한 선분은 글자를 선분과 나란히 기울인다. 가로·세로에 가까우면 그대로(세로 글씨는 읽기 어렵다).
    let deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
    if (deg > 90) deg -= 180
    if (deg <= -90) deg += 180
    const slanted = Math.abs(deg) > 12 && Math.abs(deg) < 72 && text !== '?'
    const off = g + (slanted ? 8 : 6 + Math.abs(nx) * hw + Math.abs(ny) * 4)
    const x = slanted ? mx + nx * off : clamp(mx + nx * off, hw + 2, 198 - hw)
    const y = slanted ? my + ny * off : clamp(my + ny * off, 8, 144)
    labels.push(
      <text key={'dt' + key} x={x} y={y} transform={slanted ? `rotate(${deg.toFixed(1)} ${x} ${y})` : undefined} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={color} {...halo}>
        {text}
      </text>,
    )
  }

  // 각 표시 — 꼭짓점 v에서 a·b 쪽으로 호(직각이면 ㄴ자)를 그리고 그 안쪽에 각도를 쓴다
  const angleMark = (v, a, b, text, key) => {
    const color = text === '?' ? DIM : ANGLE
    const u1 = unit(a[0] - v[0], a[1] - v[1]), u2 = unit(b[0] - v[0], b[1] - v[1])
    const deg = (Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]))) * 180) / Math.PI
    const r = deg < 40 ? 16 : 12
    if (text === '90°' && Math.abs(deg - 90) < 4) {
      const q = 9
      marks.push(
        <path key={'r' + key} d={`M ${v[0] + u1[0] * q} ${v[1] + u1[1] * q} L ${v[0] + (u1[0] + u2[0]) * q} ${v[1] + (u1[1] + u2[1]) * q} L ${v[0] + u2[0] * q} ${v[1] + u2[1] * q}`} stroke={color} strokeWidth="1.4" fill="none" />,
      )
    } else {
      const A = [v[0] + u1[0] * r, v[1] + u1[1] * r], B = [v[0] + u2[0] * r, v[1] + u2[1] * r]
      const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0
      marks.push(
        <path key={'r' + key} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 0 ${sweep} ${B[0]} ${B[1]}`} stroke={color} strokeWidth="1.5" fill="none" />,
      )
    }
    const [bx, by] = unit(u1[0] + u2[0], u1[1] + u2[1])
    const d = r + (deg < 40 ? 12 : deg > 100 ? 4 : 9)
    labels.push(
      <text key={'at' + key} x={v[0] + bx * d} y={v[1] + by * d} textAnchor="middle" dominantBaseline="middle" fontSize="10.5" fontWeight="700" fill={color} {...halo}>
        {text}
      </text>,
    )
  }

  if (grid) {
    for (let i = 0; i <= grid[0]; i++) {
      const [a, b] = [P([i, 0]), P([i, grid[1]])]
      out.push(<line key={'gx' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#cbd5e1" strokeWidth="1" />)
    }
    for (let j = 0; j <= grid[1]; j++) {
      const [a, b] = [P([0, j]), P([grid[0], j])]
      out.push(<line key={'gy' + j} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#cbd5e1" strokeWidth="1" />)
    }
  }
  polys.forEach((poly, pi) => {
    const t = TONES[poly.tone] || TONES[pi % 2 ? 'b' : 'a']
    const pts = poly.pts.map(P)
    const n = pts.length
    const cx = pts.reduce((s2, q) => s2 + q[0], 0) / n
    const cy = pts.reduce((s2, q) => s2 + q[1], 0) / n
    out.push(
      <polygon key={'p' + pi} points={pts.map((q) => q.join(',')).join(' ')} fill={t.fill} stroke={t.stroke} strokeWidth="2.2" strokeLinejoin="round" />,
    )
    ;(poly.labels || []).forEach((lb, i) => {
      if (!lb) return
      const [ux, uy] = unit(pts[i][0] - cx, pts[i][1] - cy)
      labels.push(
        <text key={`v${pi}-${i}`} x={pts[i][0] + ux * 10} y={pts[i][1] + uy * 10} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="800" fill={LABEL} {...halo}>
          {lb}
        </text>,
      )
    })
    Object.entries(poly.edges || {}).forEach(([key, spec]) => {
      // 값은 글자 또는 { t, flip } — flip이면 도형 안쪽에 쓴다(두 도형이 맞닿은 변 등)
      const text = typeof spec === 'object' ? spec.t : spec
      const i = Number(key)
      const a = pts[i], b = pts[(i + 1) % n]
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
      let [nx, ny] = unit(-(b[1] - a[1]), b[0] - a[0])
      if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny }
      if (typeof spec === 'object' && spec.flip) { nx = -nx; ny = -ny }
      dimension(a, b, nx, ny, text, `${pi}-${i}`)
    })
    Object.entries(poly.angles || {}).forEach(([key, text]) => {
      const i = Number(key)
      angleMark(pts[i], pts[(i + n - 1) % n], pts[(i + 1) % n], text, `${pi}-${i}`)
    })
  })
  dims.forEach((d, i) => {
    const a = P(d.a), b = P(d.b)
    let [nx, ny] = unit(-(b[1] - a[1]), b[0] - a[0])
    if (d.away) {
      const q = P(d.away)
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
      if ((q[0] - mx) * nx + (q[1] - my) * ny > 0) { nx = -nx; ny = -ny }
    }
    dimension(a, b, nx, ny, d.t, 'x' + i, d.far || 0)
  })
  arcs.forEach((ac, i) => angleMark(P(ac.at), P(ac.from), P(ac.to), ac.t, 'y' + i))
  // 보조선(대각선·대응점 잇기)은 도형 위에 그려야 보인다
  segs.forEach((sg, i) => {
    const [a, b] = sg.map(P)
    out.push(<line key={'s' + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#475569" strokeWidth="1.4" strokeDasharray="4 3" />)
  })
  if (axis) {
    const [a, b] = axis.map(P)
    const [ux, uy] = unit(b[0] - a[0], b[1] - a[1])
    out.push(
      <line key="axis" x1={a[0] - ux * 10} y1={a[1] - uy * 10} x2={b[0] + ux * 10} y2={b[1] + uy * 10} stroke={DIM} strokeWidth="1.8" strokeDasharray="6 4" />,
    )
  }
  if (center) {
    const [x, y] = P(center)
    out.push(<circle key="c" cx={x} cy={y} r="2.8" fill={DIM} />)
    labels.push(
      <text key="cl" x={x + 8} y={y - 7} fontSize="11" fontWeight="800" fill={DIM} {...halo}>
        {centerLabel}
      </text>,
    )
  }
  points.forEach((pt, i) => {
    const [x, y] = P(pt.at)
    labels.push(
      <text key={'pt' + i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="800" fill={pt.color || (pt.label === '?' ? DIM : LABEL)} {...halo}>
        {pt.label}
      </text>,
    )
  })
  return (
    <>
      {out}
      {marks}
      {labels}
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
    case 'fracArea': body = <FracArea an={figure.an} ad={figure.ad} bn={figure.bn} bd={figure.bd} unit={figure.unit} />; break
    case 'array': body = <DotArray rows={figure.rows} cols={figure.cols} group={figure.group} />; break
    case 'geo': body = <Geo polys={figure.polys} axis={figure.axis} center={figure.center} centerLabel={figure.centerLabel} segs={figure.segs} grid={figure.grid} points={figure.points} dims={figure.dims} arcs={figure.arcs} />; break
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
