// 분수 곱셈 수련장 — 혼자 하는 연습 미니게임.
// 문제를 맞힐수록 경험치가 쌓여 레벨이 오르고, 레벨마다 새 유형이 열린다.
// 기록은 기기에 '이름 + 캐릭터'로 저장되어 다음에 이어서 할 수 있다.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  makeProblem, grade, levelFromXp, xpFor, titleFor, TOPICS, MAX_TOPIC_LEVEL,
} from '../../utils/fractionDrill.js'
import { listProfiles, loadProfile, saveProfile } from '../../utils/drillProfiles.js'
import { sfx } from '../../utils/sounds.js'
import AnimalFace, { ANIMAL_KEYS, animalLabel } from '../ui/AnimalFace.jsx'
import FractionInput from '../ui/FractionInput.jsx'
import GameButton from '../ui/GameButton.jsx'
import MathText from '../ui/MathText.jsx'

const SPEED_FAST = 10 // 이 시간 안에 풀면 빠르기 보너스 +10 (20초 안이면 +5)

// ─── 로비: 누가 할지 고르고, 명예의 전당을 본다 ───
function Lobby({ onStart, onBack }) {
  const profiles = useMemo(() => listProfiles(), [])
  const [avatar, setAvatar] = useState(ANIMAL_KEYS[0])
  const [name, setName] = useState('')
  const canStart = name.trim().length > 0

  return (
    <div className="min-h-[100dvh] drill-bg safe-padded flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-md">
        <button type="button" onClick={onBack} className="text-white/80 font-bold text-sm mb-3">← 메인 메뉴</button>

        <div className="text-center text-white mb-5">
          <div className="text-5xl drop-shadow">🧮</div>
          <h1 className="text-3xl font-black mt-1 drill-title">분수 곱셈 수련장</h1>
          <p className="text-white/85 font-semibold mt-1">문제를 맞히면 경험치가 쌓여 레벨이 올라요!</p>
        </div>

        <div className="drill-card rounded-[1.5rem] p-5">
          <div className="font-black text-slate-700 mb-2">누가 할까요?</div>
          <div className="grid grid-cols-5 gap-2">
            {ANIMAL_KEYS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                aria-label={animalLabel(a)}
                className={`aspect-square rounded-2xl flex items-center justify-center transition ${
                  avatar === a ? 'bg-violet-100 ring-4 ring-violet-500 scale-105' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <AnimalFace emoji={a} className="w-[86%] h-[86%]" />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canStart && onStart(name, avatar)}
            maxLength={10}
            placeholder="이름을 써 주세요"
            className="mt-3 w-full px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 outline-none text-lg font-bold"
          />
          <GameButton
            color={canStart ? 'violet' : 'gray'}
            disabled={!canStart}
            onClick={() => onStart(name, avatar)}
            className="w-full mt-3 py-3.5 text-xl"
          >
            ▶ 수련 시작
          </GameButton>
        </div>

        {profiles.length > 0 && (
          <div className="drill-card rounded-[1.5rem] p-5 mt-4">
            <div className="font-black text-slate-700 mb-2">🏆 명예의 전당 <span className="text-xs text-slate-400 font-bold">눌러서 이어 하기</span></div>
            <ol className="grid gap-1.5">
              {profiles.slice(0, 10).map((p, i) => {
                const { level } = levelFromXp(p.xp)
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onStart(p.name, p.avatar)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 text-left"
                    >
                      <span className="w-6 text-center font-black text-slate-400">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                      <span className="h-9 w-9 shrink-0"><AnimalFace emoji={p.avatar} className="w-full h-full" /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-black text-slate-800 truncate">{p.name}</span>
                        <span className="block text-xs font-bold text-slate-500">{titleFor(level)} · 정답 {p.correct}개</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-violet-600 text-white text-sm font-black">Lv.{level}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 레벨 업 연출 ───
function LevelUp({ info, onClose }) {
  useEffect(() => {
    sfx.victory()
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 }, disableForReducedMotion: true })
  }, [])
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-violet-950/70 backdrop-blur-sm flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="text-center"
      >
        <div className="drill-levelup font-black leading-none">LEVEL UP!</div>
        <div className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-violet-700 text-3xl font-black shadow-xl">
          Lv.{info.level}
        </div>
        <div className="mt-2 text-white text-xl font-black">{titleFor(info.level)}</div>
        {info.newTopic && (
          <div className="mt-4 mx-auto max-w-xs px-4 py-3 rounded-2xl bg-white/95 shadow-xl">
            <div className="text-xs font-black text-violet-500">새 문제 유형이 열렸어요</div>
            <div className="text-lg font-black text-slate-800">{info.newTopic}</div>
          </div>
        )}
        <GameButton color="amber" onClick={onClose} className="mt-6 px-10 py-3 text-xl">계속하기</GameButton>
      </motion.div>
    </motion.div>
  )
}

// ─── 문제 풀기 ───
function Play({ profile: initial, onExit }) {
  const [profile, setProfile] = useState(initial)
  const { level, into, need } = levelFromXp(profile.xp)
  const [problem, setProblem] = useState(() => makeProblem(level))
  const [qKey, setQKey] = useState(0)
  const [value, setValue] = useState({ str: '', valid: false })
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState(null) // { kind, gain? }
  const [levelUp, setLevelUp] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(Date.now())

  // 개발 모드에서만 — 브라우저 테스트가 지금 문제의 답을 알 수 있게
  useEffect(() => {
    if (import.meta.env.DEV) window.__drillProblem = problem
  }, [problem])

  // 문제마다 시간 재기 (빠르기 보너스 안내용)
  useEffect(() => {
    startedAt.current = Date.now()
    setElapsed(0)
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [qKey])

  const nextProblem = useCallback((lv) => {
    setProblem(makeProblem(lv))
    setFeedback(null)
    setValue({ str: '', valid: false })
    setQKey((k) => k + 1)
  }, [])

  const submit = () => {
    if (feedback || !value.valid) return
    const result = grade(problem, value.str)
    if (result === 'unreduced') {
      sfx.select()
      setFeedback({ kind: 'unreduced' })
      return
    }
    const seconds = (Date.now() - startedAt.current) / 1000
    if (result === 'correct') {
      sfx.correct()
      const s = streak + 1
      const gain = xpFor({ seconds, streak: s })
      const next = {
        ...profile,
        xp: profile.xp + gain.total,
        solved: profile.solved + 1,
        correct: profile.correct + 1,
        bestStreak: Math.max(profile.bestStreak, s),
      }
      setStreak(s)
      setProfile(next)
      saveProfile(next)
      setFeedback({ kind: 'correct', gain })
      const after = levelFromXp(next.xp).level
      if (after > level) {
        const newTopic = after <= MAX_TOPIC_LEVEL ? TOPICS[after - 1].name : null
        setTimeout(() => setLevelUp({ level: after, newTopic }), 700)
      }
    } else {
      sfx.wrong()
      const next = { ...profile, solved: profile.solved + 1 }
      setStreak(0)
      setProfile(next)
      saveProfile(next)
      setFeedback({ kind: 'wrong' })
    }
  }

  // 정답이면 잠깐 보여 주고 다음 문제로 (레벨 업 창이 뜨면 기다린다)
  useEffect(() => {
    if (feedback?.kind !== 'correct' || levelUp) return
    const t = setTimeout(() => nextProblem(levelFromXp(profile.xp).level), 1300)
    return () => clearTimeout(t)
  }, [feedback, levelUp, profile.xp, nextProblem])

  const retry = () => {
    setFeedback(null)
    setValue({ str: '', valid: false })
    setQKey((k) => k + 1)
  }

  const accuracy = profile.solved ? Math.round((profile.correct / profile.solved) * 100) : null
  const isNewTopic = level <= MAX_TOPIC_LEVEL && problem.topic === TOPICS[level - 1].id && level > 1

  return (
    <div className="min-h-[100dvh] drill-bg safe-padded flex flex-col items-center px-3 py-3 sm:py-6">
      <div className="w-full max-w-lg">
        {/* 상단: 나 · 레벨 · 경험치 · 연속 */}
        <div className="drill-card rounded-[1.25rem] px-3 py-2.5 flex items-center gap-2.5">
          <button type="button" onClick={onExit} className="shrink-0 h-9 w-9 rounded-full bg-slate-100 text-slate-500 font-black" aria-label="나가기">✕</button>
          <span className="h-11 w-11 shrink-0"><AnimalFace emoji={profile.avatar} className="w-full h-full" /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-sm font-black">Lv.{level}</span>
              <span className="font-black text-slate-800 truncate">{profile.name}</span>
              <span className="text-xs font-bold text-violet-500 truncate">{titleFor(level)}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-slate-200 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                animate={{ width: `${Math.round((into / need) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              />
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-slate-400 tabular-nums">
              경험치 {into} / {need} · 정답 {profile.correct}개{accuracy !== null ? ` · 정답률 ${accuracy}%` : ''}
            </div>
          </div>
          {streak >= 2 && (
            <span className={`shrink-0 px-2 py-1 rounded-full font-black text-sm ${streak >= 3 ? 'bg-orange-500 text-white combo-flame' : 'bg-orange-100 text-orange-600'}`}>
              🔥{streak}
            </span>
          )}
        </div>

        {/* 문제 카드 */}
        <div className="drill-card rounded-[1.5rem] mt-3 p-4 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-black">{problem.topicName}</span>
              {isNewTopic && <span className="px-2 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black">NEW</span>}
            </div>
            <span className={`text-xs font-black tabular-nums ${elapsed < SPEED_FAST ? 'text-emerald-600' : elapsed < 20 ? 'text-amber-600' : 'text-slate-400'}`}>
              ⏱ {elapsed}초 {elapsed < SPEED_FAST ? '· 빠르기 +10' : elapsed < 20 ? '· 빠르기 +5' : ''}
            </span>
          </div>

          <div key={`expr-${qKey}`} className="drill-expr text-center font-black text-slate-800 my-4 sm:my-6 tabular-nums">
            <MathText>{`${problem.text} =`}</MathText>
          </div>

          <FractionInput key={`input-${qKey}`} mode="fraction" onValueChange={(str, valid) => setValue({ str, valid })} onEnter={submit} />

          <GameButton
            color={value.valid && !feedback ? 'violet' : 'gray'}
            disabled={!value.valid || !!feedback}
            onClick={submit}
            className="w-full mt-3 py-3.5 text-xl"
          >
            확인
          </GameButton>

          {/* 결과 */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                key={feedback.kind + qKey}
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className={`absolute inset-x-0 bottom-0 p-4 sm:p-5 rounded-t-[1.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.15)] ${
                  feedback.kind === 'correct' ? 'bg-emerald-50' : feedback.kind === 'unreduced' ? 'bg-amber-50' : 'bg-rose-50'
                }`}
              >
                {feedback.kind === 'correct' && (
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-600">⭕ 정답!</div>
                    <div className="mt-2 flex justify-center gap-1.5 flex-wrap text-sm font-black">
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white">+{feedback.gain.total} 경험치</span>
                      {feedback.gain.speed > 0 && <span className="px-2.5 py-1 rounded-full bg-white text-emerald-700">⚡ 빠르기 +{feedback.gain.speed}</span>}
                      {feedback.gain.combo > 0 && <span className="px-2.5 py-1 rounded-full bg-white text-orange-600">🔥 연속 +{feedback.gain.combo}</span>}
                    </div>
                  </div>
                )}
                {feedback.kind === 'unreduced' && (
                  <div className="text-center">
                    <div className="text-2xl font-black text-amber-600">값은 맞았어요! 👍</div>
                    <div className="mt-1 font-bold text-amber-800">약분까지 해서 가장 간단하게 써 볼까요?</div>
                    <GameButton color="amber" onClick={retry} className="mt-3 w-full py-3 text-lg">다시 쓰기</GameButton>
                  </div>
                )}
                {feedback.kind === 'wrong' && (
                  <div>
                    <div className="text-center text-2xl font-black text-rose-600">❌ 아쉬워요</div>
                    <div className="mt-2 text-center text-lg font-black text-slate-800">
                      정답 <span className="text-emerald-700 text-2xl"><MathText>{problem.answer}</MathText></span>
                    </div>
                    <div className="mt-2 p-3 rounded-xl bg-white text-slate-700 font-semibold leading-relaxed text-[0.95rem]">
                      {problem.explanation.conversions.length > 0 && (
                        <div>💡 <MathText>{problem.explanation.conversions.join(', ')}</MathText> (가분수로 고쳐요)</div>
                      )}
                      <div>✏️ <MathText>{problem.explanation.steps}</MathText></div>
                    </div>
                    <GameButton color="violet" onClick={() => nextProblem(level)} className="mt-3 w-full py-3 text-lg">다음 문제 →</GameButton>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 text-center text-white/80 text-xs font-bold">
          대분수는 자연수 → 분모 → 분자 순서로 써요 · 답은 약분해서 가장 간단하게
        </div>
      </div>

      <AnimatePresence>
        {levelUp && (
          <LevelUp
            info={levelUp}
            onClose={() => { setLevelUp(null); nextProblem(levelUp.level) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FractionDrill({ onBack }) {
  const [profile, setProfile] = useState(null)
  if (!profile) {
    return <Lobby onBack={onBack} onStart={(name, avatar) => setProfile(loadProfile(name, avatar))} />
  }
  return <Play profile={profile} onExit={() => setProfile(null)} />
}
