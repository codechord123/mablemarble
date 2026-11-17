// 소수 마을 타이쿤 — 마을 지도에 가게를 짓고, 길 따라 찾아오는 손님의 주문(가격 × 양)을 계산해 판다.
// 하루가 끝나면 정산서(매출 + 팁 − 재료비 − 유지비 = 이익), 번 돈으로 가게·장식·땅에 투자한다.
// 가게를 눌러 그 가게 손님을 맞는다. 계산 중인 손님은 기다려 주고, 다른 가게 앞 손님만 오래 기다리면 간다.
// '느긋 모드'면 손님이 두 배 오래 기다리고 천천히 온다.

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { grade, show, D } from '../../utils/decimalGame.js'
import {
  SHOPS, DECOR, DECOR_THEMES, ITEMS, MAX_ITEM, MAPS, mapById, mapOf, entrancesOf, ZONES, ADS, LESSONS, CUSTOMERS, QUESTS, MAX_LV, UPGRADE_COST, COST_RATE,
  shopById, productById, decorById, tileAt, unlocked, roadSide, frontRoad, roadPath, key as tkey, parseKey,
  shopsIn, openShops, makeFreshCustomer, orderKey, dayRules, slotsOf, moodOf, MOOD_FACE, tipFor, settle,
  PENALTY, RUSH_AT, RUSH_MS, starsFor, clock,
  SELL_RATE, spentOn, sellPrice, canSell, neighborsOf, near, FAN_AT, fansOf, regularsOf, queueForecast, overflowRisk,
  forecastOf, demandOf, demandLevel, DEMAND_LABEL, repOf, repLabel, repChange, THOUGHTS, thoughtFor,
  popularityOf, upkeepOf, titleOf, addD, subD, gte, money, loadTown, saveTown,
} from '../../utils/decimalShop.js'
import { useAccount, accountApi } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { cheer, flyCoins } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini, useHideSoundToggle } from '../ui/MuteToggle.jsx'
import TownMap, { center, MapZoom } from './TownMap.jsx'
import PairDrill from './PairDrill.jsx'
import { PAIR_GOAL } from '../../utils/pairCalc.js'
import { safeTown } from '../../utils/townGuard.js'

const RELAX_KEY = 'boomarble_tycoon_relaxed'
const STEP_MS = 330 // 손님이 한 칸 걷는 시간 (지도가 커져서 조금 빠르게)

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

// 땅을 눌렀을 때 열 창 (마을·장사 중 둘 다)
function tileSheet(town, r, c, m = 'main') {
  const t = tileAt(r, c, m)
  if (!t || t === 'R' || t === '~' || t === 'I') return null
  if (m !== 'main' && !(town.maps || []).includes(m)) return { type: 'map', map: m }
  const b = town.built[tkey(r, c, m)]
  if (b) return { type: b.kind, r, c, m }
  if (!unlocked(town, r, c, m)) return { type: 'zone', zone: t }
  return { type: 'lot', r, c, m }
}

// 짓기·키우기·땅 사기·광고 창 — 마을 화면과 장사 중 '짓기'에서 같이 쓴다
function BuildSheets({ town, sheet, setSheet, onUpdate, inDay }) {
  const can = (c) => gte(town.money, D(c))
  const builtIds = new Set(Object.values(town.built).map((b) => b.id))
  const sm = sheet?.m || 'main'
  const sk = sheet && sheet.r != null ? tkey(sheet.r, sheet.c, sm) : null
  const [decorTab, setDecorTab] = useState(null)
  const theme = decorTab || (sm === 'main' ? 'nature' : sm)
  useEffect(() => setDecorTab(null), [sk])
  const here = sk ? town.built[sk] : null
  // 팔기는 두 번 눌러야 (한 번 누르면 '정말 팔까요?'로 바뀐다 — 태블릿에서 확인 창이 안 뜨는 경우가 있어서)
  const [sellAsk, setSellAsk] = useState(null)
  useEffect(() => setSellAsk(null), [sk])
  function sell(k) {
    const b = town.built[k]
    const price = sellPrice(b)
    if (sellAsk !== k) {
      setSellAsk(k)
      return
    }
    setSellAsk(null)
    sfx.coin()
    onUpdate((t) => {
      const nb = { ...t.built }
      delete nb[k]
      return { built: nb, money: addD(t.money, price) }
    })
    setSheet(null)
  }
  // 이 자리에 장식을 놓으면 덕을 볼 근처 가게들
  const nearShops = sk ? shopsIn(town).filter((x) => x.key !== sk && near(x.key, sk)) : []
  function pay(cost, patch, big) {
    if (!can(cost)) return
    sfx.coin()
    if (big) setTimeout(() => cheer(4), 120)
    onUpdate((st) => ({ ...patch(st), money: subD(st.money, D(cost)) }))
    setSheet(null)
  }
  return (
    <AnimatePresence>
        {sheet?.type === 'lot' && (
          <Sheet title="🏗️ 여기에 무엇을 지을까요?" onClose={() => setSheet(null)} wide>
            {roadSide(sheet.r, sheet.c, sm) ? (
              <>
                <div className="mb-1 text-xs font-black text-slate-500">가게 (길 옆이라 지을 수 있어요{sm !== 'main' ? ` · ${mapById(sm).icon} 이 지도에만 있는 가게가 위에` : ''})</div>
                {SHOPS.filter((s) => !s.map || s.map === sm).sort((a, b) => (b.map ? 1 : 0) - (a.map ? 1 : 0)).map((s) => {
                  const locked = s.tier > 1 && !shopsIn(town).some((x) => x.shop.tier >= s.tier - 1)
                  return (
                    <Buy
                      key={s.id}
                      icon={s.icon}
                      title={`${s.map ? '✨ ' : ''}${s.name} (${s.tier}등급)`}
                      desc={`${s.products.map((id) => productById(id).icon + productById(id).name).join(' · ')} — ${s.kind === 'count' ? '개수로 팔아요' : '달아서 팔아요'}${locked ? ` · ${s.tier - 1}등급 가게부터` : ''}`}
                      cost={s.cost}
                      can={can(s.cost)}
                      done={builtIds.has(s.id)}
                      locked={locked}
                      onClick={() => pay(s.cost, (t) => ({ built: { ...t.built, [sk]: { kind: 'shop', id: s.id, lv: 1 } } }), s.tier >= 3)}
                    />
                  )
                })}
              </>
            ) : (
              <p className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">길에서 떨어진 땅이라 가게는 못 지어요. 장식을 놓아 마을 인기를 올려 보세요!</p>
            )}
            <div className="mb-1 mt-2 text-xs font-black text-slate-500">장식 (마을 인기 ★ ↑ → 손님이 더 많이·오래)</div>
            {nearShops.length > 0 && (
              <div className="mb-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800">
                🌳 이웃 효과: 여기 장식을 놓으면 2칸 안의 {nearShops.map((x) => x.shop.icon).join('')} 가게에 손님이 더 와요 (노란 칸이 닿는 범위)
              </div>
            )}
            <div className="mb-1.5 flex gap-1 overflow-x-auto pb-0.5">
              {DECOR_THEMES.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setDecorTab(id)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${theme === id ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {DECOR.filter((d) => d.theme === theme).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  disabled={!can(d.cost)}
                  onClick={() => pay(d.cost, (t) => ({ built: { ...t.built, [sk]: { kind: 'decor', id: d.id } } }), d.cost >= 300)}
                  className="rounded-2xl bg-slate-50 p-1.5 text-center ring-1 ring-slate-200 enabled:hover:bg-amber-50 disabled:opacity-50"
                >
                  <div className="text-3xl">{d.icon}</div>
                  <div className="text-[11px] font-black text-slate-700">{d.name}</div>
                  <div className="text-[11px] font-black text-amber-600">{d.cost}G · +{d.pop}★</div>
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
              {(() => {
                const nb = neighborsOf(town, sk)
                return (
                  <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
                    <div className="font-black">🌳 이웃 효과 +{Math.round(nb.bonus * 100)}% <span className="font-bold text-amber-700">(노란 칸 = 2칸 안)</span></div>
                    <div>장식 {nb.decor.length}개{nb.decor.length ? ` ${nb.decor.map((id) => decorById(id).icon).join('')}` : ''} · 이웃 가게 {nb.shops.length}곳 → 손님이 더 오고 더 오래 기다려요</div>
                    {nb.bonus < 1 && <div className="text-amber-700">가까이에 장식을 놓으면 더 올라가요 (최대 +100%)</div>}
                  </div>
                )
              })()}
              {lv < MAX_LV ? (
                <GameButton color={can(cost) ? 'green' : 'gray'} disabled={!can(cost)} className="mt-3 w-full py-3"
                  onClick={() => pay(cost, (t) => ({ built: { ...t.built, [sk]: { ...here, lv: lv + 1 } } }), true)}>
                  ⬆️ Lv.{lv + 1}로 키우기 · {cost}G
                  <div className="text-xs font-semibold opacity-90">줄 {slotsOf(lv + 1)}칸 · 팁 +{lv}G · 건물이 커지고 마을 인기 ↑</div>
                </GameButton>
              ) : (
                <div className="mt-3 rounded-xl bg-amber-50 py-3 text-center font-black text-amber-700">🏆 최고 레벨이에요!</div>
              )}
              {(() => {
                const ok = canSell(town, sk)
                if (inDay) return <p className="mt-2 text-center text-xs font-bold text-slate-400">가게 팔기는 장사가 끝난 뒤 마을에서 할 수 있어요</p>
                const asking = sellAsk === sk
                return (
                  <>
                    <button type="button" disabled={!ok.ok} onClick={() => sell(sk)}
                      className={`mt-2 w-full rounded-2xl py-2.5 text-sm font-black disabled:opacity-50 ${asking ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 enabled:hover:bg-rose-50 enabled:hover:text-rose-700'}`}>
                      {asking ? `정말 팔까요? 한 번 더 누르면 +${money(sellPrice(here))}G` : <>💰 가게 팔기 · +{money(sellPrice(here))}G <span className="font-bold">(들인 돈 {spentOn(here)}G × {show(SELL_RATE)})</span></>}
                      {!ok.ok && <span className="block text-[11px] font-bold text-rose-600">{ok.why}</span>}
                    </button>
                    {asking && ok.warn && <p className="mt-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">⚠️ {ok.warn}</p>}
                    {asking && <button type="button" onClick={() => setSellAsk(null)} className="mx-auto mt-1 block text-xs font-bold text-slate-500 underline">안 팔래요</button>}
                  </>
                )
              })()}
            </Sheet>
          )
        })()}

        {sheet?.type === 'decor' && here && (
          <Sheet title={`${decorById(here.id).icon} ${decorById(here.id).name}`} onClose={() => setSheet(null)}>
            <p className="text-sm font-bold text-slate-600">마을 인기 +{decorById(here.id).pop}★ 를 주는 장식이에요.</p>
            {nearShops.length > 0 && <p className="mt-1 text-xs font-bold text-amber-800">🌳 2칸 안의 {nearShops.map((x) => x.shop.icon).join('')} 가게에 이웃 효과를 주고 있어요</p>}
            <GameButton color={sellAsk === sk ? 'red' : 'gray'} className="mt-3 w-full py-2.5" onClick={() => sell(sk)}>
              {sellAsk === sk ? `정말 팔까요? 한 번 더 누르면 +${money(sellPrice(here))}G` : `💰 팔기 · +${money(sellPrice(here))}G (값 ${spentOn(here)}G × ${show(SELL_RATE)})`}
            </GameButton>
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

        {sheet?.type === 'map' && (() => {
          const M = mapById(sheet.map)
          return (
            <Sheet title={`${M.icon} ${M.name} 열기`} onClose={() => setSheet(null)}>
              <p className="text-sm font-bold text-slate-600">{M.desc}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">이 지도에만 있는 가게: {SHOPS.filter((s) => s.map === M.id).map((s) => `${s.icon} ${s.name}`).join(', ')}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">장사할 때는 모든 지도의 가게에 손님이 와요. 지도 탭으로 오가며 맞아 주세요.</p>
              <GameButton color={can(M.cost) ? 'green' : 'gray'} disabled={!can(M.cost)} className="mt-3 w-full py-3"
                onClick={() => pay(M.cost, (t) => ({ maps: [...(t.maps || []), M.id] }), true)}>
                🗺️ {M.cost}G에 열기
              </GameButton>
            </Sheet>
          )
        })()}

        {sheet?.type === 'store' && (
          <Sheet title="🛍️ 상점" onClose={() => setSheet(null)} wide>
            <div className="mb-1 text-xs font-black text-slate-500">장사 아이템 (장사 중에 눌러 써요 · 종류마다 {MAX_ITEM}개까지)</div>
            {ITEMS.map((it) => {
              const have = (town.items || {})[it.id] || 0
              return (
                <Buy key={it.id} icon={it.icon} title={`${it.name} · 가진 것 ${have}개`} desc={it.desc} cost={it.cost} can={can(it.cost)} locked={have >= MAX_ITEM}
                  onClick={() => {
                    if (!can(it.cost)) return
                    sfx.coin()
                    onUpdate((t) => ({ items: { ...(t.items || {}), [it.id]: Math.min(MAX_ITEM, ((t.items || {})[it.id] || 0) + 1) }, money: subD(t.money, D(it.cost)) }))
                  }} />
              )
            })}
            <div className="mb-1 mt-3 text-xs font-black text-slate-500">새 지도</div>
            {MAPS.slice(1).map((M) => (
              <Buy key={M.id} icon={M.icon} title={M.name} desc={M.desc} cost={M.cost} can={can(M.cost)} done={(town.maps || []).includes(M.id)}
                onClick={() => pay(M.cost, (t) => ({ maps: [...(t.maps || []), M.id] }), true)} />
            ))}
            <div className="mb-1 mt-3 text-xs font-black text-slate-500">광고 (한 번 사면 계속)</div>
            {ADS.slice(1).map((ad, i) => (
              <Buy key={ad.name} icon={ad.icon} title={ad.name} desc={ad.desc} cost={ad.cost} can={can(ad.cost)} done={town.ads >= i + 1} locked={town.ads < i}
                onClick={() => pay(ad.cost, () => ({ ads: i + 1 }))} />
            ))}
          </Sheet>
        )}
    </AnimatePresence>
  )
}

// 지도 탭 — 시내 + 새 지도들 (안 연 지도는 자물쇠, 장사 중엔 기다리는 손님 수)
function MapTabs({ town, mapView, setMapView, waiting, hideLocked }) {
  const maps = MAPS.filter((M) => !hideLocked || M.id === 'main' || (town.maps || []).includes(M.id))
  if (maps.length < 2) return null
  return (
    <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5">
      {maps.map((M) => {
        const open = M.id === 'main' || (town.maps || []).includes(M.id)
        const w = waiting?.[M.id] || 0
        return (
          <button key={M.id} type="button" onClick={() => setMapView(M.id)}
            className={`relative shrink-0 rounded-full px-3 py-1.5 text-xs font-black shadow-sm ${mapView === M.id ? 'bg-sky-700 text-white' : open ? 'bg-white/90 text-sky-900' : 'bg-white/50 text-slate-500'}`}>
            {open ? M.icon : '🔒'} {M.name}
            {w > 0 && mapView !== M.id && <span className="absolute -right-1 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] text-white shop-bop">{w}</span>}
          </button>
        )
      })}
    </div>
  )
}

// 오늘의 소식 — 날씨·수요(심시티 수요 막대처럼)와 평판(입소문)
function TownNews({ town }) {
  const [open, setOpen] = useState(false)
  const fc = forecastOf(town.days)
  const tomorrow = forecastOf(town.days + 1)
  const rep = repOf(town)
  const R = repLabel(rep)
  const ids = [...new Set(shopsIn(town).map((x) => x.shop.id))]
  const rows = ids.map((id) => ({ shop: shopById(id), d: demandOf(id, fc) })).sort((a, b) => b.d - a.d)
  const trend = shopById(fc.trend)
  const lvColor = { 2: 'text-rose-600', 1: 'text-orange-600', 0: 'text-slate-400', '-1': 'text-sky-600' }
  return (
    <div className="mt-2 rounded-2xl bg-white/90 p-2.5 shadow ring-1 ring-sky-900/10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 text-left">
        <span className="text-2xl">{fc.weather.icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-800">오늘 날씨: {fc.weather.name} <span className="font-bold text-slate-500">— {fc.weather.say}</span></span>
          <span className="block truncate text-xs font-bold text-slate-500">
            요즘 유행 {trend.icon} {trend.name} · 내일 {tomorrow.weather.icon} {tomorrow.weather.name}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">{R.icon} 평판 {rep}</span>
        <span className="shrink-0 text-xs font-black text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
          <div className="text-xs font-black text-slate-500">📈 오늘 우리 가게 수요 <span className="font-bold">(▲ 가게로 손님이 몰리고, 처음에 맞히면 팁 +1G)</span></div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {rows.map(({ shop, d }) => {
              const lv = demandLevel(d)
              return (
                <div key={shop.id} className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-black">
                  <span>{shop.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-slate-700">{shop.name}</span>
                  <span className={lvColor[lv]}>{DEMAND_LABEL[lv]}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-xs font-black text-slate-500">📣 평판 (입소문)</div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" style={{ width: `${rep}%` }} />
          </div>
          <div className="mt-1 text-xs font-bold text-slate-600">{R.icon} {R.name} — {R.desc}</div>
          <div className="text-[11px] font-bold text-slate-400">하루 장사를 마칠 때, 손님 중 처음에 정확히 맞힌 비율이 60%보다 높으면 오르고 낮으면 내려가요.</div>
        </div>
      )}
    </div>
  )
}

// ─── 마을 (장사 전·후) ───
function Town({ syncing, town, owner, relaxed, setRelaxed, onBack, onStart, onResume, onSettleNow, onUpdate, onModal, locked, pairDone, onPair, teacher, studentView, onStudentView }) {
  const [sheet, setSheet] = useState(null) // { type: 'lot'|'shop'|'decor'|'zone'|'lessons'|'ads', r, c }
  const pop = popularityOf(town)
  const can = (c) => gte(town.money, D(c))
  const ready = QUESTS.filter((q) => q.done(town) && !town.claimed.includes(q.id)).length
  const builtIds = new Set(Object.values(town.built).map((b) => b.id))

  const [mapView, setMapView] = useState('main')
  const mapOpen = mapView === 'main' || (town.maps || []).includes(mapView)
  function onTile(r, c) {
    const sh = tileSheet(town, r, c, mapView)
    if (sh) setSheet(sh)
  }
  const sk = sheet && sheet.r != null ? tkey(sheet.r, sheet.c, sheet.m || 'main') : null
  const itemList = ITEMS.filter((it) => (town.items || {})[it.id])

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

        {syncing && (
          <div className="mt-2 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-800 ring-1 ring-sky-200">☁️ 계정에 저장된 마을을 불러오는 중이에요…</div>
        )}

        {teacher && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-800 ring-1 ring-violet-200">
            <span>👩‍🏫 {studentView ? '학생 화면 미리보기 중이에요 (짝꿍 계산 잠금이 보여요)' : '선생님 계정은 잠금 없이 바로 열려요. 학생 화면에는 짝꿍 계산 50문제 경고가 떠요.'}</span>
            <button type="button" onClick={onStudentView} className="ml-auto rounded-full bg-violet-600 px-3 py-1 font-black text-white">
              {studentView ? '선생님 화면으로' : '👀 학생 화면 미리보기'}
            </button>
          </div>
        )}

        {locked && (
          <div className="mt-2 rounded-2xl border-2 border-rose-300 bg-rose-50 p-3 shadow">
            <div className="flex items-start gap-2">
              <span className="text-2xl">⚠️</span>
              <div className="min-w-0 flex-1">
                <div className="font-black text-rose-700">짝꿍 계산 {PAIR_GOAL}문제부터 풀어야 장사를 할 수 있어요!</div>
                <div className="text-xs font-bold text-rose-600/90">곱하면 10·100·1이 되는 짝꿍 수로 빠르게 곱하기 — 처음에 맞힌 문제만 세요 · 지금 {pairDone}/{PAIR_GOAL}</div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-rose-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500" style={{ width: `${(pairDone / PAIR_GOAL) * 100}%` }} />
                </div>
              </div>
            </div>
            <GameButton color="green" onClick={onPair} className="mt-2 w-full py-3 text-lg">🤝 짝꿍 계산 하러 가기 ({pairDone}/{PAIR_GOAL})</GameButton>
          </div>
        )}

        {!locked && <TownNews town={town} />}

        {town.dayInProgress && !locked && (() => {
          const d = town.dayInProgress
          const l = LESSONS.find((x) => x.type === d.type)
          return (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-3 shadow ring-2 ring-amber-300">
              <span className="text-2xl">🏪</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black text-slate-800">하던 장사가 저장돼 있어요 <span className="text-xs font-bold text-slate-500">(다른 차시는 아래 🌅 장사 시작에서)</span></div>
                <div className="text-xs font-bold text-slate-500">{l?.lesson} · 손님 {d.stats.served}/30 · ⏱ {clock(d.elapsedMs / 1000 + d.penalty)} · 번 돈 {money(d.stats.sales)}G</div>
              </div>
              <GameButton color="green" onClick={() => onResume(l, d)} className="px-4 py-2 text-sm">▶ {l?.lesson} 이어서 장사</GameButton>
              <button type="button" onClick={onSettleNow} className="text-xs font-bold text-slate-500 underline">여기서 정산하고 끝내기</button>
            </div>
          )
        })()}

        <MapTabs town={town} mapView={mapView} setMapView={setMapView} />
        <div className="relative mt-1">
          <MapZoom>
            <TownMap town={town} mapId={mapView} onTile={onTile} selectedKey={sk}
              range={sheet && sheet.r != null && (sheet.m || 'main') === mapView ? { r: sheet.r, c: sheet.c } : null} />
          </MapZoom>
          {!mapOpen && (() => {
            const M = mapById(mapView)
            return (
              <div className="absolute inset-0 grid place-items-center">
                <div className="max-w-xs rounded-2xl bg-white/95 p-4 text-center shadow-xl ring-2 ring-amber-300">
                  <div className="text-4xl">{M.icon}</div>
                  <div className="mt-1 font-black text-slate-800">{M.name}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{M.desc}</div>
                  <GameButton color={can(M.cost) ? 'green' : 'gray'} onClick={() => setSheet({ type: 'map', map: M.id })} className="mt-2 w-full py-2.5">
                    🔒 {M.cost}G에 열기
                  </GameButton>
                  {!can(M.cost) && <div className="mt-1 text-[11px] font-bold text-slate-400">장사로 {M.cost}G를 모아 보세요!</div>}
                </div>
              </div>
            )
          })()}
        </div>
        {itemList.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs font-black text-sky-900">
            <span className="text-sky-900/60">가진 아이템</span>
            {itemList.map((it) => <span key={it.id} className="rounded-full bg-white/80 px-2 py-0.5">{it.icon}×{town.items[it.id]}</span>)}
          </div>
        )}

        <div className="mt-1 grid grid-cols-4 gap-2">
          <GameButton color={locked ? 'gray' : 'green'} onClick={() => (locked ? onPair() : setSheet({ type: 'lessons' }))} className="col-span-4 py-3.5 text-xl sm:col-span-1 sm:text-base">
            {locked ? `🔒 장사 (짝꿍 ${pairDone}/${PAIR_GOAL})` : '🌅 장사 시작'}
          </GameButton>
          <GameButton color="orange" onClick={() => onModal('quests')} className="relative py-2.5 text-sm">
            🎯 목표
            {ready > 0 && <span className="absolute -right-1 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-xs shop-bop">{ready}</span>}
          </GameButton>
          <GameButton color="blue" onClick={() => onModal('book')} className="py-2.5 text-sm">📖 도감 {Object.keys(town.met).length}</GameButton>
          <GameButton color="violet" onClick={() => setSheet({ type: 'store' })} className="py-2.5 text-sm">🛍️ 상점</GameButton>
        </div>
        {!locked && (
          <button type="button" onClick={onPair} className="mx-auto mt-2 block text-xs font-black text-teal-700 underline">🤝 짝꿍 계산 더 연습하기</button>
        )}
        <p className="mt-2 text-center text-xs font-bold text-sky-900/60">
          손님 {town.served}명 받음 · 놓친 손님 {town.lost}명 · 총 매출 {money(town.totalSales)}G · 최고 이익 {money(town.bestProfit)}G
        </p>
        <p className="mt-1 text-center text-[10px] font-bold text-sky-900/40">마을 그림: Kenney (kenney.nl, CC0)</p>
      </div>

      <AnimatePresence>
        {sheet?.type === 'lessons' && (
          <Sheet title="🌅 오늘 장사 — 배운 차시 고르기" onClose={() => setSheet(null)} wide>
            <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              📘 교과서 4단원 차시 그대로예요. <b>1차시는 단원 도입</b>이라 계산이 없어서 <b>2차시부터</b> 시작해요. 오늘 배운 차시를 골라요!
            </p>
            <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              ⏱ 타임 어택: 손님 30명을 받으면 끝! 틀리면 +{PENALTY.wrong}초, 놓치면 +{PENALTY.lost}초 · 10·20명째 🔥러시 타임 · 중간에 나가도 저장돼요
            </p>
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
                    {town.records?.[l.type] && (
                      <span className="mt-0.5 block text-[11px] font-black text-amber-600">
                        🏆 최고 {clock(town.records[l.type].secs)} {'★'.repeat(town.records[l.type].stars)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs font-bold text-slate-500">개수로 파는 가게({SHOPS.filter((x) => x.kind === 'count').map((x) => x.icon).join('')})는 2·3차시, 달아서 파는 가게({SHOPS.filter((x) => x.kind === 'measure').map((x) => x.icon).join('')})는 4~7차시에 문을 열어요. 모든 지도의 가게에 손님이 와요.</p>
          </Sheet>
        )}

      </AnimatePresence>
      <BuildSheets town={town} sheet={sheet} setSheet={setSheet} onUpdate={onUpdate} />
    </div>
  )
}

// ─── 장사하는 하루 ───
// 이어 하기용 진행 상황 (장사 도중 나가도 저장)
function progressOf(lesson, s, elapsedMs) {
  // paidLive: 판 돈은 그때그때 이미 가진 돈에 들어갔다 (정산 때는 재료비·유지비만 뺀다)
  return { type: lesson.type, stats: s.stats, elapsedMs, penalty: s.penalty, rushDone: s.rushDone, used: s.used, paidLive: true, savedAt: Date.now() }
}

function Day({ lesson, town, owner, relaxed, resume, onFinish, onQuit, onSave, onUpdate, onLog }) {
  const rules = useMemo(() => dayRules(lesson, town, relaxed), []) // eslint-disable-line react-hooks/exhaustive-deps
  const regulars = useMemo(() => regularsOf(town), []) // eslint-disable-line react-hooks/exhaustive-deps
  const nbBonus = (k) => neighborsOf(townRef.current, k).bonus // 이웃 효과 (장사 중 지어도 바로 반영)
  const shopWeight = (x) => x.lv * demandOf(x.shop.id, rules.forecast) * (1 + nbBonus(x.key))
  // 장사 중에도 가게를 짓고 키울 수 있어서, 문 연 가게는 그때그때 마을에서 다시 본다
  const open = openShops(lesson, town)
  const openKeys = new Set(open.map((x) => x.key))
  const closedKeys = new Set(shopsIn(town).filter((x) => !openKeys.has(x.key)).map((x) => x.key))
  const openRef = useRef(open)
  openRef.current = open
  const townRef = useRef(town)
  townRef.current = town
  const [building, setBuilding] = useState(false) // 🏗️ 짓기 모드 (시계 멈춤)
  const [sheet, setSheet] = useState(null)
  // 가격은 손님마다 새로 (하루 내내 같은 가격이면 같은 식이 자꾸 나온다)
  const prices = useMemo(() => ({}), [])

  // 게임 상태는 ref에 두고 짧은 간격으로 다시 그린다 (걷는 손님이 여럿이라)
  const g = useRef({
    walkers: [], queues: {}, nextSpawn: 0, startAt: 0, rushUntil: 0,
    penalty: resume?.penalty || 0,
    rushDone: resume?.rushDone || [],
    used: resume?.used || [], // 오늘 낸 식들
    stats: resume?.stats
      ? { ...resume.stats, met: { ...resume.stats.met }, thoughts: { ...(resume.stats.thoughts || {}) }, fans: { ...(resume.stats.fans || {}) } }
      : { sales: D(0), tips: D(0), served: 0, lost: 0, vip: 0, first: 0, best: 0, met: {}, thoughts: {}, fans: {} },
    avgSolve: 0, // 한 명 계산하는 데 걸린 시간(초) — 줄 예보에 쓴다
    bubbles: {}, // 가게 위 손님 생각 { [가게]: { key, text, until } }
  })
  const [, setFrame] = useState(0)
  const [count, setCount] = useState(3) // 3·2·1 영업 시작!
  const [sel, setSel] = useState(open[0]?.key || null)
  const [mapView, setMapView] = useState(open[0]?.map || 'main')
  const [paused, setPaused] = useState(false)
  const [input, setInput] = useState('')
  const [tries, setTries] = useState(0)
  const [helper, setHelper] = useState(false)
  const [state, setState] = useState('ask') // ask | paid | explain | done
  const [streak, setStreak] = useState(0)
  const [toast, setToast] = useState(null)
  const [pop, setPop] = useState(null)
  const [penaltyPop, setPenaltyPop] = useState(0)
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

  // 단골 정 — 처음에 정확히 계산해 주면 +1, 놓치면 −1 (하루를 마칠 때 마을에 더한다)
  function fan(cust, d) {
    const f = g.current.stats.fans
    const e = cust.customer.emoji
    f[e] = (f[e] || 0) + d
  }

  // 손님 생각 말풍선 (가게 위에 3초) + 정산 때 보여 줄 횟수
  function think(shopKey, key, now) {
    const s = g.current
    const text = key === 'weather' ? `${rules.forecast.weather.icon} ${rules.forecast.weather.say}` : THOUGHTS[key].text
    s.bubbles[shopKey] = { key, text, until: now + 3200 }
    if (key !== 'weather') s.stats.thoughts[key] = (s.stats.thoughts[key] || 0) + 1
  }

  // 손님은 가게가 있는 지도의 입구에서 들어와 길을 따라 걷는다
  const randomEntrance = (m) => {
    const E = entrancesOf(m)
    return E[Math.floor(Math.random() * E.length)]
  }
  function walkerTo(cust, shopKey) {
    const m = mapOf(shopKey)
    const [r, c] = parseKey(shopKey)
    const dest = frontRoad(r, c, m)
    return { id: cust.id, cust, shopKey, map: m, path: roadPath(randomEntrance(m), dest, m), i: 0, next: Date.now() + STEP_MS, phase: 'in' }
  }
  function walkerAway(cust, shopKey, face) {
    const m = mapOf(shopKey)
    const [r, c] = parseKey(shopKey)
    const start = frontRoad(r, c, m)
    g.current.walkers.push({ id: `${cust.id}-out`, cust, shopKey, map: m, path: roadPath(start, randomEntrance(m), m), i: 0, next: Date.now() + STEP_MS, phase: 'out', face })
  }

  // 3·2·1 — 끝나면 시계 시작 (이어 하기면 그때까지 쓴 시간부터)
  useEffect(() => {
    if (count <= 0) return
    sfx.tick?.()
    const t = setTimeout(() => {
      if (count === 1) {
        g.current.startAt = Date.now() - (resume?.elapsedMs || 0)
        g.current.nextSpawn = Date.now() + 300
        sfx.double?.()
      }
      setCount((c) => c - 1)
    }, 750)
    return () => clearTimeout(t)
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  // 한 박자 — 손님 오기 · 걷기 · 줄 서기 · 기다리다 떠나기
  useEffect(() => {
    if (paused || state === 'done' || count > 0) return
    const t = setInterval(() => {
      const now = Date.now()
      const s = g.current
      // 새 손님
      // 새 손님 — 30명을 다 받을 만큼만, 줄에 자리가 있는 가게로 (러시 타임엔 두 배 빨리)
      const inFlight = s.walkers.filter((w) => w.phase === 'in').length + Object.values(s.queues).reduce((a, q) => a + q.length, 0)
      const open = openRef.current
      const town = townRef.current
      if (s.stats.served + inFlight < rules.goal && now >= s.nextSpawn && open.length) {
        const room = open.filter((x) => (s.queues[x.key]?.length || 0) + s.walkers.filter((w) => w.phase === 'in' && w.shopKey === x.key).length < slotsOf(x.lv))
        if (!room.length) s.nextSpawn = now + 800
        else {
          const weights = room.map(shopWeight) // 수요 ▲·이웃 효과 큰 가게로 손님이 몰린다
          let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
          const target = room.find((x, i) => (roll -= weights[i]) < 0) || room[0]
          const cust = { ...makeFreshCustomer(lesson, target.shop, prices, { vipChance: rules.vipChance, met: { ...town.met, ...s.stats.met }, recent: new Set(s.used), regulars }) }
          s.spawnLog = [...(s.spawnLog || []).filter((t) => now - t < 60000), now] // 줄 예보용: 최근 1분에 온 손님
          s.used = [...s.used, orderKey(cust)] // 오늘 낸 식은 다시 안 낸다 (30문제 모두 다르게)
          s.walkers.push(walkerTo(cust, target.key))
          s.stats.met[cust.customer.emoji] = (s.stats.met[cust.customer.emoji] || 0) + 1
          const rush = now < s.rushUntil ? 0.5 : 1
          if (s.burst > 0) { // 📣 확성기 — 손님 셋이 줄줄이
            s.burst -= 1
            s.nextSpawn = now + 450
          } else s.nextSpawn = now + (inFlight < 1 ? 1200 : rules.gap * 1000 * rush * (0.7 + Math.random() * 0.6))
        }
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
          s.penalty += PENALTY.lost
          fan(w.cust, -1)
          walkerAway(w.cust, w.shopKey, '😤')
          setToast(`😤 ${shopById(town.built[w.shopKey].id).name} 줄이 꽉 차서 ${w.cust.customer.name} 손님이 갔어요 · +${PENALTY.lost}초`)
          sfx.wrong()
        } else {
          const nb = nbBonus(w.shopKey)
          // 기다려 주는 시간: 이웃 효과 최대 +30%, 단골 +20%
          q.push({ ...w.cust, arrivedAt: now, pat: rules.patience * (1 + nb * 0.3) * (w.cust.regular ? 1.2 : 1) })
          sfx.card?.()
          // 손님 생각 — 줄·수요·장식·평판·날씨를 보고 한마디
          const b = town.built[w.shopKey]
          const m = mapOf(w.shopKey)
          const th = thoughtFor({
            queueLen: q.length, slots: slotsOf(b?.lv || 1), demand: demandOf(b?.id, rules.forecast),
            decorHere: Object.entries(town.built).filter(([k, x]) => x.kind === 'decor' && mapOf(k) === m).length,
            pop: popularityOf(town), lv: b?.lv || 1, rep: rules.rep, rush: now < s.rushUntil, weather: true,
            regular: w.cust.regular, nearBonus: nb,
          })
          if (th) think(w.shopKey, th, now)
        }
      }
      // 떠나는 손님 지우기
      s.walkers = s.walkers.filter((w) => !(w.phase === 'out' && w.i >= w.path.length - 1 && now >= w.next))
      // 너무 오래 기다린 손님 (지금 계산 중인 손님은 빼고)
      for (const [k, q] of Object.entries(s.queues)) {
        const keep = []
        q.forEach((c, i) => {
          const serving = k === selRef.current && i === 0
          if (!serving && !c.slowThought && now - c.arrivedAt > (c.pat || rules.patience) * 600) { // 기다림 60%를 넘으면 한 번
            c.slowThought = true
            think(k, 'slow', now)
          }
          if (!serving && now - c.arrivedAt > (c.pat || rules.patience) * 1000) {
            s.stats.lost += 1
            fan(c, -1)
            s.penalty += PENALTY.lost
            walkerAway(c, k, '😤')
            setToast(`😤 ${c.customer.name} 손님이 기다리다 갔어요 · +${PENALTY.lost}초`)
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
        if (best && best[0] !== selRef.current) {
          setSel(best[0])
          setMapView(mapOf(best[0])) // 다른 지도 가게면 그 지도로
        }
      }
      // 하루 끝 — 손님 30명을 받으면
      if (s.stats.served >= rules.goal && stateRef.current === 'ask') {
        const secs = Math.round((now - s.startAt) / 1000 + s.penalty)
        setState('done')
        sfx.victory()
        onFinish({ ...s.stats, upkeep: rules.upkeep, secs, penalty: s.penalty, stars: starsFor(secs, rules.stars), starTimes: rules.stars })
      }
      setFrame((f) => f + 1)
    }, 150)
    return () => clearInterval(t)
  }, [paused, state, count]) // eslint-disable-line react-hooks/exhaustive-deps

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
    s.startAt += d
    s.rushUntil = s.rushUntil ? s.rushUntil + d : 0
    s.tipBoostUntil = s.tipBoostUntil ? s.tipBoostUntil + d : 0
    s.walkers.forEach((w) => { w.next += d })
    Object.values(s.queues).forEach((q) => q.forEach((c) => { c.arrivedAt += d }))
    servingSince.current += d
    setPaused(false)
  }

  function toggleBuild() {
    if (!building) {
      if (!paused) togglePause()
      setBuilding(true)
    } else {
      setSheet(null)
      setBuilding(false)
      if (paused) togglePause()
    }
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

  // 🛍️ 장사 아이템 쓰기
  function applyItem(id) {
    const s = g.current
    const have = (townRef.current.items || {})[id] || 0
    if (!have || !s.startAt || count > 0 || paused || state === 'done') return
    const now = Date.now()
    if (id === 'hourglass') {
      s.startAt = Math.min(now, s.startAt + 15000)
      setToast('⏳ 모래시계! 시계가 15초 뒤로 돌아갔어요')
    } else if (id === 'megaphone') {
      s.burst = 2
      s.nextSpawn = now
      setToast('📣 "소수 가게로 오세요~!" 손님 3명이 와요')
    } else if (id === 'tipcoupon') {
      s.tipBoostUntil = Math.max(now, s.tipBoostUntil || 0) + 60000
      setToast('💝 1분 동안 팁이 두 배!')
    } else if (id === 'candybasket') {
      Object.values(s.queues).forEach((q) => q.forEach((c) => { c.arrivedAt = now }))
      servingSince.current = now
      setToast('🍬 사탕을 나눠 줬어요! 줄 선 손님 모두 기분 좋게 다시 기다려요')
    }
    sfx.coin()
    onUpdate((t) => ({ items: { ...(t.items || {}), [id]: Math.max(0, ((t.items || {})[id] || 0) - 1) }, itemsUsed: (t.itemsUsed || 0) + 1 }), false)
    setFrame((f) => f + 1)
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

  // 한 명 받을 때마다: 이어 하기 저장, 10·20명째 러시 타임
  function afterServed() {
    const s = g.current
    const n = s.stats.served
    if (RUSH_AT.includes(n) && !s.rushDone.includes(n)) {
      s.rushDone = [...s.rushDone, n]
      s.rushUntil = Date.now() + RUSH_MS
      setToast('🔥 러시 타임! 1분 동안 손님이 두 배로 몰려와요 · 팁 두 배!')
      cheer(2)
    }
    if (n < rules.goal) onSave?.(progressOf(lesson, s, Date.now() - s.startAt), n % 5 === 0)
  }

  function pay() {
    if (state !== 'ask' || !active || !input || paused) return
    const r = grade(active, input)
    if (r === 'invalid') return
    const s = g.current
    const mood = moodOf((Date.now() - active.arrivedAt) / 1000, active.pat || rules.patience)
    if (r === 'correct') {
      const firstTry = tries === 0
      const st = firstTry ? streak + 1 : 0
      const lv = town.built[sel]?.lv || 1
      const rush = Date.now() < s.rushUntil
      const boost = Date.now() < (s.tipBoostUntil || 0)
      // 수요 ▲ 가게 +1G, 소문난 가게 +1G (처음에 스스로 맞혔을 때만)
      const bonus = firstTry && !helper ? (demandLevel(demandOf(town.built[sel]?.id, rules.forecast)) >= 1 ? 1 : 0) + rules.repTip + (active.regular ? 1 : 0) : 0
      if (firstTry && !helper) fan(active, 1)
      const took = (Date.now() - servingSince.current) / 1000
      s.avgSolve = s.avgSolve ? s.avgSolve * 0.7 + took * 0.3 : took
      const tip = ((helper ? 0 : tipFor({ firstTry, mood, vip: active.vip, streak: st, lv })) + bonus) * (rush ? 2 : 1) * (boost ? 2 : 1)
      setStreak(st)
      s.stats.sales = addD(s.stats.sales, active.answer)
      s.stats.tips = addD(s.stats.tips, D(tip))
      onLog?.({ l: lesson.type, q: `${active.price} × ${show(active.b)}`, r: firstTry ? 1 : 2 })
      const paid = addD(active.answer, D(tip))
      onUpdate((t) => ({ money: addD(t.money, paid) }), false) // 판 돈은 바로 내 돈 — 장사 중에도 지을 수 있게
      s.stats.served += 1
      s.stats.first += firstTry ? 1 : 0
      s.stats.vip += active.vip ? 1 : 0
      s.stats.best = Math.max(s.stats.best, st)
      afterServed()
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
    s.penalty += PENALTY.wrong
    setPenaltyPop((n) => n + 1)
    // 틀리면 방법(도우미)만 알려 준다 — 답·풀이는 보여 주지 않는다.
    // 세 번 틀리면 손님이 저절로 떠난다 (30문제에 세지 않음) — 그만큼 손님이 더 온다
    const t = tries + 1
    setTries(t)
    setHelper(true)
    setInput('')
    if (t >= 3) {
      onLog?.({ l: lesson.type, q: `${active.price} × ${show(active.b)}`, r: 0 })
      s.stats.lost += 1
      fan(active, -1)
      setState('gone')
      setToast(`😢 세 번 틀려서 ${active.customer.name} 손님이 그냥 갔어요 (30문제에 안 세요)`)
      setTimeout(() => done('😢'), 1400)
    }
  }

  useEffect(() => {
    const onKey = (e) => {
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
  const live = town.money
  const waitingTotal = Object.values(queues).reduce((a, q) => a + q.length, 0)
  const started = count <= 0 && s.startAt
  const totalSecs = started ? ((paused ? pausedAt.current : now) - s.startAt) / 1000 + s.penalty : resume?.elapsedMs ? resume.elapsedMs / 1000 + s.penalty : 0
  const liveStars = starsFor(totalSecs, rules.stars)
  const rushing = started && now < s.rushUntil
  const boosting = started && now < (s.tipBoostUntil || 0)
  const inFlightNow = s.walkers.filter((w) => w.phase === 'in').length + waitingTotal
  // 지도마다 기다리는 손님 수 (탭에 빨간 숫자)
  // 줄 예보 — 1분에 오는 손님 vs 1분에 계산하는 손님 (계산 속도는 오늘 내 기록으로)
  const sinceStart = started ? Math.min(60, ((paused ? pausedAt.current : now) - s.startAt) / 1000) : 0
  const recent = (s.spawnLog || []).filter((t) => now - t < 60000).length
  const fc = queueForecast({ gapSec: rules.gap, avgSolveSec: s.avgSolve || 20, rush: rushing, arrivePerMin: sinceStart >= 20 ? recent / (sinceStart / 60) : null })
  const openW = open.map((x) => [x.key, shopWeight(x), x])
  const sumW = openW.reduce((a, [, w]) => a + w, 0) || 1
  const riskKeys = new Set(
    fc.growing
      ? openW.filter(([k, w, x]) => overflowRisk({ arrivePerMin: fc.arrive, share: w / sumW, patienceSec: rules.patience * (1 + nbBonus(k) * 0.3), slots: slotsOf(x.lv) })).map(([k]) => k)
      : [],
  )
  const waitingByMap = {}
  for (const [k, q] of Object.entries(queues)) if (q.length) waitingByMap[mapOf(k)] = (waitingByMap[mapOf(k)] || 0) + q.length
  const ownedItems = ITEMS.filter((it) => (town.items || {})[it.id])

  // 가게 머리 위 — 줄 선 손님과 기다림 고리
  const bubbleOf = (k, cx, cy, high) => {
    const b = s.bubbles[k]
    if (!b || now > b.until) return null
    const w = Math.min(150, b.text.length * 8.6 + 14)
    const lv = town.built[k]?.lv || 1
    const y = high ? cy - 48 - lv * 15 - 30 : cy - 52 - (lv - 1) * 15
    const bad = THOUGHTS[b.key]?.bad
    return (
      <g pointerEvents="none" className="shop-bop">
        <rect x={cx - w / 2} y={y - 11} width={w} height="17" rx="8.5" fill={bad ? '#fff1f2' : '#fff'} stroke={bad ? '#fda4af' : 'rgba(0,0,0,0.15)'} />
        <circle cx={cx - 3} cy={y + 9} r="2.4" fill="#fff" stroke="rgba(0,0,0,0.15)" />
        <text x={cx} y={y + 1.5} textAnchor="middle" fontSize="9" fontWeight="800" fill={bad ? '#be123c' : '#334155'}>{b.text}</text>
      </g>
    )
  }
  const riskBadge = (k, cx, cy) =>
    riskKeys.has(k) ? (
      <g pointerEvents="none">
        <rect x={cx + 10} y={cy - 22} width="30" height="13" rx="6.5" fill="#f97316" />
        <text x={cx + 25} y={cy - 12.5} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">⚠️줄</text>
      </g>
    ) : null
  const overlay = (k, cx, cy) => {
    const q = queues[k] || []
    if (!q.length) return <>{riskBadge(k, cx, cy)}{bubbleOf(k, cx, cy, false)}</>
    const front = q[0]
    const serving = k === sel
    const frac = serving ? 1 : Math.max(0, 1 - (now - front.arrivedAt) / ((front.pat || rules.patience) * 1000))
    const color = frac > 0.6 ? '#22c55e' : frac > 0.25 ? '#f59e0b' : '#ef4444'
    const R = 13
    const C = 2 * Math.PI * R
    const y = cy - 48 - (town.built[k]?.lv || 1) * 15 // 건물 높이(Lv)에 맞춰 위로
    return (
      <g className={serving ? '' : 'town-bob'}>
        <line x1={cx} y1={y + 14} x2={cx} y2={y + 24} stroke="#fff" strokeWidth="2" />
        <circle cx={cx} cy={y} r={R + 3} fill={serving ? '#fde047' : '#fff'} stroke="rgba(0,0,0,0.15)" />
        <circle cx={cx} cy={y} r={R} fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${C * frac} ${C}`} transform={`rotate(-90 ${cx} ${y})`} />
        <text x={cx} y={y + 6} textAnchor="middle" fontSize="16">{front.customer.emoji}</text>
        {front.vip && <text x={cx - 12} y={y - 10} fontSize="11">👑</text>}
        {front.regular && <text x={cx + 8} y={y + 14} fontSize="10">❤️</text>}
        {riskBadge(k, cx, cy)}
        {q.length > 1 && (
          <g>
            <circle cx={cx + 15} cy={y - 10} r="7" fill="#e11d48" />
            <text x={cx + 15} y={y - 7} textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff">{q.length}</text>
          </g>
        )}
        {bubbleOf(k, cx, cy, true)}
      </g>
    )
  }
  const walkers = (
    <g pointerEvents="none">
      {s.walkers.filter((w) => (w.map || 'main') === mapView).map((w) => {
        const [r, c] = w.path[Math.min(w.i, w.path.length - 1)]
        const [x, y] = center(r, c)
        const flip = w.i > 0 && w.path[w.i - 1] && (w.path[w.i][1] - w.path[w.i - 1][1] < 0 || w.path[w.i][0] - w.path[w.i - 1][0] > 0)
        return (
          <g key={w.id} style={{ transform: `translate(${x}px, ${y}px)`, transition: `transform ${STEP_MS}ms linear` }}>
            <ellipse cx="0" cy="2" rx="7" ry="3" fill="rgba(0,0,0,0.18)" />
            <text x="0" y="-2" textAnchor="middle" fontSize="18" className="town-walk" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>{w.cust.customer.emoji}</text>
            {w.face && <text x="9" y="-14" fontSize="10">{w.face}</text>}
            {w.cust.vip && w.phase === 'in' && <text x="-4" y="-18" fontSize="9">👑</text>}
            {w.cust.regular && w.phase === 'in' && <text x="4" y="-16" fontSize="8">❤️</text>}
          </g>
        )
      })}
    </g>
  )

  const face = state === 'paid' ? '😍' : state === 'gone' ? '😢' : tries > 0 ? '🤔' : active ? MOOD_FACE[moodOf((now - active.arrivedAt) / 1000, active.pat || rules.patience)] : ''
  const bubble = !active ? '' : state === 'paid' ? (active.vip ? '역시 최고의 가게! 👑' : '고마워요! 또 올게요~') : state === 'gone' ? '음… 다음에 올게요 😢' : tries > 0 ? '어? 계산이 이상한데… 다시 해 주실래요?' : active.say

  return (
    <div className="min-h-[100dvh] town-bg safe-padded px-2 pt-2 pb-4">
      <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[1fr_22rem] lg:gap-3">
        <div>
          {/* 위 띠 */}
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onQuit(started && state !== 'done' ? progressOf(lesson, s, (paused ? pausedAt.current : Date.now()) - s.startAt) : null)} className="h-9 w-9 shrink-0 rounded-full bg-sky-900/15 font-black text-sky-900" aria-label="잠깐 나가기 (저장돼요)">✕</button>
            <button type="button" onClick={() => (building ? toggleBuild() : togglePause())} className="h-9 w-9 shrink-0 rounded-full bg-sky-900/15 font-black text-sky-900" aria-label={paused ? '계속하기' : '잠깐 멈춤'}>{paused ? '▶' : '⏸'}</button>
            <button type="button" onClick={toggleBuild} disabled={count > 0 || state === 'done'} className={`h-9 shrink-0 rounded-full px-2.5 text-sm font-black disabled:opacity-40 ${building ? 'bg-amber-400 text-amber-950' : 'bg-sky-900/15 text-sky-900'}`} aria-label="짓기">🏗️</button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 truncate text-xs font-black text-sky-950">
                <span>{lesson.lesson} · 손님 <b className="text-base">{s.stats.served}</b>/{rules.goal}</span>
                {s.stats.lost > 0 && <span className="text-rose-600">놓침 {s.stats.lost}</span>}
                {relaxed && <span>🐢</span>}
              </div>
              <div className="mt-0.5 flex gap-px">
                {Array.from({ length: rules.goal }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < s.stats.served ? 'bg-emerald-500' : 'bg-sky-900/15'}`} />
                ))}
              </div>
            </div>
            <div className={`shrink-0 rounded-xl px-2 py-0.5 text-center font-black tabular-nums leading-tight ${rushing ? 'bg-rose-600 text-white town-rush' : 'bg-slate-900 text-white'}`}>
              <div className="text-lg">⏱ {clock(totalSecs)}</div>
              <div className="text-[9px] opacity-80">{'★'.repeat(liveStars)}{'☆'.repeat(3 - liveStars)} {liveStars > 1 ? `~${clock(rules.stars[3 - liveStars])}` : ''}</div>
            </div>
            <SoundMini />
          </div>
          <div className="mt-1 flex items-center justify-end gap-2">
            {ownedItems.length > 0 && (
              <div className="mr-auto flex gap-1">
                {ownedItems.map((it) => (
                  <button key={it.id} type="button" title={`${it.name} — ${it.desc}`} aria-label={`${it.name} 쓰기`}
                    disabled={!started || paused || state === 'done' || (it.id === 'megaphone' && s.stats.served + inFlightNow >= rules.goal) || (it.id === 'candybasket' && !waitingTotal)}
                    onClick={() => applyItem(it.id)}
                    className="relative h-8 w-9 rounded-xl bg-white/90 text-lg shadow ring-1 ring-amber-300 active:scale-95 disabled:opacity-40">
                    {it.icon}
                    <span className="absolute -right-1.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-amber-600 px-1 text-[11px] font-black leading-none text-white ring-2 ring-white">{town.items[it.id]}</span>
                  </button>
                ))}
              </div>
            )}
            {boosting && <span className="rounded-full bg-pink-500 px-2 py-0.5 text-xs font-black text-white">💝 팁×2 {Math.ceil((s.tipBoostUntil - now) / 1000)}초</span>}
            {rushing && <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-black text-white town-rush">🔥 러시 타임 {Math.ceil((s.rushUntil - now) / 1000)}초</span>}
            {s.penalty > 0 && <span key={penaltyPop} className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700 town-shake">벌칙 +{s.penalty}초</span>}
            <Money value={live} refEl={moneyRef} />
          </div>
          {started && state !== 'done' && (
            <div className={`mt-1 rounded-xl px-2.5 py-1 text-[11px] font-black ${fc.growing ? 'bg-orange-100 text-orange-800' : 'bg-emerald-50 text-emerald-800'}`}>
              📊 줄 예보: 1분에 손님 {fc.arrive}명 와요 · 나는 1분에 {fc.serve}명 계산 → {fc.growing ? '줄이 길어져요! ⚠️ 가게는 줄 칸을 늘리거나(Lv업) 빨리 계산' : '여유 있어요 😊'}
            </div>
          )}
          {/* 지도 */}
          <MapTabs town={town} mapView={mapView} setMapView={setMapView} waiting={waitingByMap} hideLocked={!building} />
          <div className="relative mt-1">
            <MapZoom>
            <TownMap
              town={town}
              mapId={mapView}
              onTile={(r, c) => {
                if (building) {
                  const sh = tileSheet(town, r, c, mapView)
                  if (sh) setSheet(sh)
                } else if (town.built[tkey(r, c, mapView)]?.kind === 'shop') pick(tkey(r, c, mapView))
              }}
              selectedKey={building ? (sheet && sheet.r != null ? tkey(sheet.r, sheet.c, sheet.m || 'main') : null) : sel}
              closedKeys={closedKeys}
              shopRefs={shopRefs}
              overlay={building ? null : overlay}
              extra={building ? null : walkers}
              range={building && sheet && sheet.r != null && (sheet.m || 'main') === mapView ? { r: sheet.r, c: sheet.c } : null}
            />
            </MapZoom>
            {building && (
              <div className="absolute inset-x-0 top-1 mx-auto flex w-fit max-w-[96%] items-center gap-2 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow">
                🏗️ 짓기 모드 — 땅·가게를 눌러요 (시계 멈춤)
                <button type="button" onClick={toggleBuild} className="rounded-full bg-white px-2 py-0.5">▶ 장사 계속</button>
              </div>
            )}
            <AnimatePresence>
              {toast && (
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-1 mx-auto w-fit max-w-[95%] rounded-full bg-rose-600 px-3 py-1 text-center text-xs font-black text-white shadow">
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
            {count > 0 && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30">
                <div className="text-center text-white">
                  <div className="text-sm font-black">{resume ? '이어서 장사!' : `${lesson.lesson} · 손님 ${rules.goal}명 타임 어택`}</div>
                  <motion.div key={count} initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-8xl font-black drop-shadow-lg">{count}</motion.div>
                  <div className="text-xs font-bold opacity-90">★★★ {clock(rules.stars[0])} 안에 · 틀리면 +{PENALTY.wrong}초 · 놓치면 +{PENALTY.lost}초</div>
                </div>
              </div>
            )}
            {paused && !building && (
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
              {count > 0 ? '곧 문을 열어요!' : '손님이 걸어오고 있어요 🚶 — 머리 위에 손님이 뜬 가게를 눌러요'}
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

      {building && <BuildSheets town={town} sheet={sheet} setSheet={setSheet} onUpdate={onUpdate} inDay />}
    </div>
  )
}

// ─── 정산서 ───
function Settlement({ result, town, onTown, onAgain }) {
  const timed = result.secs != null
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
          {timed && (
            <div className="mt-2 text-center">
              <div className="text-4xl leading-none">
                {[1, 2, 3].map((i) => (
                  <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.2, type: 'spring' }} className={i <= result.stars ? 'text-amber-400' : 'text-slate-200'}>★</motion.span>
                ))}
              </div>
              <div className="mt-1 text-2xl font-black tabular-nums">⏱ {clock(result.secs)}</div>
              <div className="text-[11px] font-bold text-slate-500">
                벌칙 +{result.penalty}초 포함 · ★★★ {clock(result.starTimes[0])} · ★★ {clock(result.starTimes[1])}
              </div>
              {result.record && <div className="mt-1 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-sm font-black text-amber-950 shop-bop">🏆 신기록!</div>}
            </div>
          )}
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
          {result.repAfter != null && (() => {
            const dlt = result.repAfter - result.repBefore
            return (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm font-black">
                <span className="text-amber-900">📣 평판 {result.repBefore} → {result.repAfter}</span>
                <span className={dlt > 0 ? 'text-emerald-600' : dlt < 0 ? 'text-rose-600' : 'text-slate-400'}>
                  {dlt > 0 ? `+${dlt} 좋은 소문!` : dlt < 0 ? `${dlt} 계산 실수가 소문났어요` : '그대로'}
                </span>
              </div>
            )
          })()}
          {(() => {
            const top = Object.entries(result.thoughts || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)
            if (!top.length) return null
            return (
              <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2">
                <div className="text-xs font-black text-slate-500">💭 오늘 손님들이 한 생각</div>
                {top.map(([k, n]) => (
                  <div key={k} className="mt-1 text-xs font-bold">
                    <span className={THOUGHTS[k]?.bad ? 'text-rose-700' : 'text-slate-700'}>“{THOUGHTS[k]?.text}” ×{n}</span>
                    <span className="block text-[11px] text-slate-500">→ {THOUGHTS[k]?.hint}</span>
                  </div>
                ))}
              </div>
            )
          })()}
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
      <p className="text-xs font-bold text-slate-500">반짝이는 손님은 아주 가끔 와요. 처음에 정확히 계산해 주면 정이 들어(♡) {FAN_AT}이 되면 ❤️ 단골 — 자주 오고 팁도 더 줘요.</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {CUSTOMERS.map(([e, n, r]) => {
          const seen = town.met[e]
          return (
            <div key={e} className={`rounded-2xl p-2 text-center ${seen ? (r ? 'bg-amber-100 ring-2 ring-amber-300' : 'bg-sky-50') : 'bg-slate-100'}`}>
              <div className={`text-4xl ${seen ? '' : 'opacity-30 grayscale'}`}>{seen ? e : '❔'}</div>
              <div className="truncate text-[11px] font-black text-slate-700">{seen ? n : '???'}</div>
              {seen ? <div className="text-[10px] font-bold text-slate-400">{seen}번 옴</div> : null}
              {seen && (fansOf(town)[e] || 0) > 0 ? (
                <div className={`text-[10px] font-black ${fansOf(town)[e] >= FAN_AT ? 'text-rose-600' : 'text-rose-400'}`}>
                  {fansOf(town)[e] >= FAN_AT ? '❤️ 단골' : `♡ ${fansOf(town)[e]}/${FAN_AT}`}
                </div>
              ) : null}
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
  const [resume, setResume] = useState(null)
  const [lesson, setLesson] = useState(null)
  const [dayKey, setDayKey] = useState(0)
  const [result, setResult] = useState(null)
  const [modal, setModal] = useState(null)
  const [pairOpen, setPairOpen] = useState(false) // 🤝 짝꿍 계산 훈련 화면
  const townRef = useRef(town)
  townRef.current = town
  // 짝꿍 계산 50문제를 맞혀야 장사가 열린다 (선생님 계정은 바로)
  const pairDone = town.pair?.done || 0
  const isTeacher = me?.role === 'teacher'
  const [studentView, setStudentView] = useState(false) // 선생님: 학생 화면 미리보기
  const unlockedPlay = (isTeacher && !studentView) || pairDone >= PAIR_GOAL
  const [relaxed, setRelaxedState] = useState(() => {
    try { return localStorage.getItem(RELAX_KEY) === '1' } catch { return false }
  })
  const setRelaxed = (v) => {
    setRelaxedState(v)
    try { localStorage.setItem(RELAX_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }

  // 로그인한 학생: 계정에 저장된 마을과 이 기기 마을을 합친다 (다른 기기에서 하던 것 이어 하기).
  // 예전엔 '더 최근에 저장된 쪽'을 골라서, 새 기기의 빈 마을이 먼저 저장되면 계정의 진짜 기록을 덮어쓸 수 있었다.
  // 이제는 장사·짝꿍 기록이 더 앞선 쪽을 고른다 (townGuard) — 학생 기록은 뒤로 가지 않는다.
  const [syncing, setSyncing] = useState(false)
  useEffect(() => {
    const local = loadTown(who)
    setTown(local)
    if (!me) return
    let alive = true
    setSyncing(true)
    accountApi()
      .then((a) => a.loadProgress(a.ME, { fresh: true }))
      .then((p) => {
        const cloud = p?.town
        if (!alive || !cloud) return
        const cur = townRef.current
        const t = safeTown(cur, cloud)
        if (t !== cur) {
          saveTown(who, t)
          setTown(t)
        }
      })
      .catch(() => {})
      .finally(() => alive && setSyncing(false))
    return () => {
      alive = false
    }
  }, [who]) // eslint-disable-line react-hooks/exhaustive-deps

  // 저장: 이 기기에는 항상, 계정에는 cloud=true일 때 (장사 중엔 5명마다)
  function persist(n, cloud = true) {
    const t = { ...n, savedAt: Date.now() }
    saveTown(who, t)
    if (me && cloud) accountApi().then((a) => a.saveTown(a.ME, t)).catch(() => {})
    return t
  }
  function update(fn, cloud = true) {
    setTown((cur) => persist({ ...cur, ...fn(cur) }, cloud))
  }

  // 문제별 기록 — 선생님이 학생별로 확인 (r: 1 처음에 맞힘 · 2 힌트 후 맞힘 · 0 세 번 틀려 손님이 감)
  function logProblem(e) {
    update((t) => ({ log: [...(t.log || []), { ...e, t: Date.now() }].slice(-600) }), false)
  }

  // 학생 기록은 저절로 바꾸지 않는다 (학생이 이어 하기·정산을 눌렀을 때만).
  // 예전 방식으로 저장된 하던 장사(번 돈을 정산 때 한꺼번에 넣던 때)는 그때 번 돈을 넣는다.
  function catchUpPaid(d) {
    if (!d || d.paidLive) return d
    const nd = { ...d, paidLive: true }
    update((t) => ({ money: addD(addD(t.money, d.stats.sales), d.stats.tips), dayInProgress: nd }), false)
    return nd
  }

  // addPaid: 예전 방식 하던 장사라 번 돈이 아직 안 들어간 경우
  function finishDay(r, type = lesson?.type, addPaid = false) {
    const town = townRef.current // 장사 중 판 돈이 계속 들어오므로 지금의 마을로
    const sheet = settle({ sales: r.sales, tips: r.tips, upkeep: r.upkeep })
    const old = type && town.records?.[type]
    const record = r.secs != null && type && (!old || r.secs < old.secs)
    const before = QUESTS.filter((q) => q.done(town)).map((q) => q.id)
    const next = {
      ...town,
      // 판 돈·팁은 이미 들어가 있으니 재료비·유지비만 뺀다
      money: subD(addPaid ? addD(addD(town.money, r.sales), r.tips) : town.money, addD(sheet.material, sheet.upkeep)),
      days: town.days + 1,
      rep: Math.max(0, Math.min(100, repOf(town) + repChange(r))), // 평판 — 하루를 마칠 때만 바뀐다
      fans: Object.entries(r.fans || {}).reduce((m, [e, n]) => ({ ...m, [e]: Math.max(0, (m[e] || 0) + n) }), fansOf(town)), // 단골 정
      served: town.served + r.served,
      lost: town.lost + r.lost,
      bestStreak: Math.max(town.bestStreak, r.best),
      bestProfit: gte(sheet.profit, town.bestProfit) ? sheet.profit : town.bestProfit,
      totalSales: addD(town.totalSales, r.sales),
      met: Object.entries(r.met).reduce((m, [e, c]) => ({ ...m, [e]: (m[e] || 0) + c }), town.met),
      records: record ? { ...(town.records || {}), [type]: { secs: r.secs, stars: r.stars } } : town.records || {},
      dayInProgress: null,
    }
    setTown(persist(next))
    if (sheet.profit.v > 0) setTimeout(() => cheer(3), 900)
    setResult({ ...r, record, sheet, repBefore: repOf(town), repAfter: next.rep, newQuests: QUESTS.filter((q) => q.done(next) && !before.includes(q.id)) })
    setResume(null)
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

  if (pairOpen)
    return (
      <PairDrill
        done={pairDone}
        used={town.pair?.used || []}
        onProgress={(p) => update(() => ({ pair: p }), p.done % 5 === 0)}
        onLog={logProblem}
        onExit={() => setPairOpen(false)}
        onComplete={() => {
          update((t) => ({ pair: { ...(t.pair || {}), done: Math.max(PAIR_GOAL, t.pair?.done || 0) } }))
          setTimeout(() => setPairOpen(false), 1800)
        }}
      />
    )

  if (!lesson)
    return (
      <>
        <Town syncing={syncing} town={town} owner={owner} relaxed={relaxed} setRelaxed={setRelaxed} onBack={onBack} onUpdate={update} onModal={setModal}
          locked={!unlockedPlay}
          pairDone={pairDone}
          teacher={isTeacher}
          studentView={studentView}
          onStudentView={() => setStudentView((v) => !v)}
          onPair={() => setPairOpen(true)}
          onStart={(l) => {
            if (town.dayInProgress) {
              // 하던 장사는 먼저 정산 (번 돈은 이미 들어와 있으니 재료비·유지비를 빼야 한다)
              window.alert('하던 장사가 있어요. 먼저 "이어서 장사"로 마치거나 "여기서 정산하고 끝내기"를 눌러 주세요.')
              return
            }
            setResume(null); setLesson(l); setResult(null); setDayKey((k) => k + 1)
          }}
          onResume={(l, d) => { setResume(catchUpPaid(d)); setLesson(l); setResult(null); setDayKey((k) => k + 1) }}
          onSettleNow={() => {
            const d = town.dayInProgress
            if (!window.confirm(`손님 ${d.stats.served}명까지 받은 것으로 정산하고 끝낼까요? (30명을 못 채워서 기록·별은 없어요)`)) return
            finishDay({ ...d.stats, upkeep: D(upkeepOf(town)), secs: null }, d.type, !d.paidLive)
          }} />
        <AnimatePresence>
          {result && <Settlement result={result} town={town} onTown={() => setResult(null)} onAgain={() => setResult(null)} />}
        </AnimatePresence>
        {modals}
      </>
    )

  return (
    <>
      <Day key={dayKey} lesson={lesson} town={town} owner={owner} relaxed={relaxed} resume={resume} onFinish={finishDay} onUpdate={update} onLog={logProblem}
        onSave={(progress, cloud) => update(() => ({ dayInProgress: progress }), cloud)}
        onQuit={(progress) => {
          // 나가도 하던 장사는 저장 — 마을에서 '이어서 장사'
          if (progress && !result) update(() => ({ dayInProgress: progress }))
          setLesson(null); setResult(null); setResume(null)
        }} />
      <AnimatePresence>
        {result && (
          <Settlement
            result={result}
            town={town}
            onTown={() => { setResult(null); setLesson(null) }}
            onAgain={() => { setResult(null); setResume(null); setDayKey((k) => k + 1) }}
          />
        )}
      </AnimatePresence>
      {modals}
    </>
  )
}
