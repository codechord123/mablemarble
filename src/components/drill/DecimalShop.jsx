// 소수 가게 타이쿤 — 줄 선 손님들의 주문(가격 × 양)을 계산해서 팔고,
// 하루가 끝나면 정산(매출 − 재료비 − 임대료 = 이익), 번 돈으로 상품·직원·광고·가게에 투자한다.
// 계산대 앞 손님은 떠나지 않는다(계산 중엔 기다려 준다). 줄 뒤 손님만 너무 오래 기다리면 간다.
// '느긋 모드'를 켜면 손님이 두 배 오래 기다리고 천천히 온다.

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { grade, show, D } from '../../utils/decimalGame.js'
import {
  PRODUCTS, PRODUCT_COST, productById, LESSONS, CUSTOMERS, LEVELS, STAFF, ADS, DECOR, QUESTS,
  todaysPrices, shelfFor, makeCustomer, dayRules, moodOf, MOOD_FACE, tipFor, settle, reputationOf,
  titleOf, addD, subD, gte, money, loadShop, saveShop, COST_RATE,
} from '../../utils/decimalShop.js'
import { useAccount } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { burstAt, cheer, flyCoins } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini, useHideSoundToggle } from '../ui/MuteToggle.jsx'

const RELAX_KEY = 'boomarble_tycoon_relaxed'

// ─── 가게 장면 ───
function Scene({ shop, owner, children, tall = false }) {
  const lv = LEVELS[shop.level]
  const has = (id) => shop.decor.includes(id)
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[1.5rem] shadow-xl ${tall ? 'h-[clamp(17rem,44dvh,24rem)]' : 'h-52'}`}
      style={{ background: `linear-gradient(180deg, ${lv.wall[0]}, ${lv.wall[1]})` }}
    >
      {lv.awning && (
        <div className="absolute inset-x-0 top-0 h-7 shop-awning" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${lv.awning[0]} 0 28px, ${lv.awning[1]} 28px 56px)` }} />
      )}
      <div className={`absolute left-1/2 ${lv.awning ? 'top-8' : 'top-2'} z-10 -translate-x-1/2 whitespace-nowrap rounded-xl px-3 py-1 text-sm font-black shadow ${has('rainbow') ? 'shop-rainbow text-white' : 'bg-amber-900 text-amber-50'}`}>
        {has('light') && '✨ '}{owner}의 {lv.name}{has('light') && ' ✨'}
      </div>
      <div className="absolute inset-x-3 top-[40%] h-2 rounded bg-amber-800/60 shadow" />
      {has('flag') && <span className="absolute left-2 top-8 text-3xl shop-sway">🎏</span>}
      {has('art') && <span className="absolute right-2 top-9 text-2xl">🖼️</span>}
      {has('fish') && <span className="absolute right-2 top-[22%] text-2xl">🐠</span>}
      {has('trophy') && <span className="absolute left-2 top-[22%] text-2xl">🏆</span>}
      {has('castle') && <span className="absolute left-10 top-[22%] text-2xl">🏰</span>}
      {has('plant') && <span className="absolute bottom-10 left-0 z-10 text-4xl">🪴</span>}
      {children}
      <div className="absolute inset-x-0 bottom-0 h-11 shop-counter" />
      {has('cat') && <span className="absolute bottom-8 left-[46%] z-10 text-2xl shop-bop">🐈</span>}
    </div>
  )
}

function Keypad({ onKey, disabled }) {
  const keys = ['7', '8', '9', '⌫', '4', '5', '6', '.', '1', '2', '3', '0']
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          disabled={disabled}
          onClick={() => onKey(k)}
          aria-label={k === '.' ? '소수점' : k === '⌫' ? '지우기' : k}
          className={`h-11 rounded-xl text-2xl font-black shadow-[0_3px_0_rgba(0,0,0,0.15)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50 sm:h-12 ${
            k === '.' ? 'bg-amber-300 text-amber-950' : k === '⌫' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 ring-1 ring-slate-200'
          }`}
        >
          {k === '.' ? '●' : k}
        </button>
      ))}
    </div>
  )
}

const Stars = ({ n }) => (
  <span className="tracking-tighter" aria-label={`평판 ${n.toFixed(1)}`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={n >= i - 0.25 ? 'text-amber-400' : 'text-amber-900/20'}>★</span>
    ))}
  </span>
)

function Money({ value, className = '', refEl }) {
  return (
    <span ref={refEl} className={`shrink-0 rounded-full bg-amber-900 px-3 py-1 text-sm font-black text-amber-50 tabular-nums ${className}`}>
      💰 {money(value)}G
    </span>
  )
}

// ─── 로비 ───
function Lobby({ shop, owner, relaxed, setRelaxed, onOpen, onBack, onModal }) {
  const ready = QUESTS.filter((q) => q.done(shop) && !shop.claimed.includes(q.id)).length
  return (
    <div className="min-h-[100dvh] shop-bg safe-padded px-4 pt-4 pb-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="text-sm font-bold text-amber-900/70">← 메인 메뉴</button>
          <SoundMini className="ml-auto" />
          <Money value={shop.money} />
        </div>
        <h1 className="mt-1 text-2xl font-black text-amber-950">🏪 소수 가게 타이쿤</h1>
        <div className="flex flex-wrap items-center gap-x-2 text-sm font-black text-amber-900">
          <span>{titleOf(shop.totalSales)}</span>
          <Stars n={reputationOf(shop)} />
          <span className="text-xs font-bold text-amber-900/60">· {shop.days}일째 · 총 매출 {money(shop.totalSales)}G</span>
        </div>

        <div className="mt-2">
          <Scene shop={shop} owner={owner}>
            <div className="absolute left-1/2 top-[24%] flex -translate-x-1/2 gap-2 text-2xl">
              {shop.products.map((id) => <span key={id}>{productById(id).icon}</span>)}
            </div>
            <span className="absolute bottom-9 left-1/2 -translate-x-1/2 text-5xl shop-bop">🧑‍🍳</span>
            {shop.staff >= 1 && <span className="absolute bottom-9 left-[30%] text-4xl">{STAFF[shop.staff].icon}</span>}
          </Scene>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <GameButton color="violet" onClick={() => onModal('invest')} className="py-3 text-sm">🛒 투자하기</GameButton>
          <GameButton color="orange" onClick={() => onModal('quests')} className="relative py-3 text-sm">
            🎯 목표
            {ready > 0 && <span className="absolute -right-1 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-xs shop-bop">{ready}</span>}
          </GameButton>
          <GameButton color="blue" onClick={() => onModal('book')} className="py-3 text-sm">📖 도감 {Object.keys(shop.met).length}</GameButton>
        </div>

        <div className="mt-3 rounded-[1.25rem] bg-white/90 p-3 shadow">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-black text-amber-900">🌅 오늘 장사 시작 <span className="font-bold text-amber-700/70">(배운 차시)</span></span>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs font-black text-sky-800">
              <input type="checkbox" checked={relaxed} onChange={(e) => setRelaxed(e.target.checked)} className="h-4 w-4 accent-sky-600" />
              🐢 느긋 모드
            </label>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {LESSONS.map((l) => {
              const shelf = shelfFor(l, shop.products)
              return (
                <button
                  key={l.type}
                  type="button"
                  onClick={() => onOpen(l)}
                  className="rounded-xl bg-amber-50 px-3 py-2 text-left ring-1 ring-amber-200 transition hover:bg-amber-100 active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1 text-xs font-black text-orange-600">
                    {l.lesson}
                    <span className="ml-auto text-base leading-none">{shelf.map((p) => p.icon).join('')}</span>
                  </span>
                  <span className="block text-sm font-black text-slate-800">{l.name}</span>
                  <span className="block text-[11px] font-bold text-slate-500">예) {l.ex}</span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-bold text-amber-900/60">
          손님 {shop.served}명 받음 · 놓친 손님 {shop.lost}명 · 최고 이익 {money(shop.bestProfit)}G
        </p>
      </div>
    </div>
  )
}

// ─── 투자 ───
function Invest({ shop, onBuy, onClose }) {
  const [tab, setTab] = useState('goods')
  const can = (c) => gte(shop.money, D(c))
  const Row = ({ icon, title, desc, cost, owned, locked, onClick }) => (
    <button
      type="button"
      disabled={owned || locked || !can(cost)}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${owned ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200 enabled:hover:bg-amber-50 disabled:opacity-60'}`}
    >
      <span className="text-3xl">{locked ? '🔒' : icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-800">{title}</span>
        <span className="block text-xs font-bold text-slate-500">{desc}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-black ${owned ? 'bg-emerald-500 text-white' : can(cost) && !locked ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-500'}`}>
        {owned ? '✔' : `${cost}G`}
      </span>
    </button>
  )
  const nextLv = LEVELS[shop.level + 1]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-[1.5rem] bg-white p-4 shadow-2xl">
        <div className="flex items-center">
          <h2 className="text-xl font-black text-slate-800">🛒 투자하기</h2>
          <Money value={shop.money} className="ml-auto" />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-black">
          {[['goods', '📦 상품'], ['people', '🧑‍💼 사람'], ['shop', '🏗️ 가게'], ['decor', '🎨 꾸미기']].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`rounded-lg py-1.5 ${tab === id ? 'bg-white text-slate-800 shadow' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {tab === 'goods' && (
            <>
              <p className="text-xs font-bold text-slate-500">비싼 상품일수록 한 번에 많이 벌어요 (계산하는 수도 조금 커져요)</p>
              {PRODUCTS.filter((p) => p.tier > 1).map((p) => {
                const owned = shop.products.includes(p.id)
                const locked = p.tier > 2 && !shop.products.some((id) => productById(id).tier === p.tier - 1)
                return (
                  <Row
                    key={p.id}
                    icon={p.icon}
                    title={`${p.name} 들여오기`}
                    desc={`${p.tier}등급 · ${p.kind === 'count' ? `개수로 팔아요 (1${p.unit}에 ○G)` : `${p.unit}로 달아서 팔아요`}${locked ? ` · ${p.tier - 1}등급 상품부터` : ''}`}
                    cost={PRODUCT_COST[p.tier]}
                    owned={owned}
                    locked={locked}
                    onClick={() => onBuy({ cost: PRODUCT_COST[p.tier], patch: (s) => ({ products: [...s.products, p.id] }) })}
                  />
                )
              })}
            </>
          )}
          {tab === 'people' && (
            <>
              {STAFF.slice(1).map((st, i) => (
                <Row key={st.name} icon={st.icon} title={st.name} desc={st.desc} cost={st.cost} owned={shop.staff >= i + 1} locked={shop.staff < i}
                  onClick={() => onBuy({ cost: st.cost, patch: () => ({ staff: i + 1 }) })} />
              ))}
              {ADS.slice(1).map((ad, i) => (
                <Row key={ad.name} icon={ad.icon} title={ad.name} desc={ad.desc} cost={ad.cost} owned={shop.ads >= i + 1} locked={shop.ads < i}
                  onClick={() => onBuy({ cost: ad.cost, patch: () => ({ ads: i + 1 }) })} />
              ))}
            </>
          )}
          {tab === 'shop' && (
            <>
              {LEVELS.map((lv, i) => (
                <div key={lv.name} className={`rounded-2xl p-3 ring-1 ${i === shop.level ? 'bg-amber-50 ring-amber-300' : 'bg-slate-50 ring-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${lv.wall[0]}, ${lv.wall[1]})` }} />
                    <span className="font-black text-slate-800">{lv.name}</span>
                    {i === shop.level && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-black text-white">지금</span>}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-500">하루 손님 {lv.perDay}명 · 줄 {lv.slots}칸 · 임대료 하루 {lv.rent}G</div>
                </div>
              ))}
              {nextLv && (
                <GameButton color={can(nextLv.cost) ? 'green' : 'gray'} disabled={!can(nextLv.cost)} onClick={() => onBuy({ cost: nextLv.cost, patch: (s) => ({ level: s.level + 1 }), big: true })} className="w-full py-3">
                  🏗️ {nextLv.name}(으)로 넓히기 · {nextLv.cost}G
                </GameButton>
              )}
            </>
          )}
          {tab === 'decor' && (
            <>
              <p className="text-xs font-bold text-slate-500">꾸밀수록 평판 ★이 올라요 → 손님이 더 오래 기다리고 VIP가 자주 와요</p>
              <div className="grid grid-cols-3 gap-2">
                {DECOR.map((d) => {
                  const own = shop.decor.includes(d.id)
                  const locked = d.need && shop.level < d.need
                  return (
                    <button key={d.id} type="button" disabled={own || locked || !can(d.cost)} onClick={() => onBuy({ cost: d.cost, patch: (s) => ({ decor: [...s.decor, d.id] }) })}
                      className={`rounded-2xl p-2 text-center ring-1 ${own ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200 disabled:opacity-60'}`}>
                      <div className="text-3xl">{locked ? '🔒' : d.icon}</div>
                      <div className="text-xs font-black text-slate-800">{d.name}</div>
                      <div className="text-[11px] font-black text-slate-500">{own ? '✔' : locked ? `${LEVELS[d.need].name}부터` : `${d.cost}G`}</div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <GameButton color="gray" onClick={onClose} className="mt-3 w-full py-2.5">닫기</GameButton>
      </motion.div>
    </motion.div>
  )
}

function Quests({ shop, onClaim, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-[1.5rem] bg-white p-4 shadow-2xl">
        <h2 className="text-xl font-black text-slate-800">🎯 사장님 목표</h2>
        <ol className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
          {QUESTS.map((q) => {
            const done = q.done(shop)
            const claimed = shop.claimed.includes(q.id)
            return (
              <li key={q.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${claimed ? 'bg-slate-50 ring-slate-200 opacity-60' : done ? 'bg-amber-50 ring-amber-300' : 'bg-white ring-slate-200'}`}>
                <span>{claimed ? '✅' : done ? '🎁' : '⬜'}</span>
                <span className="flex-1 text-sm font-black text-slate-800">{q.text}</span>
                {done && !claimed ? (
                  <button type="button" onClick={() => onClaim(q)} className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow shop-bop">+{q.reward}G 받기</button>
                ) : (
                  <span className="text-xs font-black text-slate-400">+{q.reward}G</span>
                )}
              </li>
            )
          })}
        </ol>
        <GameButton color="gray" onClick={onClose} className="mt-3 w-full py-2.5">닫기</GameButton>
      </motion.div>
    </motion.div>
  )
}

function CustomerBook({ shop, onClose }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} className="w-full max-w-md rounded-[1.5rem] bg-white p-4 shadow-2xl">
        <h2 className="text-xl font-black text-slate-800">📖 손님 도감</h2>
        <p className="text-xs font-bold text-slate-500">반짝이는 손님은 아주 가끔 와요. 모두 만나 볼까요?</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {CUSTOMERS.map(([e, n, r]) => {
            const seen = shop.met[e]
            return (
              <div key={e} className={`rounded-2xl p-2 text-center ${seen ? (r ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-sky-50') : 'bg-slate-100'}`}>
                <div className={`text-4xl ${seen ? '' : 'opacity-30 grayscale'}`}>{seen ? e : '❔'}</div>
                <div className="truncate text-[11px] font-black text-slate-700">{seen ? n : '???'}</div>
                {seen ? <div className="text-[10px] font-bold text-slate-400">{seen}번 옴</div> : null}
              </div>
            )
          })}
        </div>
        <GameButton color="gray" onClick={onClose} className="mt-3 w-full py-2.5">닫기</GameButton>
      </motion.div>
    </motion.div>
  )
}

// 기다림 고리 — 손님 머리 위
function PatienceRing({ frac, size = 46, children }) {
  const color = frac > 0.6 ? '#22c55e' : frac > 0.25 ? '#f59e0b' : '#ef4444'
  return (
    <span className="relative grid place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(${color} ${frac * 360}deg, rgba(0,0,0,0.12) 0)` }}>
      <span className="grid place-items-center rounded-full bg-white/90" style={{ width: size - 8, height: size - 8 }}>{children}</span>
    </span>
  )
}

// ─── 하루 장사 ───
function Day({ lesson, shop, owner, relaxed, onFinish, onQuit }) {
  const rules = useMemo(() => dayRules(lesson, shop, relaxed), []) // eslint-disable-line react-hooks/exhaustive-deps
  const shelf = useMemo(() => shelfFor(lesson, shop.products), []) // eslint-disable-line react-hooks/exhaustive-deps
  const prices = useMemo(() => todaysPrices(lesson.type, shelf.map((p) => p.id)), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState([]) // 줄 선 손님 (맨 앞 = 계산대)
  const [arrivals, setArrivals] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [paused, setPaused] = useState(false)
  const [input, setInput] = useState('')
  const [tries, setTries] = useState(0)
  const [helper, setHelper] = useState(false)
  const [state, setState] = useState('ask') // ask | paid | explain | done
  const [streak, setStreak] = useState(0)
  const [stats, setStats] = useState({ sales: D(0), tips: D(0), served: 0, lost: 0, vip: 0, best: 0, met: {}, first: 0 })
  const [toast, setToast] = useState(null)
  const [pop, setPop] = useState(null)
  const nextSpawn = useRef(Date.now())
  const pausedAt = useRef(0)
  const counterAt = useRef(Date.now()) // 지금 손님이 계산대에 온 시각
  const regRef = useRef(null)
  const moneyRef = useRef(null)
  const custRef = useRef(null)

  const active = queue[0]
  const waiting = queue.slice(1)

  useEffect(() => {
    if (import.meta.env.DEV) window.__shopOrder = active
  }, [active])

  // 시간 흐름 · 줄 뒤 손님 떠나기 (계산대 손님은 기다려 준다)
  const queueRef = useRef(queue)
  queueRef.current = queue
  useEffect(() => {
    if (paused || state === 'done') return
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      const gone = queueRef.current.slice(1).filter((c) => n - c.arrivedAt > rules.patience * 1000)
      if (!gone.length) return
      const ids = new Set(gone.map((c) => c.id))
      setQueue((q) => q.filter((c, i) => i === 0 || !ids.has(c.id)))
      setStats((st) => ({ ...st, lost: st.lost + gone.length }))
      setToast(`😤 ${gone[0].customer.name} 손님이 기다리다 갔어요`)
      sfx.wrong()
    }, 400)
    return () => clearInterval(t)
  }, [paused, state, rules.patience])

  useEffect(() => {
    if (paused || state === 'done') return
    if (arrivals >= rules.perDay || queue.length >= rules.slots || now < nextSpawn.current) return
    const c = { ...makeCustomer(lesson, shelf, prices, { vipChance: rules.vipChance, met: { ...shop.met, ...stats.met } }), arrivedAt: Date.now() }
    if (queue.length === 0) counterAt.current = Date.now()
    setQueue((q) => [...q, c])
    setArrivals((a) => a + 1)
    setStats((s) => ({ ...s, met: { ...s.met, [c.customer.emoji]: (s.met[c.customer.emoji] || 0) + 1 } }))
    // 처음 두 손님은 빨리, 그다음은 간격마다(조금씩 들쭉날쭉)
    nextSpawn.current = Date.now() + (arrivals < 1 ? 2500 : rules.gap * 1000 * (0.75 + Math.random() * 0.5))
    sfx.card?.()
  }, [now, paused, state, arrivals, queue.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // 줄이 비어 있으면 다음 손님을 바로 부른다
  useEffect(() => {
    if (queue.length === 0 && arrivals < rules.perDay && nextSpawn.current - Date.now() > 1500) nextSpawn.current = Date.now() + 1200
  }, [queue.length, arrivals, rules.perDay])

  // 하루 끝
  useEffect(() => {
    if (state !== 'done' && arrivals >= rules.perDay && queue.length === 0 && state !== 'paid') {
      setState('done')
      sfx.victory()
      onFinish({ ...stats, rent: rules.rent, best: Math.max(stats.best, streak) })
    }
  }, [arrivals, queue.length, state]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // VIP·희귀 손님이 계산대에 오면 반짝
  useEffect(() => {
    if (!active) return
    counterAt.current = Date.now()
    if (active.vip || active.customer.rare) setTimeout(() => burstAt(custRef.current, { count: 30 }), 300)
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePause() {
    if (!paused) {
      pausedAt.current = Date.now()
      setPaused(true)
      return
    }
    const d = Date.now() - pausedAt.current
    nextSpawn.current += d
    counterAt.current += d
    setQueue((q) => q.map((c) => ({ ...c, arrivedAt: c.arrivedAt + d })))
    setPaused(false)
  }

  function key(k) {
    if (state !== 'ask' || !active || paused) return
    setInput((s) => {
      if (k === '⌫') return s.slice(0, -1)
      if (k === '.') return s.includes('.') || s.length >= 10 ? s : (s || '0') + '.'
      if (s.length >= 10) return s
      return s === '0' ? k : s + k
    })
  }

  function finishCustomer(paidTip) {
    setTimeout(() => {
      setQueue((q) => q.slice(1))
      setInput('')
      setTries(0)
      setHelper(false)
      setPop(null)
      setState('ask')
    }, paidTip == null ? 0 : 1300)
  }

  function pay() {
    if (state !== 'ask' || !active || !input || paused) return
    const r = grade(active, input)
    if (r === 'invalid') return
    const waited = (Date.now() - counterAt.current) / 1000
    const mood = moodOf(waited, rules.patience)
    if (r === 'correct') {
      const firstTry = tries === 0
      const s = firstTry ? streak + 1 : 0
      const tip = helper && shop.staff < 2 ? 0 : tipFor({ firstTry, mood, vip: active.vip, streak: s, staff: shop.staff })
      setStreak(s)
      setStats((st) => ({
        ...st,
        sales: addD(st.sales, active.answer),
        tips: addD(st.tips, D(tip)),
        served: st.served + 1,
        first: st.first + (firstTry ? 1 : 0),
        vip: st.vip + (active.vip ? 1 : 0),
        best: Math.max(st.best, s),
      }))
      setPop({ amount: show(active.answer), tip })
      setState('paid')
      sfx.correct()
      flyCoins(regRef.current, moneyRef.current, { count: Math.min(12, 3 + Math.round(Number(show(active.answer)) / 10)), onEach: (i) => sfx.coinTick?.(i) })
      if (s >= 3 && s % 3 === 0) cheer(Math.min(s, 6), custRef.current)
      finishCustomer(tip)
      return
    }
    sfx.wrong()
    setStreak(0)
    if (tries === 0) {
      setTries(1)
      setHelper(true)
      setInput('')
    } else {
      // 손님이 바로잡아 주고 값은 치른다 (팁 없음)
      setStats((st) => ({ ...st, sales: addD(st.sales, active.answer), served: st.served + 1 }))
      setState('explain')
    }
  }

  // 키보드로도
  useEffect(() => {
    const onKey = (e) => {
      if (state === 'explain' && e.key === 'Enter') return explainDone()
      if (state !== 'ask') return
      if (/^[0-9]$/.test(e.key)) key(e.key)
      else if (e.key === '.' || e.key === ',') key('.')
      else if (e.key === 'Backspace') key('⌫')
      else if (e.key === 'Enter') pay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function explainDone() {
    setState('ask')
    finishCustomer(null)
  }

  const live = addD(addD(shop.money, stats.sales), stats.tips)
  const counterMood = active ? moodOf((now - counterAt.current) / 1000, rules.patience) : 'happy'
  const face = state === 'paid' ? '😍' : state === 'explain' || tries > 0 ? '🤔' : MOOD_FACE[counterMood]
  const bubble = !active ? '' : state === 'paid' ? (active.vip ? '역시 최고의 가게! 👑' : '고마워요! 또 올게요~') : state === 'explain' ? '제가 계산해 볼게요!' : tries > 0 ? '어? 계산이 이상한데… 다시 해 주실래요?' : active.say

  return (
    <div className="min-h-[100dvh] shop-bg safe-padded flex flex-col items-center px-3 pt-3 pb-6">
      <div className="w-full max-w-xl">
        {/* 위 띠 */}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onQuit} className="h-9 w-9 shrink-0 rounded-full bg-amber-900/15 font-black text-amber-900" aria-label="그만하기">✕</button>
          <button type="button" onClick={togglePause} className="h-9 w-9 shrink-0 rounded-full bg-amber-900/15 font-black text-amber-900" aria-label={paused ? '계속하기' : '잠깐 멈춤'}>{paused ? '▶' : '⏸'}</button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-black text-amber-950">{lesson.lesson} · 손님 {stats.served + stats.lost}/{rules.perDay}{relaxed ? ' · 🐢' : ''}</div>
            <div className="mt-0.5 flex gap-0.5">
              {Array.from({ length: rules.perDay }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < stats.served ? 'bg-emerald-500' : i < stats.served + stats.lost ? 'bg-rose-400' : i < arrivals ? 'bg-amber-500' : 'bg-amber-900/15'}`} />
              ))}
            </div>
          </div>
          <SoundMini />
          <Money value={live} refEl={moneyRef} />
        </div>

        {/* 가게 */}
        <div className="mt-2">
          <Scene shop={shop} owner={owner} tall>
            {/* 오늘의 가격표 */}
            <div className="absolute inset-x-2 top-[19%] z-10 flex flex-wrap justify-center gap-1">
              {shelf.map((p) => (
                <span key={p.id} className={`rounded-lg bg-white/95 px-1.5 py-0.5 text-[11px] font-black shadow ring-1 ${active?.product === p.id ? 'text-rose-600 ring-rose-300 scale-110' : 'text-slate-600 ring-slate-200'} transition`}>
                  {p.icon} {lesson.type === 'mix' || lesson.type === 'shift' ? p.name : `1${p.unit} ${show(prices[p.id])}G`}
                </span>
              ))}
            </div>
            {/* 줄 선 손님 */}
            <div className="absolute bottom-10 right-1 z-10 flex items-end gap-0.5">
              <AnimatePresence>
                {waiting.map((c) => {
                  const frac = Math.max(0, 1 - (now - c.arrivedAt) / (rules.patience * 1000))
                  return (
                    <motion.div key={c.id} layout initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} className="flex flex-col items-center">
                      <PatienceRing frac={frac} size={40}><span className="text-xl">{c.customer.emoji}</span></PatienceRing>
                      <span className="mt-0.5 rounded bg-white/80 px-1 text-[10px] font-black text-slate-600">{c.icon}{c.vip ? '👑' : ''}</span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
            {/* 계산대 손님 */}
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.id}
                  ref={custRef}
                  initial={{ x: 160, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -200, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 170, damping: 18 }}
                  className="absolute bottom-9 left-[30%] flex flex-col items-center"
                >
                  <div className={`relative text-[4rem] leading-none sm:text-[4.75rem] ${state === 'paid' ? 'shop-hop' : 'shop-bop'}`}>
                    {active.customer.emoji}
                    {active.vip && <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</span>}
                    <span className="absolute -right-3 -top-1 text-2xl">{face}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {active && (
              <motion.div
                key={`${active.id}-${state}-${tries}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute left-[4%] top-[38%] z-20 max-w-[52%] rounded-2xl bg-white px-3 py-1.5 text-sm font-black text-slate-800 shadow-lg"
              >
                {bubble}
                <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-white" />
              </motion.div>
            )}
            {!active && state !== 'done' && (
              <div className="absolute inset-x-0 top-[48%] text-center text-sm font-black text-amber-900/70">손님을 기다리는 중… 🎵</div>
            )}
            <span ref={regRef} className="absolute bottom-8 left-[12%] z-10 text-3xl">🧾</span>
            {shop.staff >= 1 && <span className="absolute bottom-8 left-[58%] z-10 text-3xl">{STAFF[shop.staff].icon}</span>}
            {pop && (
              <span className="shop-pop absolute bottom-20 left-[8%] z-20 whitespace-nowrap text-xl font-black text-emerald-700 drop-shadow">
                +{pop.amount}G{pop.tip ? ` 팁 +${pop.tip}` : ''}
              </span>
            )}
            <AnimatePresence>
              {toast && (
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-1 z-30 mx-auto w-fit rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow">
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
            {paused && (
              <div className="absolute inset-0 z-40 grid place-items-center bg-black/40">
                <button type="button" onClick={togglePause} className="rounded-2xl bg-white px-6 py-3 text-xl font-black text-slate-800 shadow-xl">⏸ 잠깐 멈춤 · ▶ 계속</button>
              </div>
            )}
          </Scene>
        </div>

        {/* 계산서 */}
        <div className="mt-2 rounded-[1.4rem] bg-white p-3 shadow-xl">
          {active ? (
            <>
              <div className="flex items-center justify-between text-xs font-black text-slate-500">
                <span>🧾 {active.customer.name} 손님 · {active.item} {active.qty} · {active.tag}</span>
                {streak >= 2 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-white combo-flame">🔥 {streak}</span>}
              </div>
              <div className="mt-0.5 text-center font-black text-slate-800 tabular-nums shop-expr">{active.price} × {show(active.b)} =</div>
              <div className="mx-auto flex max-w-[18rem] items-center gap-2">
                <div className={`flex h-12 flex-1 items-center justify-end rounded-2xl border-4 px-3 text-3xl font-black tabular-nums ${state === 'paid' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : input ? 'border-amber-400 bg-amber-50 text-slate-900' : 'border-dashed border-slate-300 text-slate-300'}`}>
                  {state === 'paid' ? show(active.answer) : input || '0'}
                </div>
                <span className="text-2xl font-black text-amber-700">G</span>
              </div>
              {helper && state === 'ask' && <div className="mt-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-center text-sm font-bold text-sky-900">💡 {active.helper}</div>}
            </>
          ) : (
            <div className="py-6 text-center text-sm font-black text-slate-400">손님이 오면 여기에 계산서가 나와요</div>
          )}
          <div className="mt-2">
            <Keypad onKey={key} disabled={state !== 'ask' || !active || paused} />
          </div>
          <div className="mt-2 flex gap-2">
            {!helper && (
              <button type="button" disabled={state !== 'ask' || !active} onClick={() => setHelper(true)} className="shrink-0 rounded-2xl bg-sky-100 px-3 text-sm font-black text-sky-800 disabled:opacity-50" title={shop.staff >= 2 ? '매니저가 도와줘요 (팁 그대로)' : '팁을 못 받아요'}>
                💡 도우미{shop.staff >= 2 ? '' : ''}
              </button>
            )}
            <GameButton color={input && state === 'ask' ? 'green' : 'gray'} disabled={!input || state !== 'ask' || paused} onClick={pay} className="flex-1 py-3 text-xl">
              💳 계산하기
            </GameButton>
          </div>
        </div>
      </div>

      {/* 두 번 틀렸을 때 */}
      <AnimatePresence>
        {state === 'explain' && active && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl">
              <div className="text-center text-lg font-black text-slate-700">{active.customer.emoji} {active.customer.name} 손님이 바로잡아 줬어요</div>
              <div className="mt-2 text-center text-2xl font-black text-slate-800 tabular-nums">
                {active.price} × {show(active.b)} = <span className="text-emerald-600">{show(active.answer)}G</span>
              </div>
              <ol className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-[0.95rem] font-bold leading-relaxed text-amber-950">
                {active.steps.map((s, i) => <li key={i}>✏️ {s}</li>)}
              </ol>
              <p className="mt-2 text-center text-xs font-bold text-slate-500">값은 받았지만 팁은 없어요. 다음 손님은 꼭!</p>
              <GameButton color="violet" onClick={explainDone} className="mt-3 w-full py-3 text-xl">알겠어요! 다음 손님 →</GameButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 정산서 ───
function Settlement({ result, shop, newQuests, onInvest, onAgain, onLobby }) {
  const r = result.sheet
  const good = r.profit.v >= 0
  const rows = [
    ['💵 매출', `+${money(r.sales)}G`, 'text-slate-800'],
    ['💝 팁', `+${money(r.tips)}G`, 'text-slate-800'],
    [`📦 재료비 (매출 × ${show(COST_RATE)})`, `−${money(r.material)}G`, 'text-rose-600'],
    ['🏠 임대료', `−${money(r.rent)}G`, 'text-rose-600'],
  ]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ y: 40, rotate: -2, scale: 0.9 }} animate={{ y: 0, rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className="w-full max-w-sm">
        <div className="shop-receipt rounded-t-2xl bg-white px-5 pb-6 pt-5 text-slate-800 shadow-2xl">
          <div className="text-center text-xs font-black tracking-[0.3em] text-slate-400">RECEIPT</div>
          <div className="text-center text-xl font-black">🧾 {shop.days}일째 정산서</div>
          <div className="mt-1 text-center text-xs font-bold text-slate-500">
            손님 {result.served}명 · 놓친 손님 {result.lost}명 · 한 번에 맞힘 {result.first} · VIP {result.vip}
          </div>
          <div className="mt-3 space-y-1.5 border-y-2 border-dashed border-slate-200 py-3">
            {rows.map(([k, v, c], i) => (
              <motion.div key={k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.2 }} className="flex justify-between text-sm font-bold">
                <span className="text-slate-600">{k}</span>
                <span className={`tabular-nums ${c}`}>{v}</span>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 300 }} className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-black">오늘 이익</span>
            <span className={`text-3xl font-black tabular-nums ${good ? 'text-emerald-600' : 'text-rose-600'}`}>{good ? '+' : ''}{money(r.profit)}G</span>
          </motion.div>
          <div className="mt-1 text-right text-sm font-black text-slate-500">가진 돈 💰 {money(shop.money)}G</div>
          {newQuests.length > 0 && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-800">🎯 목표 달성! {newQuests.map((q) => q.text).join(', ')} — 목표에서 상금을 받아요</div>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          <GameButton color="violet" onClick={onInvest} className="w-full py-3 text-lg">🛒 번 돈으로 투자하기</GameButton>
          <GameButton color="green" onClick={onAgain} className="w-full py-3 text-lg">🌅 다음 날 장사</GameButton>
          <GameButton color="gray" onClick={onLobby} className="w-full py-2.5">가게로</GameButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DecimalShop({ onBack }) {
  useHideSoundToggle()
  const me = useAccount((s) => s.me)
  const who = me?.username ? `acct:${me.username}` : 'device'
  const owner = me ? me.name || me.username : '나'
  const [shop, setShop] = useState(() => loadShop(who))
  const [lesson, setLesson] = useState(null)
  const [dayKey, setDayKey] = useState(0)
  const [result, setResult] = useState(null)
  const [modal, setModal] = useState(null)
  const [relaxed, setRelaxedState] = useState(() => {
    try { return localStorage.getItem(RELAX_KEY) === '1' } catch { return false }
  })
  const setRelaxed = (v) => {
    setRelaxedState(v)
    try { localStorage.setItem(RELAX_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }

  useEffect(() => setShop(loadShop(who)), [who])

  function update(fn) {
    setShop((cur) => {
      const n = { ...cur, ...fn(cur) }
      saveShop(who, n)
      return n
    })
  }

  function finishDay(r) {
    const sheet = settle({ sales: r.sales, tips: r.tips, rent: r.rent })
    const before = QUESTS.filter((q) => q.done(shop)).map((q) => q.id)
    const next = {
      ...shop,
      money: addD(shop.money, sheet.profit),
      days: shop.days + 1,
      served: shop.served + r.served,
      lost: shop.lost + r.lost,
      bestStreak: Math.max(shop.bestStreak, r.best),
      bestProfit: gte(sheet.profit, shop.bestProfit) ? sheet.profit : shop.bestProfit,
      totalSales: addD(shop.totalSales, r.sales),
      met: Object.entries(r.met).reduce((m, [e, c]) => ({ ...m, [e]: (m[e] || 0) + c }), shop.met),
    }
    saveShop(who, next)
    setShop(next)
    const newQuests = QUESTS.filter((q) => q.done(next) && !before.includes(q.id))
    if (gte(sheet.profit, D(1))) setTimeout(() => cheer(3), 900)
    setResult({ ...r, sheet, newQuests })
  }

  function buy({ cost, patch, big }) {
    if (!gte(shop.money, D(cost))) return
    sfx.coin()
    if (big) setTimeout(() => cheer(5), 100)
    update((s) => ({ ...patch(s), money: subD(s.money, D(cost)) }))
  }

  function claim(q) {
    sfx.victory()
    cheer(3)
    update((s) => ({ money: addD(s.money, D(q.reward)), claimed: [...s.claimed, q.id] }))
  }

  const modals = (
    <AnimatePresence>
      {modal === 'invest' && <Invest shop={shop} onBuy={buy} onClose={() => setModal(null)} />}
      {modal === 'quests' && <Quests shop={shop} onClaim={claim} onClose={() => setModal(null)} />}
      {modal === 'book' && <CustomerBook shop={shop} onClose={() => setModal(null)} />}
    </AnimatePresence>
  )

  if (!lesson)
    return (
      <>
        <Lobby shop={shop} owner={owner} relaxed={relaxed} setRelaxed={setRelaxed} onBack={onBack} onModal={setModal}
          onOpen={(l) => { setLesson(l); setResult(null); setDayKey((k) => k + 1) }} />
        {modals}
      </>
    )

  return (
    <>
      <Day key={dayKey} lesson={lesson} shop={shop} owner={owner} relaxed={relaxed} onFinish={finishDay}
        onQuit={() => { if (result || window.confirm('오늘 장사를 그만할까요? 오늘 번 돈은 저장되지 않아요.')) { setLesson(null); setResult(null) } }} />
      <AnimatePresence>
        {result && (
          <Settlement
            result={result}
            shop={shop}
            newQuests={result.newQuests}
            onInvest={() => { setResult(null); setLesson(null); setModal('invest') }}
            onAgain={() => { setResult(null); setDayKey((k) => k + 1) }}
            onLobby={() => { setResult(null); setLesson(null) }}
          />
        )}
      </AnimatePresence>
      {modals}
    </>
  )
}
