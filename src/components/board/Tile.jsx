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

// side: 보드 왼쪽·오른쪽 줄 칸('left'|'right'). 이 칸들은 가로로 길고 세로가 짧아서
// 그림을 옆에 두고 이름·값을 나란히 놓는다. 그림은 보드 바깥쪽에 둔다.
function Tile({ tile, owner, ownerInfo, side }) {
  const s = FACE[tile.type] || {}
  const isCity = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const isCorner = CORNERS.has(tile.type)
  const level = ownerInfo?.houses ?? 0
  const isHotel = isCity && level === 3
  const group = isCity ? tileGroup(tile.id) : null
  const name = tile.name || s.label
  const artKey = isCity ? tile.country : tile.type

  const shell = `tile-block relative h-full w-full rounded-md sm:rounded-lg border ${
    isHotel ? 'border-rose-500 ring-2 ring-rose-400' : 'border-amber-900/25'
  } overflow-hidden leading-tight`

  const building = isCity && level > 0 && (
    <span
      key={level}
      className={`building-pop absolute top-[4%] aspect-square z-[2] pointer-events-none ${
        side ? `h-[58%] ${side === 'left' ? 'left-[22%]' : 'right-[22%]'}` : 'right-[2%] top-[6%] w-[50%]'
      }`}
    >
      <BuildingIcon level={level} />
    </span>
  )

  if (side) {
    return (
      <div className={`${shell} flex ${side === 'right' ? 'flex-row-reverse' : 'flex-row'} items-stretch`} style={{ background: s.face }} aria-label={name}>
        {owner && (
          <div className={`absolute top-0 inset-x-0 h-[9%] min-h-[3px] z-[1] ${owner.color}`} title={owner.name} />
        )}
        <div className="h-full w-[44%] shrink-0 flex items-center justify-center p-[3%] pt-[8%]">
          <TileArt artKey={artKey} alt="" className="h-full w-auto" />
        </div>
        {building}
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
  }

  return (
    <div
      className={`tile-block relative h-full w-full rounded-md sm:rounded-lg border ${
        isHotel ? 'border-rose-500 ring-2 ring-rose-400' : 'border-amber-900/25'
      } flex flex-col items-center leading-tight overflow-hidden`}
      style={{ background: s.face }}
      aria-label={name}
    >
      {/* 소유주 컬러 띠 (상단) */}
      {owner && (
        <div className={`absolute top-0 inset-x-0 h-[7%] min-h-[3px] z-[1] ${owner.color}`} title={owner.name} />
      )}

      {/* 그림 — 남는 높이를 모두 쓴다. 칸 모양(가로로 긴 옆줄, 세로로 긴 윗줄)에 맞춰
          알아서 줄어든다. */}
      <div
        className={`flex-1 min-h-0 w-full flex items-center justify-center ${
          isCorner ? 'px-[6%] pt-[6%]' : 'px-[8%] pt-[9%]'
        }`}
      >
        <TileArt artKey={artKey} alt="" className="h-full w-auto" />
      </div>

      {/* 건물 — 랜드마크 그림 오른쪽 위에 세운다. 레벨이 오를 때마다 다시 솟는다. */}
      {building}

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

// 24개 칸이 매 상태 변화마다 리렌더되지 않도록 메모이제이션
export default memo(Tile, (prev, next) => {
  return (
    prev.tile === next.tile &&
    prev.owner?.id === next.owner?.id &&
    prev.owner?.color === next.owner?.color &&
    prev.ownerInfo?.houses === next.ownerInfo?.houses &&
    prev.side === next.side
  )
})
