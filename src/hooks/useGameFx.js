// 게임 사건에 맞춰 화면 효과를 붙인다 — 통행료 동전, 환급 동전, 땅·건물 축하.
// 상태는 바꾸지 않고 보기만 한다(효과가 실패해도 게임은 그대로 진행된다).
import { useEffect, useRef } from 'react'
import { celebrateTile, flyCoins } from '../utils/fx.js'
import { popEl } from '../utils/juice.js'
import { sfx } from '../utils/sounds.js'
import { groupTiles } from '../utils/boardConfig.js'

function inView(el) {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
}

// 그 사람 지갑 — 화면에 보이는 카드의 돈 칸, 카드가 화면 밖이면 보드 위 말
function walletOf(id) {
  const money = document.querySelector(`[data-player-card="${id}"] [data-money]`)
  if (inView(money)) return money
  const token = document.querySelector(`[data-token="${id}"] .token-figure`)
  return inView(token) ? token : money
}

function tokenOf(id) {
  const token = document.querySelector(`[data-token="${id}"] .token-figure`)
  return inView(token) ? token : walletOf(id)
}

export default function useGameFx(bigEvent, lastResult) {
  const lastEvent = useRef(null)
  const lastRes = useRef(null)

  useEffect(() => {
    if (bigEvent) {
      lastEvent.current = bigEvent
      // 통행료 — 내는 사람 말에서 땅 주인 지갑으로 동전이 줄지어 날아간다
      if (bigEvent.kind === 'toll' && bigEvent.payerId != null && bigEvent.receiverId != null) {
        const t = setTimeout(() => {
          const to = walletOf(bigEvent.receiverId)
          flyCoins(tokenOf(bigEvent.payerId), to, {
            count: Math.max(6, Math.min(12, Math.round(bigEvent.amount / 60))),
            stagger: 65,
            onEach: (i) => {
              sfx.coinTick(i)
              popEl(to, { scale: 1.25, duration: 200 })
            },
          })
        }, 350)
        return () => clearTimeout(t)
      }
      return
    }
    // 큰 글자 연출이 끝나면 — 그 칸에서 건물이 솟고 빛이 선다
    const ev = lastEvent.current
    lastEvent.current = null
    if (!ev || ev.tileId == null) return
    if (ev.kind === 'buy' || ev.kind === 'build' || ev.kind === 'hotel') {
      sfx.rise()
      celebrateTile(ev.tileId, ev.kind)
    } else if (ev.kind === 'monopoly') {
      sfx.rise()
      // 같은 색 줄이 차례로 번쩍 — 독점한 줄 전체가 보이게
      const ids = groupTiles(ev.group)
      ids.forEach((id, i) => celebrateTile(id, id === ev.tileId ? 'monopoly' : 'buy', { delay: i * 200 }))
    }
  }, [bigEvent])

  useEffect(() => {
    if (lastResult) {
      lastRes.current = lastResult
      return
    }
    // 통행료 문제를 맞혀 돌려받은 돈 — 은행(화면 위)에서 내 지갑으로
    const res = lastRes.current
    lastRes.current = null
    if (!res?.refund || res.playerId == null) return
    const to = walletOf(res.playerId)
    flyCoins({ x: window.innerWidth / 2, y: 24 }, to, {
      count: Math.max(4, Math.min(8, Math.round(res.refund / 40))),
      stagger: 80,
      onEach: (i) => {
        sfx.coinTick(i)
        popEl(to, { scale: 1.25, duration: 200 })
      },
    })
  }, [lastResult])
}
