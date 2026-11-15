// 소수 가게 키우기 — 손님 주문(가격 × 양)을 계산해서 팔고, 번 코인으로 가게를 키운다.
// 시간에 쫓기지 않는다: 손님은 떠나지 않고 기분(팁)만 조금씩 줄어든다. 종이에 차분히 풀어도 된다.
// 틀리면 '계산 도우미'를 보여 주고 한 번 더 기회, 두 번 틀리면 풀이를 보여 준다.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { grade, show, D } from '../../utils/decimalGame.js'
import {
  makeOrder, LESSONS, CUSTOMERS, CUSTOMERS_PER_DAY, LEVELS, DECOR, patienceOf, moodOf, MOOD_FACE,
  coinsFor, addD, loadShop, saveShop,
} from '../../utils/decimalShop.js'
import { useAccount } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { burstAt, cheer, flyCoins } from '../../utils/fx.js'
import GameButton from '../ui/GameButton.jsx'
import { SoundMini, useHideSoundToggle } from '../ui/MuteToggle.jsx'

// ─── 가게 장면 (로비·장사 둘 다) ───
function Scene({ shop, owner, children, compact = false }) {
  const lv = LEVELS[shop.level]
  const has = (id) => shop.decor.includes(id)
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[1.5rem] shadow-xl ${compact ? 'h-48' : 'h-[clamp(15rem,40dvh,22rem)]'}`}
      style={{ background: `linear-gradient(180deg, ${lv.wall[0]}, ${lv.wall[1]})` }}
    >
      {/* 차양 */}
      {lv.awning && (
        <div
          className="absolute inset-x-0 top-0 h-7 shop-awning"
          style={{ backgroundImage: `repeating-linear-gradient(90deg, ${lv.awning[0]} 0 28px, ${lv.awning[1]} 28px 56px)` }}
        />
      )}
      {/* 간판 */}
      <div className={`absolute left-1/2 ${lv.awning ? 'top-8' : 'top-2'} -translate-x-1/2 whitespace-nowrap rounded-xl px-3 py-1 text-sm font-black shadow ${has('rainbow') ? 'shop-rainbow text-white' : 'bg-amber-900 text-amber-50'}`}>
        {has('light') && '✨ '}{owner}의 소수 {lv.name}{has('light') && ' ✨'}
      </div>
      {/* 선반 */}
      <div className="absolute inset-x-3 top-[34%] h-2 rounded bg-amber-800/70 shadow" />
      <div className="absolute inset-x-3 top-[58%] h-2 rounded bg-amber-800/70 shadow" />
      {/* 꾸미기 */}
      {has('flag') && <span className="absolute left-2 top-8 text-3xl shop-sway">🎏</span>}
      {has('art') && <span className="absolute right-3 top-9 text-3xl">🖼️</span>}
      {has('fish') && <span className="absolute right-3 top-[38%] text-3xl">🐠</span>}
      {has('music') && <span className="absolute left-3 top-[38%] text-3xl shop-bop">📻</span>}
      {has('trophy') && <span className="absolute left-12 top-[38%] text-3xl">🏆</span>}
      {has('castle') && <span className="absolute right-12 top-[38%] text-3xl">🏰</span>}
      {has('plant') && <span className="absolute bottom-10 left-1 text-5xl">🪴</span>}
      {children}
      {/* 계산대 */}
      <div className="absolute inset-x-0 bottom-0 h-12 shop-counter" />
      {has('cat') && <span className="absolute bottom-9 right-14 text-3xl shop-bop">🐈</span>}
    </div>
  )
}

// ─── 숫자 패드 ───
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
          className={`h-12 rounded-xl text-2xl font-black shadow-[0_3px_0_rgba(0,0,0,0.15)] transition active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${
            k === '.' ? 'bg-amber-300 text-amber-950' : k === '⌫' ? 'bg-slate-200 text-slate-600' : 'bg-white text-slate-800 ring-1 ring-slate-200'
          }`}
        >
          {k === '.' ? '●' : k}
        </button>
      ))}
    </div>
  )
}

// ─── 로비: 오늘 팔 물건 고르기 · 꾸미기 · 도감 ───
function Lobby({ shop, owner, onOpen, onBack, onDecor, onBook }) {
  const met = Object.keys(shop.met).length
  return (
    <div className="min-h-[100dvh] shop-bg safe-padded px-4 pt-4 pb-8">
      <div className="mx-auto w-full max-w-xl">
        <button type="button" onClick={onBack} className="text-sm font-bold text-amber-900/70">← 메인 메뉴</button>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-black text-amber-950">🏪 소수 가게 키우기</h1>
          <SoundMini className="ml-auto" />
          <span className="rounded-full bg-amber-900 px-3 py-1 text-sm font-black text-amber-50 tabular-nums">🪙 {shop.coins}</span>
        </div>
        <p className="text-sm font-semibold text-amber-900/80">손님 주문을 계산해서 팔고, 번 코인으로 가게를 키워요. 천천히 풀어도 괜찮아요!</p>

        <div className="mt-3">
          <Scene shop={shop} owner={owner}>
            <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-6xl shop-bop">🧑‍🍳</span>
          </Scene>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <GameButton color="violet" onClick={onDecor} className="py-3">🛠️ 가게 꾸미기</GameButton>
          <GameButton color="blue" onClick={onBook} className="py-3">📖 손님 도감 {met}/{CUSTOMERS.length}</GameButton>
        </div>

        <div className="mt-4 rounded-[1.25rem] bg-white/90 p-3 shadow">
          <div className="px-1 text-sm font-black text-amber-900">오늘 팔 물건 고르기 <span className="font-bold text-amber-700/70">(배운 차시)</span></div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {LESSONS.map((l) => (
              <button
                key={l.type}
                type="button"
                onClick={() => onOpen(l)}
                className="rounded-xl bg-amber-50 px-3 py-2 text-left ring-1 ring-amber-200 transition hover:bg-amber-100 active:scale-[0.98]"
              >
                <span className="text-xs font-black text-orange-600">{l.lesson}</span>
                <span className="block text-sm font-black text-slate-800">{l.name}</span>
                <span className="block text-[11px] font-bold text-slate-500">예) {l.ex}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs font-bold text-amber-900/60">
          장사한 날 {shop.days}일 · 손님 {shop.served}명 · 총 매출 {show(shop.sales)}G
        </p>
      </div>
    </div>
  )
}

// ─── 꾸미기 상점 ───
function DecorShop({ shop, onBuy, onClose }) {
  const next = LEVELS[shop.level + 1]
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[1.5rem] bg-white p-4 shadow-2xl">
        <div className="flex items-center">
          <h2 className="text-xl font-black text-slate-800">🛠️ 가게 꾸미기</h2>
          <span className="ml-auto rounded-full bg-amber-900 px-3 py-1 text-sm font-black text-amber-50">🪙 {shop.coins}</span>
        </div>
        <p className="mt-1 text-xs font-bold text-slate-500">꾸밀수록 손님이 코인을 더 줘요 (꾸미기 하나에 +1, 가게 단계마다 더 많이)</p>
        {next && (
          <button
            type="button"
            disabled={shop.coins < next.cost}
            onClick={() => onBuy({ level: shop.level + 1, cost: next.cost })}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl p-3 text-left text-white shadow disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${next.wall[1]}, ${next.awning?.[0] || '#f59e0b'})` }}
          >
            <span className="text-3xl">🏗️</span>
            <span className="flex-1">
              <span className="block text-xs font-black text-white/85">가게 넓히기</span>
              <span className="block text-lg font-black">{LEVELS[shop.level].name} → {next.name}</span>
              <span className="block text-[11px] font-bold text-white/90">손님이 주는 코인 +{next.bonus}</span>
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 font-black text-slate-800">🪙 {next.cost}</span>
          </button>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DECOR.map((d) => {
            const own = shop.decor.includes(d.id)
            const locked = d.need && shop.level < d.need
            return (
              <button
                key={d.id}
                type="button"
                disabled={own || locked || shop.coins < d.cost}
                onClick={() => onBuy({ decor: d.id, cost: d.cost })}
                className={`rounded-2xl p-2.5 text-center ring-1 transition ${own ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200 disabled:opacity-60'}`}
              >
                <div className="text-4xl">{locked ? '🔒' : d.icon}</div>
                <div className="text-sm font-black text-slate-800">{d.name}</div>
                <div className="text-xs font-black text-slate-500">{own ? '✔ 꾸몄어요' : locked ? `${LEVELS[d.need].name}부터` : `🪙 ${d.cost}`}</div>
              </button>
            )
          })}
        </div>
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

// ─── 하루 장사 ───
function Day({ lesson, shop, owner, onFinish, onQuit }) {
  const [n, setN] = useState(0) // 몇 번째 손님
  const [order, setOrder] = useState(() => makeOrder(lesson.type, { met: shop.met, vipChance: 0.08 + shop.level * 0.03 }))
  const [input, setInput] = useState('')
  const [tries, setTries] = useState(0)
  const [helper, setHelper] = useState(false)
  const [state, setState] = useState('ask') // ask | paid | explain
  const [streak, setStreak] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [earned, setEarned] = useState(null) // 방금 받은 코인
  const [day, setDay] = useState({ coins: 0, sales: D(0), right: 0, first: 0, best: 0, met: {} })
  const startAt = useRef(Date.now())
  const regRef = useRef(null)
  const coinRef = useRef(null)
  const custRef = useRef(null)
  const patience = patienceOf(lesson.type)
  const mood = moodOf(elapsed, patience)

  useEffect(() => {
    if (import.meta.env.DEV) window.__shopOrder = order
  }, [order])

  useEffect(() => {
    if (state !== 'ask') return
    const t = setInterval(() => setElapsed((Date.now() - startAt.current) / 1000), 500)
    return () => clearInterval(t)
  }, [state, n])

  // 손님 도착 — 도감에 기록, VIP·희귀 손님은 반짝
  useEffect(() => {
    setDay((d) => ({ ...d, met: { ...d.met, [order.customer.emoji]: (d.met[order.customer.emoji] || 0) + 1 } }))
    if (order.vip || order.customer.rare) setTimeout(() => burstAt(custRef.current, { count: 30 }), 350)
    sfx.card?.()
  }, [order])

  function key(k) {
    if (state !== 'ask') return
    setInput((s) => {
      if (k === '⌫') return s.slice(0, -1)
      if (k === '.') return s.includes('.') || s.length >= 10 ? s : (s || '0') + '.'
      if (s.length >= 10) return s
      return s === '0' ? k : s + k
    })
  }

  function pay() {
    if (state !== 'ask' || !input) return
    const r = grade(order, input)
    if (r === 'invalid') return
    if (r === 'correct') {
      const firstTry = tries === 0
      const s = firstTry ? streak + 1 : 0
      const c = coinsFor({ firstTry, mood, helper, vip: order.vip, streak: s, level: shop.level, decorCount: shop.decor.length })
      setStreak(s)
      setEarned(c)
      setState('paid')
      sfx.correct()
      setDay((d) => ({ ...d, coins: d.coins + c, sales: addD(d.sales, order.answer), right: d.right + 1, first: d.first + (firstTry ? 1 : 0), best: Math.max(d.best, s) }))
      flyCoins(regRef.current, coinRef.current, { count: Math.min(12, Math.ceil(c / 2)), onEach: (i) => sfx.coinTick?.(i) })
      if (s >= 3) cheer(Math.min(s, 6), custRef.current)
      setTimeout(next, 1700)
      return
    }
    // 틀림
    sfx.wrong()
    setStreak(0)
    if (tries === 0) {
      setTries(1)
      setHelper(true)
      setInput('')
    } else {
      setState('explain')
    }
  }

  function next() {
    const k = n + 1
    if (k >= CUSTOMERS_PER_DAY) {
      setState('done')
      return
    }
    setN(k)
    setOrder(makeOrder(lesson.type, { met: { ...shop.met, ...day.met }, vipChance: 0.08 + shop.level * 0.03 }))
    setInput('')
    setTries(0)
    setHelper(false)
    setEarned(null)
    setElapsed(0)
    startAt.current = Date.now()
    setState('ask')
  }

  // 키보드로도
  useEffect(() => {
    const onKey = (e) => {
      if (state === 'explain' && e.key === 'Enter') return next()
      if (state !== 'ask') return
      if (/^[0-9]$/.test(e.key)) key(e.key)
      else if (e.key === '.' || e.key === ',') key('.')
      else if (e.key === 'Backspace') key('⌫')
      else if (e.key === 'Enter') pay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  useEffect(() => {
    if (state === 'done') {
      sfx.victory()
      onFinish(day)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const face = state === 'paid' ? '😍' : state === 'explain' || tries > 0 ? '🤔' : MOOD_FACE[mood]
  const bubble =
    state === 'paid' ? (order.vip ? '역시 최고의 가게! 팁 두 배예요! 👑' : '고마워요! 또 올게요~') :
    state === 'explain' ? '제가 계산해 볼게요. 이렇게요!' :
    tries > 0 ? '어? 계산이 좀 이상한데… 다시 해 주실래요?' : order.say

  return (
    <div className="min-h-[100dvh] shop-bg safe-padded flex flex-col items-center px-3 pt-3 pb-6">
      <div className="w-full max-w-xl">
        {/* 위 */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onQuit} className="h-9 w-9 shrink-0 rounded-full bg-amber-900/15 font-black text-amber-900" aria-label="그만하기">✕</button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black text-amber-950">{lesson.lesson} · {lesson.name}</div>
            <div className="mt-1 flex gap-1">
              {Array.from({ length: CUSTOMERS_PER_DAY }, (_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-full ${i < n ? 'bg-emerald-500' : i === n ? 'bg-amber-500' : 'bg-amber-900/15'}`} />
              ))}
            </div>
          </div>
          <SoundMini />
          <span ref={coinRef} className="shrink-0 rounded-full bg-amber-900 px-3 py-1 text-sm font-black text-amber-50 tabular-nums">🪙 {shop.coins + day.coins}</span>
        </div>

        {/* 가게 장면 + 손님 */}
        <div className="mt-2">
          <Scene shop={shop} owner={owner}>
            {/* 오늘 파는 물건 (선반) */}
            <div className="absolute left-1/2 top-[19%] flex -translate-x-1/2 gap-3 text-3xl">
              <span>{order.icon}</span><span>{order.icon}</span><span>{order.icon}</span>
            </div>
            <div className="absolute left-3 top-[44%] rotate-[-4deg] rounded-lg bg-white px-2 py-1 text-sm font-black text-rose-600 shadow ring-2 ring-rose-200">
              🏷️ {order.item} {order.tag}
            </div>
            {/* 손님 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={n}
                ref={custRef}
                initial={{ x: 220, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -220, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 18 }}
                className="absolute bottom-8 right-[8%] flex flex-col items-center"
              >
                <div className={`relative text-[4.5rem] leading-none sm:text-[5.5rem] ${state === 'paid' ? 'shop-hop' : 'shop-bop'}`}>
                  {order.customer.emoji}
                  {order.vip && <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl">👑</span>}
                  <span className="absolute -right-2 -top-1 text-2xl">{face}</span>
                </div>
                <div className={`text-xs font-black ${order.customer.rare ? 'text-fuchsia-700' : 'text-amber-950/70'}`}>
                  {order.customer.rare ? '✨ ' : ''}{order.customer.name} 손님{order.vip ? ' · VIP' : ''}
                </div>
              </motion.div>
            </AnimatePresence>
            {/* 말풍선 */}
            <motion.div
              key={`${n}-${state}-${tries}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute right-[5%] top-[30%] max-w-[55%] rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-lg sm:text-base"
            >
              {bubble}
              <span className="absolute -bottom-2 right-10 h-4 w-4 rotate-45 bg-white" />
            </motion.div>
            <span ref={regRef} className="absolute bottom-9 left-[38%] text-4xl">🧾</span>
            {earned != null && (
              <span className="shop-pop absolute bottom-24 left-[34%] text-2xl font-black text-amber-600 drop-shadow">+{earned}🪙</span>
            )}
          </Scene>
        </div>

        {/* 계산서 */}
        <div className="mt-3 rounded-[1.4rem] bg-white p-3 shadow-xl sm:p-4">
          <div className="flex items-center justify-between text-xs font-black text-slate-500">
            <span>🧾 계산서 · {order.item} {order.qty}</span>
            {streak >= 2 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-white combo-flame">🔥 {streak}연속</span>}
          </div>
          {order.given && (
            <div className="mt-1 text-center text-xs font-black text-slate-500">
              📒 점원 노트: <span className="rounded bg-yellow-100 px-1.5 py-0.5 tabular-nums text-slate-700">{order.given}</span>
            </div>
          )}
          <div className="mt-1 text-center font-black text-slate-800 tabular-nums shop-expr">
            {order.price} × {show(order.b)} =
          </div>
          <div className="mx-auto mt-1 flex max-w-[18rem] items-center gap-2">
            <div
              className={`flex h-14 flex-1 items-center justify-end rounded-2xl border-4 px-3 text-3xl font-black tabular-nums ${
                state === 'paid' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : input ? 'border-amber-400 bg-amber-50 text-slate-900' : 'border-dashed border-slate-300 text-slate-300'
              }`}
            >
              {state === 'paid' ? show(order.answer) : input || '0'}
            </div>
            <span className="text-2xl font-black text-amber-700">G</span>
          </div>
          {helper && state === 'ask' && (
            <div className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-center text-sm font-bold text-sky-900">💡 {order.helper}</div>
          )}
          <div className="mt-2.5">
            <Keypad onKey={key} disabled={state !== 'ask'} />
          </div>
          <div className="mt-2.5 flex gap-2">
            {!helper && (
              <button
                type="button"
                disabled={state !== 'ask'}
                onClick={() => setHelper(true)}
                className="shrink-0 rounded-2xl bg-sky-100 px-3 text-sm font-black text-sky-800 disabled:opacity-50"
                title="코인을 조금 덜 받아요"
              >
                💡 도우미
              </button>
            )}
            <GameButton color={input && state === 'ask' ? 'green' : 'gray'} disabled={!input || state !== 'ask'} onClick={pay} className="flex-1 py-3 text-xl">
              💳 계산하기
            </GameButton>
          </div>
        </div>
      </div>

      {/* 두 번 틀렸을 때 — 풀이 */}
      <AnimatePresence>
        {state === 'explain' && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/35 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} className="w-full max-w-md rounded-[1.5rem] bg-white p-5 shadow-2xl">
              <div className="text-center text-lg font-black text-slate-700">{order.customer.emoji} {order.customer.name} 손님이 알려 줬어요</div>
              <div className="mt-2 text-center text-2xl font-black text-slate-800 tabular-nums">
                {order.price} × {show(order.b)} = <span className="text-emerald-600">{show(order.answer)}G</span>
              </div>
              <ol className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-[0.95rem] font-bold leading-relaxed text-amber-950">
                {order.steps.map((s, i) => (
                  <li key={i}>✏️ {s}</li>
                ))}
              </ol>
              <GameButton color="violet" onClick={next} className="mt-4 w-full py-3 text-xl">알겠어요! 다음 손님 →</GameButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DaySummary({ result, shop, onDecor, onAgain, onLobby }) {
  const stars = result.first >= 7 ? 3 : result.first >= 5 ? 2 : result.right >= 4 ? 1 : 0
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/60 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }} className="w-full max-w-sm text-center">
        <div className="drill-levelup font-black leading-none">장사 끝!</div>
        <div className="mt-2 text-5xl">
          {[1, 2, 3].map((i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25 + i * 0.2, type: 'spring' }} className={i <= stars ? 'text-amber-300 drop-shadow' : 'text-white/25'}>★</motion.span>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4 text-slate-800 shadow-xl">
          <div className="text-sm font-black text-slate-500">오늘 매출</div>
          <div className="text-3xl font-black tabular-nums">{show(result.sales)}G</div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-sm font-black">
            <div className="rounded-xl bg-amber-50 py-1.5 text-amber-700">🪙 +{result.coins}</div>
            <div className="rounded-xl bg-emerald-50 py-1.5 text-emerald-700">⭕ {result.first}/{CUSTOMERS_PER_DAY}</div>
            <div className="rounded-xl bg-orange-50 py-1.5 text-orange-600">🔥 {result.best}</div>
          </div>
          <div className="mt-2 text-xs font-bold text-slate-500">⭕ = 한 번에 맞힌 손님 · 🔥 = 최고 연속</div>
          {LEVELS[shop.level + 1] && (
            <div className="mt-2 text-sm font-bold text-violet-700">
              {shop.coins >= LEVELS[shop.level + 1].cost
                ? `🏗️ ${LEVELS[shop.level + 1].name}(으)로 넓힐 수 있어요!`
                : `${LEVELS[shop.level + 1].name}까지 🪙 ${LEVELS[shop.level + 1].cost - shop.coins}`}
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-2">
          <GameButton color="violet" onClick={onDecor} className="w-full py-3 text-lg">🛠️ 가게 꾸미러 가기</GameButton>
          <GameButton color="green" onClick={onAgain} className="w-full py-3 text-lg">🌅 다음 날 장사 (같은 물건)</GameButton>
          <GameButton color="gray" onClick={onLobby} className="w-full py-2.5">물건 바꾸기</GameButton>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DecimalShop({ onBack }) {
  useHideSoundToggle() // 왼쪽 아래 소리 버튼 대신 위 띠의 작은 버튼
  const me = useAccount((s) => s.me)
  const who = me?.username ? `acct:${me.username}` : 'device'
  const owner = me ? me.name || me.username : '나'
  const [shop, setShop] = useState(() => loadShop(who))
  const [lesson, setLesson] = useState(null)
  const [dayKey, setDayKey] = useState(0)
  const [summary, setSummary] = useState(null)
  const [modal, setModal] = useState(null) // decor | book

  useEffect(() => setShop(loadShop(who)), [who])

  function update(fn) {
    setShop((cur) => {
      const n = fn(cur)
      saveShop(who, n)
      return n
    })
  }

  function finishDay(r) {
    update((s) => {
      const met = { ...s.met }
      for (const [e, c] of Object.entries(r.met)) met[e] = (met[e] || 0) + c
      return {
        ...s,
        coins: s.coins + r.coins,
        met,
        days: s.days + 1,
        served: s.served + CUSTOMERS_PER_DAY,
        correct: s.correct + r.right,
        bestDay: Math.max(s.bestDay, r.coins),
        sales: addD(s.sales, r.sales),
      }
    })
    setSummary(r)
  }

  function buy({ decor, level, cost }) {
    if (shop.coins < cost) return
    sfx.coin()
    if (level != null) setTimeout(() => cheer(4), 100)
    update((s) => (level != null ? { ...s, coins: s.coins - cost, level } : { ...s, coins: s.coins - cost, decor: [...s.decor, decor] }))
  }

  const modals = (
    <AnimatePresence>
      {modal === 'decor' && <DecorShop shop={shop} onBuy={buy} onClose={() => setModal(null)} />}
      {modal === 'book' && <CustomerBook shop={shop} onClose={() => setModal(null)} />}
    </AnimatePresence>
  )

  if (!lesson)
    return (
      <>
        <Lobby
          shop={shop}
          owner={owner}
          onBack={onBack}
          onOpen={(l) => { setLesson(l); setDayKey((k) => k + 1) }}
          onDecor={() => setModal('decor')}
          onBook={() => setModal('book')}
        />
        {modals}
      </>
    )

  return (
    <>
      <Day key={dayKey} lesson={lesson} shop={shop} owner={owner} onFinish={finishDay} onQuit={() => { setLesson(null); setSummary(null) }} />
      <AnimatePresence>
        {summary && (
          <DaySummary
            result={summary}
            shop={shop}
            onDecor={() => { setSummary(null); setLesson(null); setModal('decor') }}
            onAgain={() => { setSummary(null); setDayKey((k) => k + 1) }}
            onLobby={() => { setSummary(null); setLesson(null) }}
          />
        )}
      </AnimatePresence>
      {modals}
    </>
  )
}
