import { memo } from 'react'
import { TILE_TYPES, tileGroup } from '../../utils/boardConfig.js'
import BuildingIcon from './BuildingIcon.jsx'
import TileArt from './TileArt.jsx'

// 칸 바탕. 도시는 밝은 크림색 카드, 특수칸은 칸 성격을 알리는 색 카드.
// 위쪽을 밝게 두는 세로 그라데이션이라 조명을 받은 두꺼운 타일처럼 보인다.
const FACE = {
  [TILE_TYPES.START]:      { face: 'linear-gradient(180deg, #d1fae5 0%, #6ee7b7 100%)', label: '출발',     pill: '#047857' },
  [TILE_TYPES.CITY]:       { face: 'linear-gradient(180deg, #ffffff 0%, #fff7e6 100%)' },
  [TILE_TYPES.LANDMARK]:   { face: 'linear-gradient(180deg, #fffbeb 0%, #fde68a 100%)' },
  [TILE_TYPES.GOLDEN_KEY]: { face: 'linear-gradient(180deg, #fef9c3 0%, #fcd34d 100%)', label: '황금열쇠' },
  [TILE_TYPES.ISLAND]:     { face: 'linear-gradient(180deg, #e0f2fe 0%, #7dd3fc 100%)', label: '무인도',   pill: '#0369a1' },
  [TILE_TYPES.SPACE]:      { face: 'linear-gradient(180deg, #ede9fe 0%, #a78bfa 100%)', label: '우주여행', pill: '#6d28d9' },
  [TILE_TYPES.TAX]:        { face: 'linear-gradient(180deg, #ffe4e6 0%, #fda4af 100%)', label: '세금' },
  [TILE_TYPES.WELFARE]:    { face: 'linear-gradient(180deg, #fce7f3 0%, #f9a8d4 100%)', label: '사회복지', pill: '#be185d' },
}

const CORNERS = new Set([TILE_TYPES.START, TILE_TYPES.ISLAND, TILE_TYPES.SPACE, TILE_TYPES.WELFARE])

// 건물 부지 — 모두의 마블처럼 도시 카드마다 건물 자리가 따로 있다.
// 카드 맨 위 띠에 칸 3개를 두고 콘도 → 아파트 → 호텔이 한 칸씩 채워진다.
// (카드 밖 보드 가운데 쪽에 붙였더니 안쪽 모서리에서 이웃 부지와 겹치고
//  가운데 무대 자리도 줄어서, 카드 안으로 옮겼다.)
function BuildingLot({ owner, level }) {
  return (
    <div
      className={`building-lot absolute top-0 inset-x-0 z-[3] flex pointer-events-none rounded-t-md sm:rounded-t-lg ${
        owner ? `${owner.color} is-owned` : ''
      }`}
      title={owner?.name}
    >
      {[1, 2, 3].map((n) => (
        <div key={n} className="lot-slot relative flex-1 flex items-end justify-center">
          {level >= n ? (
            <span key={`b${n}`} className="lot-building building-pop">
              <BuildingIcon level={n} />
            </span>
          ) : (
            <span className="lot-empty" />
          )}
        </div>
      ))}
    </div>
  )
}

// edge: 칸이 놓인 줄('top'|'bottom'|'left'|'right', 모서리는 null).
// 왼쪽·오른쪽 줄 칸은 가로로 길고 세로가 짧아서 그림을 옆에 두고 이름·값을
// 나란히 놓는다. 그림은 보드 바깥쪽에 둔다.
// monopoly: 이 칸이 속한 색 줄을 한 사람이 모두 가짐 (통행료 2배)
// festival: 이번 라운드 축제 도시 (통행료 2배)
function Tile({ tile, owner, ownerInfo, edge, monopoly, festival }) {
  const side = edge === 'left' || edge === 'right' ? edge : null
  const s = FACE[tile.type] || {}
  const isCity = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const isCorner = CORNERS.has(tile.type)
  const level = ownerInfo?.houses ?? 0
  const isHotel = isCity && level === 3
  const group = isCity ? tileGroup(tile.id) : null
  const name = tile.name || s.label
  const artKey = isCity ? tile.country : tile.type

  const shell = `tile-block relative h-full w-full rounded-md sm:rounded-lg border ${
    isHotel ? 'border-rose-500 ring-2 ring-rose-400' : 'border-black/10'
  } overflow-hidden leading-tight`

  const building = isCity && <BuildingLot owner={owner} level={level} />
  // 도시 카드는 위쪽을 건물 부지 띠만큼 비워 둔다
  const lotPad = isCity ? { paddingTop: 'var(--lot)' } : null

  let face
  if (side) {
    face = (
      <div className={`${shell} flex ${side === 'right' ? 'flex-row-reverse' : 'flex-row'} items-stretch`} style={{ background: s.face, ...lotPad }} aria-label={name}>
        <div className="h-full w-[44%] shrink-0 flex items-center justify-center p-[3%] pt-[8%]">
          <TileArt artKey={artKey} alt="" className="h-full w-auto" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-[0.6cqi] px-[2%] pt-[4%]">
          {/* 도시 이름은 한 줄, '황금열쇠'처럼 긴 특수칸 이름은 두 줄로 접는다 */}
          <div
            className={`font-bold text-center w-full tile-text-name ${
              group ? 'truncate' : 'whitespace-pre-line'
            } ${isHotel ? 'text-rose-700' : 'text-amber-950'}`}
          >
            {group ? name : name.replace('황금열쇠', '황금\n열쇠')}
          </div>
          {group && (
            <div
              className="w-[92%] rounded-full text-center font-extrabold tile-text-meta tabular-nums py-[0.35cqi]"
              style={{
                background: group.gold ? 'linear-gradient(180deg, #fcd34d, #d97706)' : group.band,
                color: group.gold ? '#451a03' : '#fff',
                boxShadow: `inset 0 -2px 0 ${group.deep}`,
                textShadow: group.gold ? 'none' : `0 1px 0 ${group.deep}`,
              }}
            >
              {tile.price}
            </div>
          )}
        </div>
      </div>
    )
  } else {
    face = (
    <div
      className={`tile-block relative h-full w-full rounded-md sm:rounded-lg border ${
        isHotel ? 'border-rose-500 ring-2 ring-rose-400' : 'border-black/10'
      } flex flex-col items-center leading-tight overflow-hidden`}
      style={{ background: s.face, ...lotPad }}
      aria-label={name}
    >
      {/* 소유주 컬러 띠 (상단) */}
      {/* 그림 — 남는 높이를 모두 쓴다. 칸 모양(가로로 긴 옆줄, 세로로 긴 윗줄)에 맞춰
          알아서 줄어든다. */}
      <div
        className={`flex-1 min-h-0 w-full flex items-center justify-center ${
          isCorner ? 'px-[6%] pt-[6%]' : 'px-[8%] pt-[9%]'
        }`}
      >
        <TileArt artKey={artKey} alt="" className="h-full w-auto" />
      </div>

      {/* 이름 — 모서리 칸은 색 알약 이름표로 크게 */}
      {isCorner ? (
        <div
          className="tile-pill font-extrabold text-white tile-text-name mb-[7%] px-[0.9em] py-[0.25em] rounded-full"
          style={{ background: s.pill }}
        >
          {name}
        </div>
      ) : (
        <div
          className={`font-bold text-center w-full truncate tile-text-name px-0.5 pb-[3%] ${
            isHotel ? 'text-rose-700' : 'text-amber-950'
          }`}
        >
          {name}
        </div>
      )}

      {/* 그룹 색 띠 + 땅값. 색만 보고도 비싼 동네를 알아볼 수 있다. */}
      {group && (
        <div
          className="w-full text-center font-extrabold tile-text-meta tabular-nums py-[0.35cqi]"
          style={{
            background: group.gold ? 'linear-gradient(180deg, #fcd34d, #d97706)' : group.band,
            color: group.gold ? '#451a03' : '#fff',
            boxShadow: `inset 0 -2px 0 ${group.deep}`,
            textShadow: group.gold ? 'none' : `0 1px 0 ${group.deep}`,
          }}
        >
          {tile.price}
        </div>
      )}
    </div>
    )
  }

  return (
    <div className={`relative h-full w-full ${monopoly ? 'tile-monopoly' : ''}`}>
      {face}
      {building}
      {(monopoly || festival) && (
        <div className="tile-badges absolute z-[4] pointer-events-none flex gap-[1px]">
          {monopoly && <span title="라인 독점 — 통행료 2배">👑</span>}
          {festival && <span title="축제 도시 — 통행료 2배">🎉</span>}
        </div>
      )}
    </div>
  )
}

// 24개 칸이 매 상태 변화마다 리렌더되지 않도록 메모이제이션
export default memo(Tile, (prev, next) => {
  return (
    prev.tile === next.tile &&
    prev.owner?.id === next.owner?.id &&
    prev.owner?.color === next.owner?.color &&
    prev.ownerInfo?.houses === next.ownerInfo?.houses &&
    prev.edge === next.edge &&
    prev.monopoly === next.monopoly &&
    prev.festival === next.festival
  )
})
