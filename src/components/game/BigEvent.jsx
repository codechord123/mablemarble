// 큰 사건 연출 — 통행료, 땅 구매, 건설, 호텔 완성, 통행료 면제, 파산.
// 예전에는 이런 순간도 작은 토스트나 결과 문장 한 줄로 지나갔다. 게임에서
// 가장 감정이 크게 움직이는 순간이 평범한 알림과 같은 강도였던 셈이다.
// 화면 가운데에 큰 글자를 찍고, 뒤로 빛줄기가 돌고, 동전이 쏟아진다.

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { sfx } from '../../utils/sounds.js'
import { ROUND_EVENTS } from '../../utils/rules.js'

const KINDS = {
  toll: {
    title: () => '통행료!',
    sub: (e) => `−${e.amount.toLocaleString()}원`,
    line: (e) => `${e.payer} → ${e.receiver}`,
    fill: '#fca5a5', deep: '#991b1b', ray: 'rgba(239, 68, 68, 0.22)',
    coins: ['#fcd34d', '#f59e0b', '#fde68a'], burst: 90, ms: 1800,
  },
  saved: {
    title: () => '통행료 면제!',
    sub: (e) => `${e.amount.toLocaleString()}원 아꼈어요`,
    line: (e) => e.tileName,
    fill: '#86efac', deep: '#166534', ray: 'rgba(34, 197, 94, 0.2)',
    coins: ['#86efac', '#fcd34d'], burst: 60, ms: 1500,
  },
  buy: {
    title: () => '내 땅!',
    sub: (e) => e.tileName,
    line: () => '',
    fill: '#bbf7d0', deep: '#166534', ray: 'rgba(34, 197, 94, 0.18)',
    coins: ['#4ade80', '#fcd34d'], burst: 45, ms: 1300,
  },
  build: {
    title: (e) => `${e.label} 건설!`,
    sub: (e) => e.tileName,
    line: () => '',
    fill: '#bae6fd', deep: '#075985', ray: 'rgba(14, 165, 233, 0.2)',
    coins: ['#38bdf8', '#fcd34d'], burst: 55, ms: 1400,
  },
  hotel: {
    title: () => '호텔 완성!',
    sub: (e) => e.tileName,
    line: () => '통행료가 가장 비싸졌어요',
    fill: '#fde047', deep: '#92400e', ray: 'rgba(250, 204, 21, 0.3)',
    coins: ['#fde047', '#f59e0b', '#fef3c7', '#ef4444'], burst: 160, ms: 2000,
  },
  monopoly: {
    title: () => '라인 독점!',
    sub: (e) => e.owner,
    line: () => '👑 이 줄 도시 통행료 2배!',
    fill: '#fde047', deep: '#7c2d12', ray: 'rgba(250, 204, 21, 0.32)',
    coins: ['#fde047', '#f59e0b', '#fbbf24', '#fef3c7'], burst: 180, ms: 2200,
  },
  round: {
    title: (e) => `${ROUND_EVENTS[e.eventKind]?.icon} ${ROUND_EVENTS[e.eventKind]?.title}`,
    sub: (e) => `${e.round}라운드 이벤트`,
    line: (e) => ROUND_EVENTS[e.eventKind]?.desc(e),
    fill: '#f9a8d4', deep: '#831843', ray: 'rgba(236, 72, 153, 0.22)',
    coins: ['#f9a8d4', '#fde047', '#a5f3fc'], burst: 120, ms: 2300,
  },
  bankrupt: {
    title: () => '파산!',
    sub: (e) => e.names.join(', '),
    line: () => '가진 도시를 모두 내놓았어요',
    fill: '#e5e7eb', deep: '#1f2937', ray: 'rgba(31, 41, 55, 0.25)',
    coins: ['#9ca3af', '#6b7280'], burst: 40, ms: 2000,
  },
}

export default function BigEvent({ event, onDone }) {
  const reduce = useReducedMotion()
  const k = event ? KINDS[event.kind] : null

  useEffect(() => {
    // 모르는 연출이면 바로 끝낸다 — 끝을 알리지 않으면 굴리기가 잠긴 채로 남는다
    if (event && !k) { onDone(); return }
    if (!event || !k) return
    if (event.kind === 'hotel' || event.kind === 'monopoly') sfx.victory()
    else if (event.kind === 'round') sfx.card()
    else if (event.kind === 'toll' || event.kind === 'buy' || event.kind === 'build') sfx.coin()
    else if (event.kind === 'saved') sfx.correct()

    if (!reduce) {
      // 글자가 찍히는 순간에 맞춰 동전이 터진다
      const t = setTimeout(() => {
        confetti({
          particleCount: k.burst,
          spread: event.kind === 'bankrupt' ? 50 : 100,
          startVelocity: event.kind === 'toll' ? 38 : 32,
          gravity: 1.1,
          scalar: 1.15,
          ticks: 160,
          origin: { x: 0.5, y: 0.45 },
          colors: k.coins,
          shapes: ['circle'],
          disableForReducedMotion: true,
        })
      }, 180)
      const done = setTimeout(onDone, k.ms)
      return () => { clearTimeout(t); clearTimeout(done) }
    }
    const done = setTimeout(onDone, Math.min(k.ms, 1200))
    return () => clearTimeout(done)
  }, [event?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {event && k && (
        <motion.div
          key={event.key}
          className="fixed inset-0 z-[45] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          aria-live="assertive"
          role="status"
        >
          {/* 가장자리를 살짝 어둡게 — 가운데로 시선을 모은다 */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 30%, rgba(69,26,3,0.28) 100%)' }}
          />

          {/* 뒤에서 도는 빛줄기 */}
          {!reduce && (
            <motion.div
              className="absolute"
              style={{
                width: 'min(140vw, 1100px)',
                aspectRatio: '1',
                background: `repeating-conic-gradient(${k.ray} 0deg 9deg, transparent 9deg 22deg)`,
                maskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
                WebkitMaskImage: 'radial-gradient(circle, black 18%, transparent 62%)',
              }}
              initial={{ scale: 0.4, rotate: 0 }}
              animate={{ scale: 1, rotate: 40 }}
              transition={{ duration: k.ms / 1000, ease: 'easeOut' }}
            />
          )}

          <motion.div
            className="relative flex flex-col items-center text-center px-4"
            initial={reduce ? { opacity: 0 } : { scale: 0.2, rotate: -10, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { scale: [0.2, 1.18, 0.96, 1], rotate: [-10, 4, -1, 0], opacity: 1 }}
            exit={{ scale: 1.08, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div
              className="font-black leading-none whitespace-nowrap"
              style={{
                fontSize: 'clamp(3rem, 15vw, 7rem)',
                letterSpacing: '-0.03em',
                color: k.fill,
                WebkitTextStroke: `4px ${k.deep}`,
                paintOrder: 'stroke fill',
                textShadow: `0 3px 0 ${k.deep}, 0 6px 0 ${k.deep}, 0 14px 22px rgba(0,0,0,0.35)`,
              }}
            >
              {k.title(event)}
            </div>
            {k.sub(event) && (
              <div
                className="mt-2 font-extrabold tabular-nums"
                style={{
                  fontSize: 'clamp(1.5rem, 7vw, 3rem)',
                  // 흰 글자에 진한 테두리였더니 밝은 배경에서 속이 빈 글자처럼 보였다.
                  // 진한 글자 + 흰 테두리로 뒤집어 어떤 배경에서도 읽히게 한다.
                  color: k.deep,
                  WebkitTextStroke: '5px #fff',
                  paintOrder: 'stroke fill',
                  textShadow: '0 4px 10px rgba(0,0,0,0.25)',
                }}
              >
                {k.sub(event)}
              </div>
            )}
            {k.line(event) && (
              <div
                className="mt-2 px-4 py-1.5 rounded-full font-bold text-sm sm:text-base"
                style={{ background: 'rgba(255,255,255,0.92)', color: k.deep, boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
              >
                {k.line(event)}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
