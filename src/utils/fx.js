// 화면 효과 모음 — 별·반짝이 터뜨리기, 동전 날리기, 화면 흔들기.
// 모두 리렌더 없이 그 자리에서 그렸다 지운다. '움직임 줄이기'에서는 아무것도 안 한다.
import confetti from 'canvas-confetti'
import { prefersReducedMotion } from './juice.js'

export const GOLDS = ['#fde047', '#facc15', '#f59e0b', '#fff7cc']

// 요소 가운데의 화면 위치(0~1) — confetti가 터질 자리
export function originOf(el, dy = 0) {
  if (!el || typeof window === 'undefined') return { x: 0.5, y: 0.5 }
  const r = el.getBoundingClientRect()
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2 + dy) / window.innerHeight,
  }
}

// 요소 자리에서 별·반짝이를 사방으로 터뜨린다
export function burstAt(el, { count = 40, colors = GOLDS, shapes = ['star', 'circle'], velocity = 24, spread = 360, scalar = 1, gravity = 0.9, dy = 0 } = {}) {
  if (prefersReducedMotion()) return
  confetti({
    particleCount: count,
    spread,
    startVelocity: velocity,
    gravity,
    scalar,
    ticks: 120,
    origin: originOf(el, dy),
    colors,
    shapes,
    disableForReducedMotion: true,
  })
}

// 연속 정답이 길어질수록 커지는 축하. 1번 = 보통, 3번부터 양옆 대포, 5번부터 불꽃놀이.
export function cheer(streak = 1, el = null) {
  if (prefersReducedMotion()) return
  const colors = streak >= 3 ? [...GOLDS, '#fb923c', '#f43f5e'] : ['#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6']
  const n = Math.min(160, 60 + streak * 18)
  confetti({ particleCount: n, spread: 80 + streak * 6, startVelocity: 32 + streak * 2, origin: el ? originOf(el) : { y: 0.4 }, colors, shapes: ['star', 'circle'], scalar: 1 + Math.min(0.5, streak * 0.08), disableForReducedMotion: true })
  if (streak >= 2) {
    confetti({ particleCount: 30 + streak * 8, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors, disableForReducedMotion: true })
    confetti({ particleCount: 30 + streak * 8, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors, disableForReducedMotion: true })
  }
  if (streak >= 5) {
    // 불꽃놀이 — 하늘 여기저기서 연달아 터진다
    const shots = Math.min(6, streak - 2)
    for (let i = 0; i < shots; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          startVelocity: 26,
          gravity: 0.7,
          ticks: 140,
          origin: { x: 0.15 + Math.random() * 0.7, y: 0.12 + Math.random() * 0.3 },
          colors: [GOLDS[i % GOLDS.length], '#f472b6', '#60a5fa', '#fff'],
          shapes: ['star', 'circle'],
          disableForReducedMotion: true,
        })
      }, 280 + i * 260)
    }
  }
}

// 화면(요소)을 흔든다 — 오답·큰 충격
export function shake(el, { px = 8, duration = 420 } = {}) {
  if (!el || prefersReducedMotion() || typeof el.animate !== 'function') return
  el.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${-px}px, ${px * 0.3}px) rotate(-0.4deg)`, offset: 0.12 },
      { transform: `translate(${px * 0.85}px, ${-px * 0.25}px) rotate(0.4deg)`, offset: 0.28 },
      { transform: `translate(${-px * 0.6}px, ${px * 0.2}px)`, offset: 0.45 },
      { transform: `translate(${px * 0.35}px, 0)`, offset: 0.62 },
      { transform: `translate(${-px * 0.15}px, 0)`, offset: 0.8 },
      { transform: 'translate(0, 0)' },
    ],
    { duration, easing: 'ease-out' },
  )
}

const COIN_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="10" fill="#fbbf24" stroke="#b45309" stroke-width="1.6"/>' +
  '<circle cx="12" cy="12" r="7.2" fill="none" stroke="#fef3c7" stroke-width="1.2" stroke-opacity="0.85"/>' +
  '<text x="12" y="16.2" text-anchor="middle" font-size="10" font-weight="800" fill="#92400e" font-family="Pretendard Variable, sans-serif">₩</text></svg>'

function centerOf(target) {
  if (!target) return null
  if ('x' in target && 'y' in target && !(target instanceof Element)) return target
  const r = target.getBoundingClientRect()
  if (!r.width && !r.height) return null
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

// 동전이 from에서 to로 줄지어 날아간다 (포물선, 빙글빙글).
// from·to: 요소 또는 {x, y} 화면 좌표. onEach(i): 동전 하나가 닿을 때마다.
export function flyCoins(from, to, { count = 8, stagger = 75, duration = 720, size = 30, onEach, onDone } = {}) {
  const a = centerOf(from)
  const b = centerOf(to)
  if (!a || !b || prefersReducedMotion() || typeof document === 'undefined') {
    onDone?.()
    return
  }
  const layer = document.createElement('div')
  layer.className = 'fx-coin-layer'
  document.body.appendChild(layer)
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  let left = count
  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div')
    coin.className = 'fx-coin'
    coin.style.width = coin.style.height = `${size}px`
    coin.innerHTML = COIN_SVG
    layer.appendChild(coin)
    // 동전마다 살짝 다른 길로 — 출발점이 흩어지고 높이가 다르다
    const sx = a.x + (Math.random() - 0.5) * 28
    const sy = a.y + (Math.random() - 0.5) * 18
    const lift = Math.min(220, 60 + dist * 0.35) * (0.8 + Math.random() * 0.4)
    const cx = (sx + b.x) / 2 + (Math.random() - 0.5) * 60
    const cy = Math.min(sy, b.y) - lift
    const frames = []
    const N = 14
    for (let k = 0; k <= N; k++) {
      const t = k / N
      const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * b.x
      const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * b.y
      const spin = Math.cos(t * Math.PI * 4)
      const sc = k === 0 ? 0.3 : t < 0.15 ? 1.15 : t > 0.9 ? 0.7 : 1
      frames.push({
        transform: `translate(${x - size / 2}px, ${y - size / 2}px) scale(${(sc * (0.35 + 0.65 * Math.abs(spin))).toFixed(3)}, ${sc})`,
        opacity: k === 0 ? 0 : t > 0.95 ? 0.6 : 1,
      })
    }
    const anim = coin.animate(frames, { duration, delay: i * stagger, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'both' })
    anim.onfinish = () => {
      coin.remove()
      onEach?.(i)
      left -= 1
      if (left === 0) {
        layer.remove()
        onDone?.()
      }
    }
  }
}

// ─── 칸 축하: 땅을 사거나 건물을 지었을 때 ───
// 칸이 금빛으로 빛나고, 빛기둥이 솟고, 새 건물이 땅에서 쑥 올라오며, 별과 동전이 튄다.
// kind: 'buy' | 'build' | 'hotel' | 'monopoly'
export function celebrateTile(tileId, kind = 'buy', { delay = 0 } = {}) {
  if (prefersReducedMotion() || typeof document === 'undefined') return
  const btn = document.querySelector(`[data-tile="${tileId}"]`)
  const root = btn?.firstElementChild
  if (!root || typeof root.animate !== 'function') return
  const big = kind === 'hotel' || kind === 'monopoly'

  // 칸 테두리가 금빛으로 번쩍
  root.querySelector('.tile-block')?.animate(
    [
      { boxShadow: '0 0 0 0 rgba(250, 204, 21, 0)' },
      { boxShadow: '0 0 0 3px #fde047, 0 0 22px 8px rgba(250, 204, 21, 0.85)', offset: 0.25 },
      { boxShadow: '0 0 0 0 rgba(250, 204, 21, 0)' },
    ],
    { duration: big ? 1300 : 1000, delay, easing: 'ease-out' },
  )

  // 빛기둥 — 보드에서 하늘로 서는 빛
  const pillar = document.createElement('div')
  pillar.className = 'fx-pillar-wrap stand-up'
  pillar.innerHTML = `<div class="fx-pillar ${big ? 'is-big' : ''}"></div>`
  root.appendChild(pillar)
  const beam = pillar.firstElementChild
  beam.animate(
    [
      { transform: 'scaleY(0) scaleX(0.4)', opacity: 0 },
      { transform: 'scaleY(1.05) scaleX(1)', opacity: 1, offset: 0.25 },
      { transform: 'scaleY(1) scaleX(0.85)', opacity: 0.8, offset: 0.55 },
      { transform: 'scaleY(1.1) scaleX(0.2)', opacity: 0 },
    ],
    { duration: big ? 1300 : 1000, delay, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'both' },
  ).onfinish = () => pillar.remove()

  // 새 건물(가장 높은 단계)이 땅에서 쑥 — 땅만 산 경우엔 부지 띠가 주인 색으로 차오른다
  const buildings = root.querySelectorAll('.lot-building')
  const newest = buildings[buildings.length - 1]
  if (kind !== 'buy' && newest) {
    newest.animate(
      [
        { transform: 'translateY(70%) scale(0.3, 0.1)', opacity: 0 },
        { transform: 'translateY(-30%) scale(1.15, 1.45)', opacity: 1, offset: 0.45 },
        { transform: 'translateY(4%) scale(1.25, 0.8)', offset: 0.68 },
        { transform: 'translateY(-4%) scale(0.95, 1.08)', offset: 0.84 },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
      { duration: 820, delay: delay + 120, easing: 'ease-out', fill: 'backwards' },
    )
  } else {
    root.querySelector('.building-lot')?.animate(
      [
        { transform: 'scaleY(0)', transformOrigin: '50% 0' },
        { transform: 'scaleY(1.35)', transformOrigin: '50% 0', offset: 0.55 },
        { transform: 'scaleY(1)', transformOrigin: '50% 0' },
      ],
      { duration: 600, delay: delay + 120, easing: 'ease-out', fill: 'backwards' },
    )
  }

  setTimeout(() => {
    burstAt(root, {
      count: big ? 90 : 45,
      velocity: big ? 30 : 22,
      scalar: big ? 1.15 : 0.95,
      colors: big ? [...GOLDS, '#f43f5e', '#fff'] : GOLDS,
      dy: -root.getBoundingClientRect().height * 0.3,
    })
  }, delay + 260)
}
