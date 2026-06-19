import { TILE_TYPES, BUILDING_ICONS, BUILDING_LABELS } from '../../utils/boardConfig.js'

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
  const buildingIcon = isCity && level > 0 ? BUILDING_ICONS[level] : null

  return (
    <div
      className={`relative h-full w-full rounded border border-amber-800/30 ${s.bg} flex flex-col items-center justify-center text-[9px] sm:text-[11px] leading-tight overflow-hidden`}
      title={isCity && level > 0 ? `${tile.name} · ${BUILDING_LABELS[level]}` : tile.name}
    >
      {buildingIcon ? (
        <div className="text-base sm:text-xl">{buildingIcon}</div>
      ) : s.icon ? (
        <div className="text-base sm:text-xl">{s.icon}</div>
      ) : tile.country ? (
        <div className="text-sm sm:text-base">{tile.country}</div>
      ) : null}
      <div className="font-bold text-amber-900 text-center px-1 truncate w-full">
        {tile.name || s.label}
      </div>
      {tile.price && <div className="text-[8px] sm:text-[10px] text-amber-700">{tile.price}원</div>}
      {owner && <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${owner.color}`} />}
    </div>
  )
}
