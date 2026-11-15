// 소수 마을 지도 — 비스듬히 내려다보는(아이소메트릭) 8×8 마을.
// 땅·길 → 건물·장식(앞뒤 순서대로) → 걸어가는 손님·말풍선 순서로 그린다. 한 장의 SVG.
import { forwardRef } from 'react'
import { MAP, ROWS, COLS, ZONES, tileAt, unlocked, shopById, decorById, key } from '../../utils/decimalShop.js'

export const TW = 64 // 칸 너비
export const TH = 32 // 칸 높이
const OX = (ROWS * TW) / 2
const OY = 62 // 위쪽 여유 (건물 높이)
export const VIEW_W = ((ROWS + COLS) * TW) / 2
export const VIEW_H = ((ROWS + COLS) * TH) / 2 + OY + 8

// 칸 가운데 좌표
export function center(r, c) {
  return [(c - r) * (TW / 2) + OX, (c + r) * (TH / 2) + OY + TH / 2]
}
const diamond = (cx, cy, s = 1) => {
  const w = (TW / 2) * s
  const h = (TH / 2) * s
  return `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`
}

// 상자 모양 건물 (지붕·왼벽·오른벽 + 문·창문·차양)
function Building({ r, c, shop, lv, selected, closed, onClick, refEl, children }) {
  const [cx, cy] = center(r, c)
  const s = 0.74
  const w = (TW / 2) * s
  const h = (TH / 2) * s
  const H = 18 + shop.tier * 5 + lv * 5
  const [roof, left, right] = shop.color
  const top = cy - H
  return (
    <g ref={refEl} onClick={onClick} className="cursor-pointer" style={{ opacity: closed ? 0.55 : 1 }}>
      {selected && <polygon points={diamond(cx, cy, 1)} fill="none" stroke="#facc15" strokeWidth="3" className="town-pulse" />}
      {/* 그림자 */}
      <polygon points={diamond(cx + 4, cy + 2, 0.86)} fill="rgba(0,0,0,0.18)" />
      {/* 왼벽 */}
      <polygon points={`${cx - w},${top} ${cx},${top + h} ${cx},${cy + h} ${cx - w},${cy}`} fill={left} stroke="rgba(0,0,0,0.12)" />
      {/* 오른벽 */}
      <polygon points={`${cx},${top + h} ${cx + w},${top} ${cx + w},${cy} ${cx},${cy + h}`} fill={right} stroke="rgba(0,0,0,0.12)" />
      {/* 문 (왼벽) */}
      <polygon points={`${cx - w * 0.62},${cy - 13 + h * 0.38} ${cx - w * 0.3},${cy - 13 + h * 0.7} ${cx - w * 0.3},${cy + h * 0.7} ${cx - w * 0.62},${cy + h * 0.38}`} fill="#7c2d12" opacity="0.85" />
      {/* 창문 (오른벽) */}
      <polygon points={`${cx + w * 0.25},${cy - H * 0.55 + h * 0.75} ${cx + w * 0.7},${cy - H * 0.55 + h * 0.3} ${cx + w * 0.7},${cy - H * 0.3 + h * 0.3} ${cx + w * 0.25},${cy - H * 0.3 + h * 0.75}`} fill="#e0f2fe" stroke="#0369a1" strokeWidth="0.8" />
      {/* 지붕 (조금 튀어나오게) */}
      <polygon points={diamond(cx, top, s * 1.12)} fill={roof} stroke="rgba(0,0,0,0.2)" />
      <polygon points={diamond(cx, top - 3, s * 0.7)} fill="rgba(255,255,255,0.28)" />
      {/* 간판 */}
      <text x={cx} y={top - 6} textAnchor="middle" fontSize="20">{shop.icon}</text>
      {lv > 1 && (
        <g>
          <rect x={cx + 8} y={top - 22} width="20" height="11" rx="5" fill="#f59e0b" />
          <text x={cx + 18} y={top - 13.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">Lv{lv}</text>
        </g>
      )}
      {closed && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11">😴</text>}
      {children}
    </g>
  )
}

// 아직 안 산 땅은 숲 — 칸마다 정해진 나무 (사면 사라진다)
const FOREST = ['🌲', '🌳', '🌲', '🌲', '🌳', '🪨', '🌲', '🍄']
const forestAt = (r, c) => FOREST[(r * 7 + c * 13 + r * c) % FOREST.length]
// 땅마다 값 팻말은 한 곳에만
const SIGN_AT = (() => {
  const out = {}
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = MAP[r][c]
    if (ZONES[t] && !out[t] && (r === 2 || r === 0)) out[t] = key(r, c)
  }
  return out
})()

const TownMap = forwardRef(function TownMap({ town, onTile, selectedKey, closedKeys, shopRefs, overlay, extra }, ref) {
  const tiles = []
  const objects = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = tileAt(r, c)
      const [cx, cy] = center(r, c)
      const k = key(r, c)
      const open = t === 'R' || unlocked(town, r, c)
      const fill = t === 'R' ? ((r + c) % 2 ? '#d6d3d1' : '#cfcac6') : open ? ((r + c) % 2 ? '#86d98f' : '#7ccf86') : (r + c) % 2 ? '#5f9a69' : '#578f61'
      tiles.push(
        <g key={k} onClick={() => onTile?.(r, c)} className={t === 'R' ? '' : 'cursor-pointer'}>
          <polygon points={diamond(cx, cy)} fill={fill} stroke={t === 'R' ? '#a8a29e' : 'rgba(0,0,0,0.08)'} strokeWidth="0.8" />
          {t === 'R' && <polygon points={diamond(cx, cy, 0.18)} fill="#fafaf9" opacity="0.8" />}
          {selectedKey === k && !town.built[k] && <polygon points={diamond(cx, cy)} fill="rgba(250,204,21,0.35)" stroke="#facc15" strokeWidth="2.5" />}
        </g>,
      )
      if (!open) {
        const sign = SIGN_AT[t] === k
        objects.push({
          depth: r + c,
          el: (
            <g key={`f${k}`} onClick={() => onTile?.(r, c)} className="cursor-pointer">
              {sign ? (
                <g>
                  <rect x={cx - 21} y={cy - 22} width="42" height="15" rx="4" fill="#78350f" />
                  <text x={cx} y={cy - 11.5} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fef3c7">🔒 {ZONES[t].cost}G</text>
                  <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 3} stroke="#78350f" strokeWidth="2.5" />
                </g>
              ) : (
                <text x={cx} y={cy + 5} textAnchor="middle" fontSize="20">{forestAt(r, c)}</text>
              )}
            </g>
          ),
        })
      }
      const b = town.built[k]
      if (!b) continue
      if (b.kind === 'shop') {
        objects.push({
          depth: r + c,
          el: (
            <Building
              key={k}
              r={r}
              c={c}
              shop={shopById(b.id)}
              lv={b.lv || 1}
              selected={selectedKey === k}
              closed={closedKeys?.has(k)}
              refEl={(el) => { if (shopRefs) shopRefs.current[k] = el }}
              onClick={(e) => { e.stopPropagation(); onTile?.(r, c) }}
            >
              {overlay?.(k, cx, cy)}
            </Building>
          ),
        })
      } else {
        const d = decorById(b.id)
        const big = ['fountain', 'carousel', 'ferris', 'statue'].includes(d.id)
        objects.push({
          depth: r + c,
          el: (
            <g key={k} onClick={(e) => { e.stopPropagation(); onTile?.(r, c) }} className="cursor-pointer">
              <ellipse cx={cx} cy={cy + 2} rx={big ? 18 : 11} ry={big ? 8 : 5} fill="rgba(0,0,0,0.15)" />
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize={big ? 34 : 24}>{d.icon}</text>
            </g>
          ),
        })
      }
    }
  }
  objects.sort((a, b) => a.depth - b.depth)
  return (
    <svg ref={ref} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-auto w-full select-none" role="img" aria-label="소수 마을 지도">
      {tiles}
      {objects.map((o) => o.el)}
      {extra}
    </svg>
  )
})

export default TownMap
export { MAP }
