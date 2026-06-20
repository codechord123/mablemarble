import { TILE_TYPES, BUILDING_LABELS } from '../../utils/boardConfig.js'
import BuildingIcon from './BuildingIcon.jsx'

const STYLE = {
  [TILE_TYPES.START]:      { bg: 'bg-emerald-300', label: '출발',     icon: '🏁' },
  [TILE_TYPES.CITY]:       { bg: 'bg-white',       label: null,        icon: null },
  [TILE_TYPES.LANDMARK]:   { bg: 'bg-amber-200',   label: null,        icon: '🏛️' },
  [TILE_TYPES.GOLDEN_KEY]: { bg: 'bg-yellow-300',  label: '황금열쇠',  icon: '🔑' },
  [TILE_TYPES.ISLAND]:     { bg: 'bg-sky-200',     label: '무인도',    icon: '🏝️' },
  [TILE_TYPES.SPACE]:      { bg: 'bg-violet-300',  label: '우주여행',  icon: '🚀' },
  [TILE_TYPES.TAX]:        { bg: 'bg-rose-300',    label: '세금',      icon: '💸' },
  [TILE_TYPES.WELFARE]:    { bg: 'bg-pink-300',    label: '사회복지',  icon: '🎁' },
}

export default function Tile({ tile, owner, ownerInfo }) {
  const s = STYLE[tile.type] || {}
  const isCity = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const level = ownerInfo?.houses ?? 0

  return (
    <div
      className={`relative h-full w-full rounded border border-amber-800/30 ${s.bg} flex flex-col items-center justify-center text-[9px] sm:text-[11px] leading-tight overflow-hidden`}
      title={isCity && level > 0 ? `${tile.name} · ${BUILDING_LABELS[level]}` : tile.name}
    >
      {/* 소유주 컬러 띠 (상단) */}
      {owner && (
        <div className={`absolute top-0 left-0 right-0 h-2 ${owner.color}`} />
      )}

      <div className="mt-2 flex flex-col items-center justify-center gap-0.5">
        {isCity && level > 0 ? (
          <div className="my-0.5">
            <BuildingIcon level={level} />
          </div>
        ) : s.icon ? (
          <div className="text-base sm:text-xl">{s.icon}</div>
        ) : tile.country ? (
          <div className="text-base sm:text-lg">{tile.country}</div>
        ) : null}

        <div className="font-bold text-amber-900 text-center px-1 truncate w-full">
          {tile.name || s.label}
        </div>

        {tile.price && (
          <div className="text-[8px] sm:text-[10px] text-amber-700">{tile.price}원</div>
        )}
      </div>
    </div>
  )
}
