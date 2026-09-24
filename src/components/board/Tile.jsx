import { memo } from 'react'
import { TILE_TYPES, BUILDING_LABELS, tileGroup } from '../../utils/boardConfig.js'
import BuildingIcon from './BuildingIcon.jsx'
import LandmarkIcon from './LandmarkIcon.jsx'
import SpecialIcon from './SpecialIcon.jsx'

const STYLE = {
  [TILE_TYPES.START]:      { bg: 'bg-emerald-300', label: '출발',     icon: '🏁' },
  [TILE_TYPES.CITY]:       { bg: 'bg-gradient-to-b from-white to-amber-50', label: null, icon: null },
  [TILE_TYPES.LANDMARK]:   { bg: 'bg-amber-200',   label: null,        icon: '🏛️' },
  [TILE_TYPES.GOLDEN_KEY]: { bg: 'bg-yellow-300',  label: '황금열쇠',  icon: '🔑' },
  [TILE_TYPES.ISLAND]:     { bg: 'bg-sky-200',     label: '무인도',    icon: '🏝️' },
  [TILE_TYPES.SPACE]:      { bg: 'bg-violet-300',  label: '우주여행',  icon: '🚀' },
  [TILE_TYPES.TAX]:        { bg: 'bg-rose-300',    label: '세금',      icon: '💸' },
  [TILE_TYPES.WELFARE]:    { bg: 'bg-pink-300',    label: '사회복지',  icon: '🎁' },
}

function Tile({ tile, owner, ownerInfo }) {
  const s = STYLE[tile.type] || {}
  const isCity = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const level = ownerInfo?.houses ?? 0
  const isHotel = isCity && level === 3
  const group = isCity ? tileGroup(tile.id) : null

  return (
    <div
      className={`tile-block relative h-full w-full rounded-md border ${
        isHotel
          ? 'border-rose-500 ring-2 ring-rose-400 bg-stripes-rose'
          : 'border-amber-900/25'
      } ${s.bg} flex flex-col items-center leading-tight overflow-hidden`}
      aria-label={tile.name || s.label}
    >
      {/* 소유주 컬러 띠 (상단) */}
      {owner && (
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${owner.color}`}
          title={owner.name}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-[0.3cqi] w-full px-0.5 pt-[0.5cqi]">
        {/* 도시 랜드마크 + 빌딩 아이콘 */}
        {isCity && tile.country && (
          <div className="flex items-center gap-1 leading-none">
            <span
              className="inline-flex items-center"
              style={{
                width: 'clamp(12px, 4.8cqi, 38px)',
                height: 'clamp(12px, 4.8cqi, 38px)',
              }}
            >
              <LandmarkIcon code={tile.country} />
            </span>
            {level > 0 && (
              <span
                className="inline-flex items-center"
                style={{
                  width: 'clamp(14px, 4.5cqi, 32px)',
                  height: 'clamp(14px, 4.5cqi, 32px)',
                }}
              >
                <BuildingIcon level={level} />
              </span>
            )}
          </div>
        )}
        {/* 도시가 아닌 칸: 기본 아이콘 */}
        {!isCity && (
          <div className="tile-icon flex items-center justify-center">
            <SpecialIcon type={tile.type} />
          </div>
        )}

        <div
          className={`font-bold text-center w-full truncate tile-text-name ${
            isHotel ? 'text-rose-700' : 'text-amber-900'
          }`}
        >
          {tile.name || s.label}
        </div>

        {/* 호텔 표시 — 색맹 친화: 색+패턴+텍스트 */}
        {isHotel && (
          <div className="text-rose-700 font-extrabold tile-text-meta">⚠ HOTEL</div>
        )}
      </div>

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
    prev.ownerInfo?.houses === next.ownerInfo?.houses
  )
})
