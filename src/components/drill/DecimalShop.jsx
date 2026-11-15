// 소수 마을 타이쿤 — 마을 지도에 가게를 짓고, 길 따라 찾아오는 손님의 주문(가격 × 양)을 계산해 판다.
// 하루가 끝나면 정산서(매출 + 팁 − 재료비 − 유지비 = 이익), 번 돈으로 가게·장식·땅에 투자한다.
// 가게를 눌러 그 가게 손님을 맞는다. 계산 중인 손님은 기다려 주고, 다른 가게 앞 손님만 오래 기다리면 간다.
// '느긋 모드'면 손님이 두 배 오래 기다리고 천천히 온다.

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { grade, show, D } from '../../utils/decimalGame.js'
import {
  SHOPS, DECOR, ZONES, ADS, LESSONS, CUSTOMERS, QUESTS, MAX_LV, UPGRADE_COST, ENTRANCES, COST_RATE,
  shopById, productById, decorById, tileAt, unlocked, roadSide, frontRoad, roadPath, key as tkey, parseKey,
  shopsIn, openShops, todaysPrices, makeCustomer, dayRules, slotsOf, moodOf, MOOD_FACE, tipFor, settle,
  popularityOf, upkeepOf, titleOf, addD, subD, gte, money, loadTown, saveTown,
} from '../../utils/decimalShop.js'
import { useAccount } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { cheer, flyCoins } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini, useHideSoundToggle } from '../ui/MuteToggle.jsx'
import TownMap, { center } from './TownMap.jsx'

const RELAX_KEY = 'boomarble_tycoon_relaxed'
const STEP_MS = 420 // 손님이 한 칸 걷는 시간

const Stars = ({ n }) => (
  <span className="tracking-tighter" aria-label={`인기 ${n.toFixed(1)}`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={n >= i - 0.25 ? 'text-amber-400' : 'text-amber-900/20'}>★</span>
    ))}
  </span>
)
function Money({ value, refEl, className = '' }) {
  return (
    <span ref={refEl} className={`shrink-0 rounded-full bg-amber-900 px-3 py-1 text-sm font-black text-amber-50 tabular-nums ${className}`}>
      💰 {money(value)}G
    </span>
  )
}

function Sheet({ title, onClose, children, wide }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[85dvh] w-full ${wide ? 'max-w-lg' : 'max-w-md'} flex-col rounded-[1.5rem] bg-white p-4 shadow-2xl`}
      >
        <div className="flex items-center">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="ml-auto h-8 w-8 rounded-full bg-slate-100 font-black text-slate-500" aria-label="닫기">✕</button>
        </div>
        <div className="mt-2 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  )
}

function Buy({ icon, title, desc, cost, can, done, locked, onClick }) {
  return (
    <button
      type="button"
      disabled={done || locked || !can}
      onClick={onClick}
      className={`mb-1.5 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left ring-1 transition ${done ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200 enabled:hover:bg-amber-50 disabled:opacity-55'}`}
    >
      <span className="text-3xl">{locked ? '🔒' : icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-800">{title}</span>
        <span className="block text-xs font-bold text-slate-500">{desc}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-black ${done ? 'bg-emerald-500 text-white' : can && !locked ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-500'}`}>
        {done ? '✔' : `${cost}G`}
      </span>
    </button>
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
          className={`h-11 rounded-xl text-2xl font-black shadow-[0_3px_0_rgba(0,0,0,0.15)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
            k === '.' ? 'bg-amber-300 text-amber-950' : k === '⌫' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 ring-1 ring-slate-200'
          }`}
        >
          {k === '.' ? '●' : k}
        </button>
      ))}
    </div>
  )
}

// ─── 마을 (장사 전·후) ───
function Town({ town, owner, relaxed, setRelaxed, onBack, onStart, onUpdate, onModal }) {
  const [sheet, setSheet] = useState(null) // { type: 'lot'|'shop'|'decor'|'zone'|'lessons'|'ads', r, c }
  const pop = popularityOf(town)
  const can = (c) => gte(town.money, D(c))
  const ready = QUESTS.filter((q) => q.done(town) && !town.claimed.includes(q.id)).length
  const builtIds = new Set(Object.values(town.built).map((b) => b.id))

  function onTile(r, c) {
    const t = tileAt(r, c)
    if (t === 'R') return
    const k = tkey(r, c)
    const b = town.built[k]
    if (b) return setSheet({ type: b.kind, r, c })
    if (!unlocked(town, r, c)) return setSheet({ type: 'zone', zone: t })
    setSheet({ type: 'lot', r, c })
  }
  function pay(cost, patch, big) {
    if (!can(cost)) return
    sfx.coin()
    if (big) setTimeout(() => cheer(4), 120)
    onUpdate((s) => ({ ...patch(s), money: subD(s.money, D(cost)) }))
    setSheet(null)
  }
  const sk = sheet && sheet.r != null ? tkey(sheet.r, sheet.c) : null
  const here = sk ? town.built[sk] : null

  return (
    <div className="min-h-[100dvh] town-bg safe-padded px-3 pt-3 pb-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="text-sm font-bold text-sky-900/70">← 메뉴</button>
          <SoundMini className="ml-auto" />
          <Money value={town.money} />
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-2xl font-black text-sky-950">🏘️ {owner}의 소수 마을</h1>
          <span className="text-sm font-black text-sky-900">{titleOf(town.totalSales)} <Stars n={pop} /></span>
        </div>
        <p className="text-xs font-bold text-sky-900/70">빈 땅을 눌러 가게·장식을 짓고, 가게를 눌러 키워요 · {town.days}일째 · 하루 유지비 {upkeepOf(town)}G</p>

        <div className="relative mt-1">
          <TownMap town={town} onTile={onTile} selectedKey={sk} />
        </div>

        <div className="mt-1 grid grid-cols-4 gap-2">
          <GameButton color="green" onClick={() => setSheet({ type: 'lessons' })} className="col-span-4 py-3.5 text-xl sm:col-span-1 sm:text-base">🌅 장사 시작</GameButton>
          <GameButton color="orange" onClick={() => onModal('quests')} className="relative py-2.5 text-sm">
            🎯 목표
            {ready > 0 && <span className="absolute -right-1 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-xs shop-bop">{ready}</span>}
          </GameButton>
          <GameButton color="blue" onClick={() => onModal('book')} className="py-2.5 text-sm">📖 도감 {Object.keys(town.met).length}</GameButton>
          <GameButton color="violet" onClick={() => setSheet({ type: 'ads' })} className="py-2.5 text-sm">📣 광고</GameButton>
        </div>
        <p className="mt-2 text-center text-xs font-bold text-sky-900/60">
          손님 {town.served}명 받음 · 놓친 손님 {town.lost}명 · 총 매출 {money(town.totalSales)}G · 최고 이익 {money(town.bestProfit)}G
        </p>
      </div>

      <AnimatePresence>
        {sheet?.type === 'lessons' && (
          <Sheet title="🌅 오늘 장사 — 배운 차시 고르기" onClose={() => setSheet(null)} wide>
            <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm font-black text-sky-900">
              <input type="checkbox" checked={relaxed} onChange={(e) => setRelaxed(e.target.checked)} className="h-4 w-4 accent-sky-600" />
              🐢 느긋 모드 <span className="font-bold text-sky-700/80">손님이 두 배 오래 기다리고 천천히 와요</span>
            </label>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {LESSONS.map((l) => {
                const open = openShops(l, town)
                return (
                  <button
                    key={l.type}
                    type="button"
                    disabled={!open.length}
                    onClick={() => { setSheet(null); onStart(l) }}
                    className="rounded-xl bg-amber-50 px-3 py-2 text-left ring-1 ring-amber-200 transition hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-1 text-xs font-black text-orange-600">
                      {l.lesson}
                      <span className="ml-auto text-base leading-none">{open.map((s) => s.shop.icon).join('')}</span>
                    </span>
                    <span className="block text-sm font-black text-slate-800">{l.name}</span>
                    <span className="block text-[11px] font-bold text-slate-500">{open.length ? `예) ${l.ex}` : '이 차시를 팔 가게가 없어요'}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">개수로 파는 가게(🍭🍩🥐💎)는 2·3차시, 달아서 파는 가게(🍉🧵🐄🥩)는 4~7차시에 문을 열어요.</p>
          </Sheet>
        )}

        {sheet?.type === 'lot' && (
          <Sheet title="🏗️ 여기에 무엇을 지을까요?" onClose={() => setSheet(null)} wide>
            {roadSide(sheet.r, sheet.c) ? (
              <>
                <div className="mb-1 text-xs font-black text-slate-500">가게 (길 옆이라 지을 수 있어요)</div>
                {SHOPS.map((s) => {
                  const locked = s.tier > 1 && !shopsIn(town).some((x) => x.shop.tier >= s.tier - 1)
                  return (
                    <Buy
                      key={s.id}
                      icon={s.icon}
                      title={`${s.name} (${s.tier}등급)`}
                      desc={`${s.products.map((id) => productById(id).icon + productById(id).name).join(' · ')} — ${s.kind === 'count' ? '개수로 팔아요' : '달아서 팔아요'}${locked ? ` · ${s.tier - 1}등급 가게부터` : ''}`}
                      cost={s.cost}
                      can={can(s.cost)}
                      done={builtIds.has(s.id)}
                      locked={locked}
                      onClick={() => pay(s.cost, (t) => ({ built: { ...t.built, [tkey(sheet.r, sheet.c)]: { kind: 'shop', id: s.id, lv: 1 } } }), s.tier >= 3)}
                    />
                  )
                })}
              </>
            ) : (
              <p className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">길에서 떨어진 땅이라 가게는 못 지어요. 장식을 놓아 마을 인기를 올려 보세요!</p>
            )}
            <div className="mb-1 mt-2 text-xs font-black text-slate-500">장식 (마을 인기 ★ ↑ → 손님이 더 많이·오래)</div>
            <div className="grid grid-cols-4 gap-1.5">
              {DECOR.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={!can(d.cost)}
                  onClick={() => pay(d.cost, (t) => ({ built: { ...t.built, [tkey(sheet.r, sheet.c)]: { kind: 'decor', id: d.id } } }), d.cost >= 300)}
                  className="rounded-2xl bg-slate-50 p-1.5 text-center ring-1 ring-slate-200 enabled:hover:bg-amber-50 disabled:opacity-50"
                >
                  <div className="text-3xl">{d.icon}</div>
                  <div className="text-[11px] font-black text-slate-700">{d.name}</div>
                  <div className="text-[11px] font-black text-amber-600">{d.cost}G</div>
                </button>
              ))}
            </div>
          </Sheet>
        )}

        {sheet?.type === 'shop' && here && (() => {
          const s = shopById(here.id)
          const lv = here.lv || 1
          const cost = UPGRADE_COST(s, lv)
          return (
            <Sheet title={`${s.icon} ${s.name} · Lv.${lv}`} onClose={() => setSheet(null)}>
              <div className="rounded-2xl p-3" style={{ background: `linear-gradient(135deg, ${s.color[1]}, ${s.color[2]})` }}>
                <div className="text-sm font-black text-slate-800">파는 물건: {s.products.map((id) => `${productById(id).icon} ${productById(id).name}`).join(', ')}</div>
                <div className="mt-1 text-xs font-bold text-slate-600">{s.tier}등급 · {s.kind === 'count' ? '개수로 팔아요 (2·3·8차시)' : '달아서 팔아요 (4~8차시)'}</div>
                <div className="mt-1 text-xs font-bold text-slate-600">가게 앞 줄 {slotsOf(lv)}칸 · 팁 +{lv - 1}G · 하루 유지비 {s.tier * lv}G</div>
              </div>
              {lv < MAX_LV ? (
                <GameButton color={can(cost) ? 'green' : 'gray'} disabled={!can(cost)} className="mt-3 w-full py-3"
                  onClick={() => pay(cost, (t) => ({ built: { ...t.built, [sk]: { ...here, lv: lv + 1 } } }), true)}>
                  ⬆️ Lv.{lv + 1}로 키우기 · {cost}G
                  <div className="text-xs font-semibold opacity-90">줄 {slotsOf(lv + 1)}칸 · 팁 +{lv}G · 건물이 커지고 마을 인기 ↑</div>
                </GameButton>
              ) : (
                <div className="mt-3 rounded-xl bg-amber-50 py-3 text-center font-black text-amber-700">🏆 최고 레벨이에요!</div>
              )}
            </Sheet>
          )
        })()}

        {sheet?.type === 'decor' && here && (
          <Sheet title={`${decorById(here.id).icon} ${decorById(here.id).name}`} onClose={() => setSheet(null)}>
            <p className="text-sm font-bold text-slate-600">마을 인기 +{decorById(here.id).pop}★ 를 주는 장식이에요.</p>
            <GameButton color="gray" className="mt-3 w-full py-2.5" onClick={() => {
              onUpdate((t) => { const b = { ...t.built }; delete b[sk]; return { built: b } })
              setSheet(null)
            }}>치우기 (돈은 돌려받지 않아요)</GameButton>
          </Sheet>
        )}

        {sheet?.type === 'zone' && (
          <Sheet title={`🗺️ ${ZONES[sheet.zone].name} 사기`} onClose={() => setSheet(null)}>
            <p className="text-sm font-bold text-slate-600">땅을 사면 가게와 장식을 더 지을 수 있어요.</p>
            <GameButton color={can(ZONES[sheet.zone].cost) ? 'green' : 'gray'} disabled={!can(ZONES[sheet.zone].cost)} className="mt-3 w-full py-3"
              onClick={() => pay(ZONES[sheet.zone].cost, (t) => ({ zones: [...t.zones, sheet.zone] }), true)}>
              🗺️ {ZONES[sheet.zone].cost}G에 사기
            </GameButton>
          </Sheet>
        )}

        {sheet?.type === 'ads' && (
          <Sheet title="📣 광고" onClose={() => setSheet(null)}>
            {ADS.slice(1).map((ad, i) => (
              <Buy key={ad.name} icon={ad.icon} title={ad.name} desc={ad.desc} cost={ad.cost} can={can(ad.cost)} done={town.ads >= i + 1} locked={town.ads < i}
                onClick={() => pay(ad.cost, () => ({ ads: i + 1 }))} />
            ))}
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 장사하는 하루 ───
function Day({ lesson, town, owner, relaxed, onFinish, onQuit }) {
  const rules = useMemo(() => dayRules(lesson, town, relaxed), []) // eslint-disable-line react-hooks/exhaustive-deps
  const open = useMemo(() => openShops(lesson, town), []) // eslint-disable-line react-hooks/exhaustive-deps
  const openKeys = useMemo(() => new Set(open.map((s) => s.key)), [open])
  const closedKeys = useMemo(() => new Set(shopsIn(town).filter((s) => !openKeys.has(s.key)).map((s) => s.key)), []) // eslint-disable-line react-hooks/exhaustive-deps
  const prices = useMemo(() => todaysPrices(lesson.type, open.flatMap((s) => s.shop.products)), []) // eslint-disable-line react-hooks/exhaustive-deps

  // 게임 상태는 ref에 두고 짧은 간격으로 다시 그린다 (걷는 손님이 여럿이라)
  const g = useRef({ walkers: [], queues: {}, spawned: 0, nextSpawn: Date.now() + 600, stats: { sales: D(0), tips: D(0), served: 0, lost: 0, vip: 0, first: 0, best: 0, met: {} } })
  const [, setFrame] = useState(0)
  const [sel, setSel] = useState(open[0]?.key || null)
  const [paused, setPaused] = useState(false)
  const [input, setInput] = useState('')
  const [tries, setTries] = useState(0)
  const [helper, setHelper] = useState(false)
  const [state, setState] = useState('ask') // ask | paid | explain | done
  const [streak, setStreak] = useState(0)
  const [toast, setToast] = useState(null)
  const [pop, setPop] = useState(null)
  const pausedAt = useRef(0)
  const shopRefs = useRef({})
  const moneyRef = useRef(null)
  const servingSince = useRef(Date.now())

  const queues = g.current.queues
  const active = sel ? queues[sel]?.[0] : null
  const activeShop = sel ? shopById(town.built[sel]?.id) : null

  useEffect(() => {
    if (import.meta.env.DEV) window.__shopOrder = active
  }, [active])

  function walkerTo(cust, shopKey, from) {
    const [r, c] = parseKey(shopKey)
    const dest = frontRoad(r, c)
    const start = from || ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)]
    return { id: cust.id, cust, shopKey, path: roadPath(start, dest), i: 0, next: Date.now() + STEP_MS, phase: 'in' }
  }
  function walkerAway(cust, shopKey, face) {
    const [r, c] = parseKey(shopKey)
    const start = frontRoad(r, c)
    const exit = ENTRANCES[Math.floor(Math.random() * ENTRANCES.length)]
    g.current.walkers.push({ id: `${cust.id}-out`, cust, shopKey, path: roadPath(start, exit), i: 0, next: Date.now() + STEP_MS, phase: 'out', face })
  }

  // 한 박자 — 손님 오기 · 걷기 · 줄 서기 · 기다리다 떠나기
  useEffect(() => {
    if (paused || state === 'done') return
    const t = setInterval(() => {
      const now = Date.now()
      const s = g.current
      // 새 손님
      if (s.spawned < rules.perDay && now >= s.nextSpawn && open.length) {
        const weights = open.map((x) => x.lv)
        let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
        const target = open.find((x, i) => (roll -= weights[i]) < 0) || open[0]
        const cust = { ...makeCustomer(lesson, target.shop, prices, { vipChance: rules.vipChance, met: { ...town.met, ...s.stats.met } }) }
        s.walkers.push(walkerTo(cust, target.key))
        s.spawned += 1
        s.stats.met[cust.customer.emoji] = (s.stats.met[cust.customer.emoji] || 0) + 1
        s.nextSpawn = now + (s.spawned < 2 ? 2500 : rules.gap * 1000 * (0.7 + Math.random() * 0.6))
      }
      // 걷기
      for (const w of s.walkers) {
        if (now >= w.next && w.i < w.path.length - 1) {
          w.i += 1
          w.next = now + STEP_MS
        }
      }
      // 도착 → 줄 서기 (줄이 꽉 찼으면 그냥 간다)
      const arrived = s.walkers.filter((w) => w.phase === 'in' && w.i >= w.path.length - 1 && now >= w.next)
      for (const w of arrived) {
        s.walkers = s.walkers.filter((x) => x !== w)
        const q = (s.queues[w.shopKey] ||= [])
        const lv = town.built[w.shopKey]?.lv || 1
        if (q.length >= slotsOf(lv)) {
          s.stats.lost += 1
          walkerAway(w.cust, w.shopKey, '😤')
          setToast(`😤 ${shopById(town.built[w.shopKey].id).name} 줄이 꽉 차서 ${w.cust.customer.name} 손님이 갔어요`)
          sfx.wrong()
        } else {
          q.push({ ...w.cust, arrivedAt: now })
          sfx.card?.()
        }
      }
      // 떠나는 손님 지우기
      s.walkers = s.walkers.filter((w) => !(w.phase === 'out' && w.i >= w.path.length - 1 && now >= w.next))
      // 너무 오래 기다린 손님 (지금 계산 중인 손님은 빼고)
      for (const [k, q] of Object.entries(s.queues)) {
        const keep = []
        q.forEach((c, i) => {
          const serving = k === selRef.current && i === 0
          if (!serving && now - c.arrivedAt > rules.patience * 1000) {
            s.stats.lost += 1
            walkerAway(c, k, '😤')
            setToast(`😤 ${c.customer.name} 손님이 기다리다 갔어요`)
            sfx.wrong()
          } else keep.push(c)
        })
        s.queues[k] = keep
      }
      // 고른 가게에 손님이 없으면 가장 오래 기다린 가게로
      const cur = s.queues[selRef.current]
      if ((!cur || !cur.length) && !inputRef.current) {
        let best = null
        for (const [k, q] of Object.entries(s.queues)) if (q.length && (!best || q[0].arrivedAt < best[1])) best = [k, q[0].arrivedAt]
        if (best && best[0] !== selRef.current) setSel(best[0])
      }
      // 하루 끝
      const waiting = Object.values(s.queues).some((q) => q.length) || s.walkers.some((w) => w.phase === 'in')
      if (s.spawned >= rules.perDay && !waiting && stateRef.current === 'ask') {
        setState('done')
        sfx.victory()
        onFinish({ ...s.stats, upkeep: rules.upkeep })
      }
      setFrame((f) => f + 1)
    }, 150)
    return () => clearInterval(t)
  }, [paused, state]) // eslint-disable-line react-hooks/exhaustive-deps

  const selRef = useRef(sel)
  selRef.current = sel
  const inputRef = useRef(input)
  inputRef.current = input
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    servingSince.current = Date.now()
  }, [active?.id])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  function togglePause() {
    if (!paused) {
      pausedAt.current = Date.now()
      setPaused(true)
      return
    }
    const d = Date.now() - pausedAt.current
    const s = g.current
    s.nextSpawn += d
    s.walkers.forEach((w) => { w.next += d })
    Object.values(s.queues).forEach((q) => q.forEach((c) => { c.arrivedAt += d }))
    servingSince.current += d
    setPaused(false)
  }

  function pick(k) {
    if (state !== 'ask' || paused) return
    if (!openKeys.has(k)) {
      setToast('😴 오늘은 문을 닫은 가게예요 (차시에 맞는 가게만 열어요)')
      return
    }
    setSel(k)
    setInput('')
    setTries(0)
    setHelper(false)
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

  function done(face) {
    const s = g.current
    const q = s.queues[sel] || []
    const c = q.shift()
    if (c) walkerAway(c, sel, face)
    setInput('')
    setTries(0)
    setHelper(false)
    setPop(null)
    setState('ask')
  }

  function pay() {
    if (state !== 'ask' || !active || !input || paused) return
    const r = grade(active, input)
    if (r === 'invalid') return
    const s = g.current
    const mood = moodOf((Date.now() - active.arrivedAt) / 1000, rules.patience)
    if (r === 'correct') {
      const firstTry = tries === 0
      const st = firstTry ? streak + 1 : 0
      const lv = town.built[sel]?.lv || 1
      const tip = helper ? 0 : tipFor({ firstTry, mood, vip: active.vip, streak: st, lv })
      setStreak(st)
      s.stats.sales = addD(s.stats.sales, active.answer)
      s.stats.tips = addD(s.stats.tips, D(tip))
      s.stats.served += 1
      s.stats.first += firstTry ? 1 : 0
      s.stats.vip += active.vip ? 1 : 0
      s.stats.best = Math.max(s.stats.best, st)
      setPop({ amount: show(active.answer), tip })
      setState('paid')
      sfx.correct()
      flyCoins(shopRefs.current[sel], moneyRef.current, { count: Math.min(12, 3 + Math.round(Number(show(active.answer)) / 10)), onEach: (i) => sfx.coinTick?.(i) })
      if (st >= 3 && st % 3 === 0) cheer(Math.min(st, 6))
      setTimeout(() => done('😍'), 1100)
      return
    }
    sfx.wrong()
    setStreak(0)
    if (tries === 0) {
      setTries(1)
      setHelper(true)
      setInput('')
    } else {
      s.stats.sales = addD(s.stats.sales, active.answer)
      s.stats.served += 1
      setState('explain')
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (state === 'explain' && e.key === 'Enter') return done('🙂')
      if (state !== 'ask') return
      if (/^[0-9]$/.test(e.key)) key(e.key)
      else if (e.key === '.' || e.key === ',') key('.')
      else if (e.key === 'Backspace') key('⌫')
      else if (e.key === 'Enter') pay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const s = g.current
  const now = Date.now()
  const live = addD(addD(town.money, s.stats.sales), s.stats.tips)
  const waitingTotal = Object.values(queues).reduce((a, q) => a + q.length, 0)

  // 가게 머리 위 — 줄 선 손님과 기다림 고리
  const overlay = (k, cx, cy) => {
    const q = queues[k] || []
    if (!q.length) return null
    const front = q[0]
    const serving = k === sel
    const frac = serving ? 1 : Math.max(0, 1 - (now - front.arrivedAt) / (rules.patience * 1000))
    const color = frac > 0.6 ? '#22c55e' : frac > 0.25 ? '#f59e0b' : '#ef4444'
    const R = 13
    const C = 2 * Math.PI * R
    const y = cy - 78
    return (
      <g className={serving ? '' : 'town-bob'}>
        <line x1={cx} y1={y + 14} x2={cx} y2={y + 24} stroke="#fff" strokeWidth="2" />
        <circle cx={cx} cy={y} r={R + 3} fill={serving ? '#fde047' : '#fff'} stroke="rgba(0,0,0,0.15)" />
        <circle cx={cx} cy={y} r={R} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${C * frac} ${C}`} transform={`rotate(-90 ${cx} ${y})`} />
        <text x={cx} y={y + 6} textAnchor="middle" fontSize="16">{front.customer.emoji}</text>
        {front.vip && <text x={cx - 12} y={y - 10} fontSize="11">👑</text>}
        {q.length > 1 && (
          <g>
            <circle cx={cx + 15} cy={y - 10} r="7" fill="#e11d48" />
            <text x={cx + 15} y={y - 7} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">{q.length}</text>
          </g>
        )}
      </g>
    )
  }
  const walkers = (
    <g pointerEvents="none">
      {s.walkers.map((w) => {
        const [r, c] = w.path[Math.min(w.i, w.path.length - 1)]
        const [x, y] = center(r, c)
        const flip = w.i > 0 && w.path[w.i - 1] && (w.path[w.i][1] - w.path[w.i - 1][1] < 0 || w.path[w.i][0] - w.path[w.i - 1][0] > 0)
        return (
          <g key={w.id} style={{ transform: `translate(${x}px, ${y}px)`, transition: `transform ${STEP_MS}ms linear` }}>
            <ellipse cx="0" cy="2" rx="7" ry="3" fill="rgba(0,0,0,0.18)" />
            <text x="0" y="-2" textAnchor="middle" fontSize="18" className="town-walk" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>{w.cust.customer.emoji}</text>
            {w.face && <text x="9" y="-14" fontSize="10">{w.face}</text>}
            {w.cust.vip && w.phase === 'in' && <text x="-4" y="-18" fontSize="9">👑</text>}
          </g>
        )
      })}
    </g>
  )

  const face = state === 'paid' ? '😍' : state === 'explain' || tries > 0 ? '🤔' : active ? MOOD_FACE[moodOf((now - active.arrivedAt) / 1000, rules.patience)] : ''
  const bubble = !active ? '' : state === 'paid' ? (active.vip ? '역시 최고의 가게! 👑' : '고마워요! 또 올게요~') : state === 'explain' ? '제가 계산해 볼게요!' : tries > 0 ? '어? 계산이 이상한데… 다시 해 주실래요?' : active.say

  return (
    <div className="min-h-[100dvh] town-bg safe-padded px-2 pt-2 pb-4">
      <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[1fr_22rem] lg:gap-3">
        <div>
          {/* 위 띠 */}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onQuit} className="h-9 w-9 shrink-0 rounded-full bg-sky-900/15 font-black text-sky-900" aria-label="그만하기">✕</button>
            <button type="button" onClick={togglePause} className="h-9 w-9 shrink-0 rounded-full bg-sky-900/15 font-black text-sky-900" aria-label={paused ? '계속하기' : '잠깐 멈춤'}>{paused ? '▶' : '⏸'}</button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-black text-sky-950">{lesson.lesson} · 손님 {s.stats.served + s.stats.lost}/{rules.perDay} · 기다리는 손님 {waitingTotal}{relaxed ? ' · 🐢' : ''}</div>
              <div className="mt-0.5 flex gap-0.5">
                {Array.from({ length: rules.perDay }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < s.stats.served ? 'bg-emerald-500' : i < s.stats.served + s.stats.lost ? 'bg-rose-400' : i < s.spawned ? 'bg-amber-400' : 'bg-sky-900/15'}`} />
                ))}
              </div>
            </div>
            <SoundMini />
            <Money value={live} refEl={moneyRef} />
          </div>
          {/* 지도 */}
          <div className="relative mt-1">
            <TownMap town={town} onTile={(r, c) => town.built[tkey(r, c)]?.kind === 'shop' && pick(tkey(r, c))} selectedKey={sel} closedKeys={closedKeys} shopRefs={shopRefs} overlay={overlay} extra={walkers} />
            <AnimatePresence>
              {toast && (
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-1 mx-auto w-fit max-w-[95%] rounded-full bg-rose-600 px-3 py-1 text-center text-xs font-black text-white shadow">
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
            {paused && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/35">
                <button type="button" onClick={togglePause} className="rounded-2xl bg-white px-6 py-3 text-xl font-black text-slate-800 shadow-xl">⏸ 잠깐 멈춤 · ▶ 계속</button>
              </div>
            )}
          </div>
        </div>

        {/* 계산대 */}
        <div className="mt-1 rounded-[1.4rem] bg-white p-3 shadow-xl lg:mt-11 lg:self-start">
          {active ? (
            <>
              <div className="flex items-start gap-2">
                <div className="relative shrink-0 text-5xl leading-none">
                  {active.customer.emoji}
                  <span className="absolute -right-2 -top-1 text-xl">{face}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-slate-400">{activeShop?.icon} {activeShop?.name} · {active.customer.name} 손님{active.vip ? ' · 👑 VIP' : ''}</div>
                  <div className="mt-0.5 rounded-2xl rounded-tl-sm bg-amber-50 px-3 py-1.5 text-sm font-black text-slate-800">{bubble}</div>
                </div>
                {streak >= 2 && <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-black text-white combo-flame">🔥 {streak}</span>}
              </div>
              <div className="mt-1 text-center text-xs font-black text-rose-600">🏷️ {active.item} {active.tag}</div>
              <div className="text-center font-black text-slate-800 tabular-nums shop-expr">{active.price} × {show(active.b)} =</div>
              <div className="mx-auto flex max-w-[18rem] items-center gap-2">
                <div className={`flex h-12 flex-1 items-center justify-end rounded-2xl border-4 px-3 text-3xl font-black tabular-nums ${state === 'paid' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : input ? 'border-amber-400 bg-amber-50 text-slate-900' : 'border-dashed border-slate-300 text-slate-300'}`}>
                  {state === 'paid' ? show(active.answer) : input || '0'}
                </div>
                <span className="text-2xl font-black text-amber-700">G</span>
              </div>
              {pop && <div className="shop-pop mt-0.5 text-center text-lg font-black text-emerald-600">+{pop.amount}G{pop.tip ? ` · 팁 +${pop.tip}G` : ''}</div>}
              {helper && state === 'ask' && <div className="mt-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-center text-sm font-bold text-sky-900">💡 {active.helper}</div>}
            </>
          ) : (
            <div className="py-5 text-center text-sm font-black text-slate-400">
              {s.spawned >= rules.perDay && !waitingTotal ? '오늘 장사 마무리 중…' : '손님이 걸어오고 있어요 🚶 — 머리 위에 손님이 뜬 가게를 눌러요'}
            </div>
          )}
          <div className="mt-2">
            <Keypad onKey={key} disabled={state !== 'ask' || !active || paused} />
          </div>
          <div className="mt-2 flex gap-2">
            {!helper && (
              <button type="button" disabled={state !== 'ask' || !active} onClick={() => setHelper(true)} className="shrink-0 rounded-2xl bg-sky-100 px-3 text-sm font-black text-sky-800 disabled:opacity-50" title="팁을 못 받아요">
                💡 도우미
              </button>
            )}
            <GameButton color={input && state === 'ask' ? 'green' : 'gray'} disabled={!input || state !== 'ask' || paused} onClick={pay} className="flex-1 py-3 text-xl">
              💳 계산하기
            </GameButton>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state === 'explain' && active && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl">
              <div className="text-center text-lg font-black text-slate-700">{active.customer.emoji} {active.customer.name} 손님이 바로잡아 줬어요</div>
              <div className="mt-2 text-center text-2xl font-black text-slate-800 tabular-nums">
                {active.price} × {show(active.b)} = <span className="text-emerald-600">{show(active.answer)}G</span>
              </div>
              <ol className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-[0.95rem] font-bold leading-relaxed text-amber-950">
                {active.steps.map((x, i) => <li key={i}>✏️ {x}</li>)}
              </ol>
              <p className="mt-2 text-center text-xs font-bold text-slate-500">값은 받았지만 팁은 없어요. 다음 손님은 꼭!</p>
              <GameButton color="violet" onClick={() => done('🙂')} className="mt-3 w-full py-3 text-xl">알겠어요! 다음 손님 →</GameButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 정산서 ───
function Settlement({ result, town, onTown, onAgain }) {
  const r = result.sheet
  const good = r.profit.v >= 0
  const rows = [
    ['💵 매출', `+${money(r.sales)}G`, 'text-slate-800'],
    ['💝 팁', `+${money(r.tips)}G`, 'text-slate-800'],
    [`📦 재료비 (매출 × ${show(COST_RATE)})`, `−${money(r.material)}G`, 'text-rose-600'],
    ['🔧 가게 유지비', `−${money(r.upkeep)}G`, 'text-rose-600'],
  ]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ y: 40, rotate: -2, scale: 0.9 }} animate={{ y: 0, rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }} className="w-full max-w-sm">
        <div className="shop-receipt rounded-t-2xl bg-white px-5 pb-6 pt-5 text-slate-800 shadow-2xl">
          <div className="text-center text-xs font-black tracking-[0.3em] text-slate-400">RECEIPT</div>
          <div className="text-center text-xl font-black">🧾 {town.days}일째 정산서</div>
          <div className="mt-1 text-center text-xs font-bold text-slate-500">손님 {result.served}명 · 놓친 손님 {result.lost}명 · 한 번에 맞힘 {result.first} · VIP {result.vip}</div>
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
          <div className="mt-1 text-right text-sm font-black text-slate-500">가진 돈 💰 {money(town.money)}G</div>
          {result.newQuests.length > 0 && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-800">🎯 목표 달성! {result.newQuests.map((q) => q.text).join(', ')} — 마을의 🎯 목표에서 상금을 받아요</div>
          )}
        </div>
        <div className="mt-3 grid gap-2">
          <GameButton color="violet" onClick={onTown} className="w-full py-3 text-lg">🏘️ 마을로 — 가게 짓고 키우기</GameButton>
          <GameButton color="green" onClick={onAgain} className="w-full py-3 text-lg">🌅 다음 날 장사 (같은 차시)</GameButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Quests({ town, onClaim, onClose }) {
  return (
    <Sheet title="🎯 사장님 목표" onClose={onClose}>
      <ol className="space-y-1.5">
        {QUESTS.map((q) => {
          const done = q.done(town)
          const claimed = town.claimed.includes(q.id)
          return (
            <li key={q.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${claimed ? 'bg-slate-50 opacity-60 ring-slate-200' : done ? 'bg-amber-50 ring-amber-300' : 'bg-white ring-slate-200'}`}>
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
    </Sheet>
  )
}

function CustomerBook({ town, onClose }) {
  return (
    <Sheet title="📖 손님 도감" onClose={onClose}>
      <p className="text-xs font-bold text-slate-500">반짝이는 손님은 아주 가끔 와요. 모두 만나 볼까요?</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {CUSTOMERS.map(([e, n, r]) => {
          const seen = town.met[e]
          return (
            <div key={e} className={`rounded-2xl p-2 text-center ${seen ? (r ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-sky-50') : 'bg-slate-100'}`}>
              <div className={`text-4xl ${seen ? '' : 'opacity-30 grayscale'}`}>{seen ? e : '❔'}</div>
              <div className="truncate text-[11px] font-black text-slate-700">{seen ? n : '???'}</div>
              {seen ? <div className="text-[10px] font-bold text-slate-400">{seen}번 옴</div> : null}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}

export default function DecimalShop({ onBack }) {
  useHideSoundToggle()
  const me = useAccount((s) => s.me)
  const who = me?.username ? `acct:${me.username}` : 'device'
  const owner = me ? me.name || me.username : '나'
  const [town, setTown] = useState(() => loadTown(who))
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

  useEffect(() => setTown(loadTown(who)), [who])

  function update(fn) {
    setTown((cur) => {
      const n = { ...cur, ...fn(cur) }
      saveTown(who, n)
      return n
    })
  }

  function finishDay(r) {
    const sheet = settle({ sales: r.sales, tips: r.tips, upkeep: r.upkeep })
    const before = QUESTS.filter((q) => q.done(town)).map((q) => q.id)
    const next = {
      ...town,
      money: addD(town.money, sheet.profit),
      days: town.days + 1,
      served: town.served + r.served,
      lost: town.lost + r.lost,
      bestStreak: Math.max(town.bestStreak, r.best),
      bestProfit: gte(sheet.profit, town.bestProfit) ? sheet.profit : town.bestProfit,
      totalSales: addD(town.totalSales, r.sales),
      met: Object.entries(r.met).reduce((m, [e, c]) => ({ ...m, [e]: (m[e] || 0) + c }), town.met),
    }
    saveTown(who, next)
    setTown(next)
    if (sheet.profit.v > 0) setTimeout(() => cheer(3), 900)
    setResult({ ...r, sheet, newQuests: QUESTS.filter((q) => q.done(next) && !before.includes(q.id)) })
  }

  function claim(q) {
    sfx.victory()
    cheer(3)
    update((s) => ({ money: addD(s.money, D(q.reward)), claimed: [...s.claimed, q.id] }))
  }

  const modals = (
    <AnimatePresence>
      {modal === 'quests' && <Quests town={town} onClaim={claim} onClose={() => setModal(null)} />}
      {modal === 'book' && <CustomerBook town={town} onClose={() => setModal(null)} />}
    </AnimatePresence>
  )

  if (!lesson)
    return (
      <>
        <Town town={town} owner={owner} relaxed={relaxed} setRelaxed={setRelaxed} onBack={onBack} onUpdate={update} onModal={setModal}
          onStart={(l) => { setLesson(l); setResult(null); setDayKey((k) => k + 1) }} />
        {modals}
      </>
    )

  return (
    <>
      <Day key={dayKey} lesson={lesson} town={town} owner={owner} relaxed={relaxed} onFinish={finishDay}
        onQuit={() => { if (result || window.confirm('오늘 장사를 그만할까요? 오늘 번 돈은 저장되지 않아요.')) { setLesson(null); setResult(null) } }} />
      <AnimatePresence>
        {result && (
          <Settlement
            result={result}
            town={town}
            onTown={() => { setResult(null); setLesson(null) }}
            onAgain={() => { setResult(null); setDayKey((k) => k + 1) }}
          />
        )}
      </AnimatePresence>
      {modals}
    </>
  )
}
