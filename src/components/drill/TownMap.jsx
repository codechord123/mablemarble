// 소수 마을 지도 — 비스듬히 내려다보는(아이소메트릭) 8×8 마을.
// 땅·길 → 건물·장식(앞뒤 순서대로) → 걸어가는 손님·말풍선 순서로 그린다. 한 장의 SVG.
import { forwardRef, useEffect } from 'react'
import { MAP, ROWS, COLS, ZONES, tileAt, unlocked, shopById, decorById, key, BIG_DECOR } from '../../utils/decimalShop.js'
import { SRC_W, GROUND_H, BUILDING_H, FLOOR_STEP, UPPER_X, GROUND, roadSrc, shopArt, MAP_FILTER, landKind, preloadTownArt } from './townArt.js'

export const TW = 64 // 칸 너비
export const TH = 32 // 칸 높이
const OX = (ROWS * TW) / 2
const OY = 62 // 위쪽 여유 (건물 높이)
export const VIEW_W = ((ROWS + COLS) * TW) / 2
export const VIEW_H = ((ROWS + COLS) * TH) / 2 + OY + 22 // 땅 타일 두께만큼 아래 여유
const S = TW / SRC_W // 타일 그림 줄임 비율

// 칸 가운데 좌표
export function center(r, c) {
  return [(c - r) * (TW / 2) + OX, (c + r) * (TH / 2) + OY + TH / 2]
}
const diamond = (cx, cy, s = 1) => {
  const w = (TW / 2) * s
  const h = (TH / 2) * s
  return `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`
}

// 땅 한 칸 그림 (위 마름모를 칸 마름모에 맞춘다)
function Tile({ cx, cy, src, h = GROUND_H, filter }) {
  return <image href={src} x={cx - TW / 2} y={cy - TH / 2} width={TW + 0.6} height={h * S + 0.4} preserveAspectRatio="none" style={filter ? { filter } : undefined} />
}

// 가게 건물 — 1층 가게 그림 위에 Lv만큼 위층을 쌓고 지붕을 얹는다
function Building({ r, c, shop, lv, selected, closed, onClick, refEl, children }) {
  const [cx, cy] = center(r, c)
  const art = shopArt(shop.id, lv)
  const groundTop = cy - TH / 2
  const bodyTop = groundTop + (GROUND_H - BUILDING_H) * S
  const ux = cx - TW / 2 + UPPER_X * S
  const floorTops = art.floors.map((_, i) => bodyTop - FLOOR_STEP * (i + 1) * S)
  const top = floorTops.length ? floorTops[floorTops.length - 1] : bodyTop
  const roofTop = top - 7 * S
  // 건물 밑받침의 옆면은 잘라 낸다 (앞쪽 칸의 땅·길을 덮지 않게)
  const clip = `bclip-${r}-${c}`
  return (
    <g ref={refEl} onClick={onClick} className="cursor-pointer" style={{ opacity: closed ? 0.6 : 1 }}>
      <clipPath id={clip}>
        <polygon points={`${cx - TW / 2},${cy - 200} ${cx + TW / 2},${cy - 200} ${cx + TW / 2},${cy} ${cx},${cy + TH / 2} ${cx - TW / 2},${cy}`} />
      </clipPath>
      <image clipPath={`url(#${clip})`} href={art.base} x={cx - TW / 2} y={groundTop + GROUND_H * S - BUILDING_H * S} width={TW} height={BUILDING_H * S} />
      {art.floors.map((src, i) => (
        <image key={i} href={src} x={ux} y={floorTops[i]} width={99 * S} height={85 * S} />
      ))}
      <image href={art.roof} x={ux} y={roofTop} width={99 * S} height={60 * S} />
      {selected && <polygon points={diamond(cx, cy, 1)} fill="rgba(250,204,21,0.18)" stroke="#facc15" strokeWidth="3" className="town-pulse" />}
      {/* 간판 */}
      <g>
        <circle cx={cx} cy={roofTop - 4} r="11" fill="#fff" stroke="rgba(0,0,0,0.15)" />
        <text x={cx} y={roofTop + 1.5} textAnchor="middle" fontSize="15">{shop.icon}</text>
      </g>
      {lv > 1 && (
        <g>
          <rect x={cx + 9} y={roofTop - 14} width="20" height="11" rx="5" fill="#f59e0b" />
          <text x={cx + 19} y={roofTop - 5.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">Lv{lv}</text>
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

// 바다·얼음 호수 칸 장식 (칸마다 정해진 것)
const SEA = ['🌊', '', '', '🐟', '', '🌊', '', '']
const ICE = ['✨', '', '', '❄️', '', '', '✨', '']

const TownMap = forwardRef(function TownMap({ town, mapId = 'main', onTile, selectedKey, closedKeys, shopRefs, overlay, extra }, ref) {
  useEffect(preloadTownArt, [])
  const tiles = []
  const objects = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = tileAt(r, c, mapId)
      const [cx, cy] = center(r, c)
      const k = key(r, c, mapId)
      const scenery = t === '~' || t === 'I' // 바다·얼음 — 못 짓는 풍경
      const open = t === 'R' || scenery || unlocked(town, r, c, mapId)
      const road = (rr, cc) => { const n = tileAt(rr, cc, mapId); return n === null || n === 'R' } // 지도 밖으로 나가는 길도 이어지게
      const F = MAP_FILTER[mapId] || {}
      const g = GROUND[landKind(mapId)]
      tiles.push(
        <g key={k} onClick={() => !scenery && onTile?.(r, c)} className={t === 'R' || scenery ? '' : 'cursor-pointer'}>
          {t === 'R' ? (
            <Tile cx={cx} cy={cy} src={roadSrc(road(r - 1, c), road(r, c + 1), road(r + 1, c), road(r, c - 1))} />
          ) : scenery ? (
            <Tile cx={cx} cy={cy} src={GROUND.water.src} h={GROUND.water.h} filter={t === 'I' ? 'saturate(0.35) brightness(1.3)' : F.water} />
          ) : (
            <Tile cx={cx} cy={cy} src={g.src} filter={open ? F.land : F.locked || F.land} />
          )}
          {t === '~' && SEA[(r * 3 + c) % 8] && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" className="town-bob">{SEA[(r * 3 + c) % 8]}</text>}
          {t === 'I' && ICE[(r * 5 + c) % 8] && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" opacity="0.8">{ICE[(r * 5 + c) % 8]}</text>}
          {selectedKey === k && !town.built[k] && <polygon points={diamond(cx, cy)} fill="rgba(250,204,21,0.35)" stroke="#facc15" strokeWidth="2.5" />}
        </g>,
      )
      if (!open && mapId === 'main') {
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
        const big = BIG_DECOR.has(d.id)
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
