import { TILE_TYPES } from '../../utils/boardConfig.js'
import { calculateToll } from '../../utils/gameEngine.js'

const TYPE_LABEL = {
  start: '출발', island: '무인도', space: '우주여행',
  tax: '세금', welfare: '사회복지', golden_key: '황금열쇠',
}

function Header({ player, tile, lastRoll }) {
  return (
    <div className="text-center">
      <div className="text-amber-900 font-bold text-lg">
        🎲 {lastRoll?.d1} + {lastRoll?.d2} = {lastRoll?.total}
        {lastRoll?.isDouble && <span className="ml-2 text-rose-600">더블!</span>}
      </div>
      <div className="text-amber-700">
        <strong className="text-amber-900">{player.name}</strong> →{' '}
        {tile.name || TYPE_LABEL[tile.type] || tile.type}
      </div>
    </div>
  )
}

function Btn({ children, onClick, color = 'bg-amber-600 hover:bg-amber-700' }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 ${color} text-white rounded-lg shadow font-bold transition`}
    >
      {children}
    </button>
  )
}

export default function TileActionPanel({ tile, player, players, ownership, lastRoll, onAction }) {
  const owner = ownership[tile.id]
  const purchasable = tile.type === TILE_TYPES.CITY || tile.type === TILE_TYPES.LANDMARK
  const nextLabel = lastRoll?.isDouble ? '계속' : '다음 턴'

  // 1. 빈 도시/랜드마크 — 구매 시도
  if (purchasable && !owner) {
    const canAfford = player.money >= tile.price
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-amber-800">
          💰 가격 {tile.price.toLocaleString()}원
          {!canAfford && <span className="text-rose-600 ml-2">(자금 부족)</span>}
        </div>
        <div className="flex gap-2">
          {canAfford && (
            <Btn onClick={() => onAction({ type: 'attempt-purchase' })} color="bg-emerald-600 hover:bg-emerald-700">
              문제 풀고 구매
            </Btn>
          )}
          <Btn onClick={() => onAction({ type: 'skip' })} color="bg-gray-400 hover:bg-gray-500">
            건너뛰기
          </Btn>
        </div>
      </div>
    )
  }

  // 2. 남의 도시 — 통행료 / 면제 시도
  if (purchasable && owner && owner.ownerId !== player.id) {
    const ownerPlayer = players[owner.ownerId]
    const toll = calculateToll(tile, owner.houses)
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-amber-800 flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${ownerPlayer.color}`} />
          <strong>{ownerPlayer.name}</strong>의 도시 · 통행료{' '}
          <strong>{toll.toLocaleString()}원</strong>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => onAction({ type: 'pay-toll', toll })}>지불</Btn>
          <Btn onClick={() => onAction({ type: 'attempt-skip-toll', toll })} color="bg-violet-600 hover:bg-violet-700">
            🎯 문제로 면제 시도
          </Btn>
        </div>
      </div>
    )
  }

  // 3. 내 도시
  if (purchasable && owner && owner.ownerId === player.id) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-emerald-700 font-semibold">🏠 내 도시</div>
        <Btn onClick={() => onAction({ type: 'skip' })}>{nextLabel}</Btn>
      </div>
    )
  }

  // 4. 세금
  if (tile.type === TILE_TYPES.TAX) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-rose-700 font-semibold">
          💸 세금 {tile.amount.toLocaleString()}원 차감
        </div>
        <Btn onClick={() => onAction({ type: 'pay-tax', amount: tile.amount })} color="bg-rose-600 hover:bg-rose-700">
          확인
        </Btn>
      </div>
    )
  }

  // 5. 사회복지 — 누적 세금 풀 지급
  if (tile.type === TILE_TYPES.WELFARE) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-emerald-700 font-semibold">🎁 사회복지 — 누적 세금을 모두 받습니다!</div>
        <Btn onClick={() => onAction({ type: 'claim-welfare' })} color="bg-emerald-600 hover:bg-emerald-700">
          받기
        </Btn>
      </div>
    )
  }

  // 6. 황금열쇠 — 카드 뽑기
  if (tile.type === TILE_TYPES.GOLDEN_KEY) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-yellow-700 font-semibold">🔑 카드를 뽑아 행운/불운을 확인하세요!</div>
        <Btn
          onClick={() => onAction({ type: 'draw-card' })}
          color="bg-yellow-500 hover:bg-yellow-600"
        >
          카드 뽑기
        </Btn>
      </div>
    )
  }

  // 7. 우주여행 — 도시 선택
  if (tile.type === TILE_TYPES.SPACE) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-violet-700 font-semibold">🚀 원하는 도시로 이동할 수 있습니다.</div>
        <Btn
          onClick={() => onAction({ type: 'space-pick' })}
          color="bg-violet-600 hover:bg-violet-700"
        >
          이동지 선택
        </Btn>
      </div>
    )
  }

  // 8. 무인도 — 도착 직후 (이번 턴은 안내만)
  if (tile.type === TILE_TYPES.ISLAND) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Header player={player} tile={tile} lastRoll={lastRoll} />
        <div className="text-sky-700 font-semibold">🏝️ 무인도에 갇혔습니다! (3턴)</div>
        <div className="text-xs text-amber-700 text-center">다음 턴부터 탈출 시도 가능</div>
        <Btn onClick={() => onAction({ type: 'skip' })}>{nextLabel}</Btn>
      </div>
    )
  }

  // 9. 출발
  return (
    <div className="flex flex-col items-center gap-3">
      <Header player={player} tile={tile} lastRoll={lastRoll} />
      <div className="text-amber-700 text-sm">🏁 출발 — 통과 시 자동으로 200원 지급됨</div>
      <Btn onClick={() => onAction({ type: 'skip' })}>{nextLabel}</Btn>
    </div>
  )
}
