// 소수 마을 지도 — 비스듬히 내려다보는(아이소메트릭) 8×8 마을.
// 땅·길 → 건물·장식(앞뒤 순서대로) → 걸어가는 손님·말풍선 순서로 그린다. 한 장의 SVG.
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MAP, ROWS, COLS, ZONES, NEAR, tileAt, unlocked, shopById, decorById, key, BIG_DECOR } from '../../utils/decimalShop.js'
import { SRC_W, GROUND_H, BUILDING_H, FLOOR_STEP, UPPER_X, GROUND, roadSrc, shopArt, MAP_FILTER, landKind, preloadTownArt } from './townArt.js'

export const TW = 64 // 칸 너비
export const TH = 32 // 칸 높이
const OX = (ROWS * TW) / 2
const OY = 130 // 위쪽 여유 (건물 높이 — Lv.5까지)
export const VIEW_W = ((ROWS + COLS) * TW) / 2
export const VIEW_H = ((ROWS + COLS) * TH) / 2 + OY + 22 // 땅 타일 두께만큼 아래 여유
const S = TW / SRC_W // 타일 그림 줄임 비율

// 칸 가운데 좌표
export function center(r, c) {
  return [(c - r) * (TW / 2) + OX, (c + r) * (TH / 2) + OY + TH / 2]
}
// ─── 지도 돌리기 (90°씩) — 건물 뒤에 가린 땅도 앞으로 오게. 보기 설정만, 학생 기록과 상관없음 ───
const ROT_KEY = 'boomarble_town_rot'
let rotNow = (() => {
  try { return Number(localStorage.getItem(ROT_KEY)) % 4 || 0 } catch { return 0 }
})()
const rotSubs = new Set()
export function setMapRot(v) {
  rotNow = ((v % 4) + 4) % 4
  try { localStorage.setItem(ROT_KEY, String(rotNow)) } catch { /* ignore */ }
  rotSubs.forEach((f) => f(rotNow))
}
export function useMapRot() {
  const [r, setR] = useState(rotNow)
  useEffect(() => {
    rotSubs.add(setR)
    return () => rotSubs.delete(setR)
  }, [])
  return r
}
const N1 = ROWS - 1
// 지도 칸(r,c) → 화면 칸, 화면 칸 → 지도 칸
export function viewRC(r, c, rot) {
  if (rot === 1) return [c, N1 - r]
  if (rot === 2) return [N1 - r, N1 - c]
  if (rot === 3) return [N1 - c, r]
  return [r, c]
}
export function gridRC(dr, dc, rot) {
  if (rot === 1) return [N1 - dc, dr]
  if (rot === 2) return [N1 - dr, N1 - dc]
  if (rot === 3) return [dc, N1 - dr]
  return [dr, dc]
}
export const centerRot = (r, c, rot) => center(...viewRC(r, c, rot))

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
      <image href={art.roof} x={ux} y={roofTop} width={99 * S} height={60 * S}
        style={art.gold ? { filter: 'sepia(1) saturate(5) hue-rotate(-8deg) brightness(1.2)' } : undefined} />
      {art.gold && <text x={cx - 18} y={roofTop + 4} fontSize="11" className="town-bob">✨</text>}
      {selected && <polygon points={diamond(cx, cy, 1)} fill="rgba(250,204,21,0.18)" stroke="#facc15" strokeWidth="3" className="town-pulse" />}
      {/* 간판 */}
      <g>
        <circle cx={cx} cy={roofTop - 4} r="11" fill="#fff" stroke="rgba(0,0,0,0.15)" />
        <text x={cx} y={roofTop + 1.5} textAnchor="middle" fontSize="15">{shop.icon}</text>
      </g>
      {lv > 1 && (
        <g>
          <rect x={cx + 9} y={roofTop - 14} width={lv >= 5 ? 26 : 20} height="11" rx="5" fill={lv >= 5 ? '#b45309' : '#f59e0b'} />
          <text x={cx + (lv >= 5 ? 22 : 19)} y={roofTop - 5.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">{lv >= 5 ? 'Lv5⭐' : `Lv${lv}`}</text>
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
    if (ZONES[t] && !out[t] && c !== 3 && r !== 3) out[t] = key(r, c) // 땅마다 처음 나오는 칸에 팻말
  }
  return out
})()

// 바다·얼음 호수 칸 장식 (칸마다 정해진 것)
const SEA = ['🌊', '', '', '🐟', '', '🌊', '', '']
const ICE = ['✨', '', '', '❄️', '', '', '✨', '']

// 크게 보기 — 지도가 12×12라 휴대폰에선 작다. 확대하면 손가락으로 밀어서 본다 (보기 설정만, 학생 기록과 상관없음)
const ZOOM_KEY = 'boomarble_town_zoom'
export function MapZoom({ children }) {
  const [z, setZ] = useState(() => {
    try {
      const v = Number(localStorage.getItem(ZOOM_KEY))
      if (v) return v
    } catch { /* ignore */ }
    return typeof window !== 'undefined' && window.innerWidth < 600 ? 1.5 : 1
  })
  const box = useRef(null)
  useLayoutEffect(() => {
    const el = box.current
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
  }, [z])
  const set = (v) => {
    setZ(v)
    try { localStorage.setItem(ZOOM_KEY, String(v)) } catch { /* ignore */ }
  }
  return (
    <div className="relative">
      <div ref={box} className="overflow-auto rounded-2xl" style={{ maxHeight: z > 1 ? '64dvh' : undefined }}>
        <div style={{ width: `${z * 100}%` }}>{children}</div>
      </div>
      <div className="absolute bottom-1 right-1 flex flex-col gap-1">
        <button type="button" aria-label="지도 돌리기" onClick={() => setMapRot(rotNow + 1)}
          className="h-8 w-8 rounded-full bg-white/90 text-base font-black text-sky-900 shadow ring-1 ring-sky-900/10">🔄</button>
        {[['＋', Math.min(2.5, z + 0.5), '크게 보기'], ['－', Math.max(1, z - 0.5), '작게 보기']].map(([t, v, l]) => (
          <button key={t} type="button" aria-label={l} onClick={() => set(v)} disabled={v === z}
            className="h-8 w-8 rounded-full bg-white/90 text-lg font-black text-sky-900 shadow ring-1 ring-sky-900/10 disabled:opacity-40">{t}</button>
        ))}
      </div>
    </div>
  )
}

// range: { r, c } — 그 칸에서 이웃 효과가 닿는 범위(2칸)를 옅게 칠한다
// people: 가게 앞에 줄 선 손님 [{ id, r, c(지도 칸, 소수 가능), render(x, y) }] — 건물과 같이 앞뒤 순서대로 그린다
const TownMap = forwardRef(function TownMap({ town, mapId = 'main', onTile, selectedKey, closedKeys, shopRefs, overlay, extra, range, people }, ref) {
  const rot = useMapRot()
  useEffect(preloadTownArt, [])
  const tiles = []
  const objects = []
  // 화면 칸 순서(뒤→앞)로 그리고, 그 칸이 지도의 어느 칸인지 거꾸로 찾는다
  for (let dr = 0; dr < ROWS; dr++) {
    for (let dc = 0; dc < COLS; dc++) {
      const [r, c] = gridRC(dr, dc, rot)
      const t = tileAt(r, c, mapId)
      const [cx, cy] = center(dr, dc)
      const k = key(r, c, mapId)
      const scenery = t === '~' || t === 'I' // 바다·얼음 — 못 짓는 풍경
      const open = t === 'R' || scenery || unlocked(town, r, c, mapId)
      // 길 모양은 화면 방향으로 — 화면에서 ↗↘↙↖ 이웃이 길인지 (지도 밖으로 나가는 길도 이어지게)
      const road = (ddr, ddc) => {
        if (ddr < 0 || ddc < 0 || ddr > N1 || ddc > N1) return true
        return tileAt(...gridRC(ddr, ddc, rot), mapId) === 'R'
      }
      const F = MAP_FILTER[mapId] || {}
      const g = GROUND[landKind(mapId)]
      tiles.push(
        <g key={k} onClick={() => !scenery && onTile?.(r, c)} className={t === 'R' || scenery ? '' : 'cursor-pointer'}>
          {t === 'R' ? (
            <Tile cx={cx} cy={cy} src={roadSrc(road(dr - 1, dc), road(dr, dc + 1), road(dr + 1, dc), road(dr, dc - 1))} />
          ) : scenery ? (
            <Tile cx={cx} cy={cy} src={GROUND.water.src} h={GROUND.water.h} filter={t === 'I' ? 'saturate(0.35) brightness(1.3)' : F.water} />
          ) : (
            <Tile cx={cx} cy={cy} src={g.src} filter={open ? F.land : F.locked || F.land} />
          )}
          {t === '~' && SEA[(r * 3 + c) % 8] && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="13" className="town-bob">{SEA[(r * 3 + c) % 8]}</text>}
          {t === 'I' && ICE[(r * 5 + c) % 8] && <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" opacity="0.8">{ICE[(r * 5 + c) % 8]}</text>}
          {range && Math.max(Math.abs(range.r - r), Math.abs(range.c - c)) <= NEAR && <polygon points={diamond(cx, cy, 0.92)} fill="rgba(250,204,21,0.22)" stroke="rgba(234,179,8,0.5)" strokeWidth="1" pointerEvents="none" />}
          {selectedKey === k && !town.built[k] && <polygon points={diamond(cx, cy)} fill="rgba(250,204,21,0.35)" stroke="#facc15" strokeWidth="2.5" />}
        </g>,
      )
      if (!open && mapId === 'main') {
        const sign = SIGN_AT[t] === k
        objects.push({
          depth: dr + dc,
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
          depth: dr + dc,
          el: (
            <Building
              key={k}
              r={dr}
              c={dc}
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
          depth: dr + dc,
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
  for (const p of people || []) {
    const [vr, vc] = viewRC(p.r, p.c, rot)
    const [x, y] = center(vr, vc)
    objects.push({ depth: vr + vc + 0.01, el: <g key={`p${p.id}`} pointerEvents="none">{p.render(x, y)}</g> })
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
