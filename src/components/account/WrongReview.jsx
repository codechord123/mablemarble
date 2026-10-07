import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import QuestionModal from '../game/QuestionModal.jsx'
import GameButton from '../ui/GameButton.jsx'
import MathText from '../ui/MathText.jsx'
import { isCorrect } from '../../utils/questionPicker.js'
import { AVATARS } from '../../data/avatars.js'
import { reviewList, MASTER_STREAK } from '../../account/wrongBook.js'
import { accountApi, useAccount } from '../../account/store.js'
import { sfx } from '../../utils/sounds.js'
import { formatAnswer } from '../game/ResultBanner.jsx'
import PrintSheet from './PrintSheet.jsx'

// 오답 다시 풀기 — 내 오답 노트의 문제를 하나씩. 연속 2번 맞히면 노트에서 졸업.
export default function WrongReview({ onBack }) {
  const me = useAccount((s) => s.me)
  const [book, setBook] = useState(null)
  const [error, setError] = useState(null)
  const [queue, setQueue] = useState(null) // 이번에 풀 문제들
  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState(null) // { correct, item, graduated }
  const [score, setScore] = useState({ right: 0, graduated: 0 })

  useEffect(() => {
    let alive = true
    setError(null)
    // 인터넷이 느리면 '불러오는 중'에서 멈춘 것처럼 보이지 않게 15초 뒤엔 안내
    const slow = setTimeout(() => alive && setError('오답 노트를 불러오는 데 오래 걸려요. 인터넷을 확인하고 다시 들어와 주세요'), 15000)
    accountApi()
      .then((a) => a.loadProgress(a.ME))
      .then((p) => {
        clearTimeout(slow)
        if (!alive) return
        if (p) setBook(p)
        else setError('로그인 정보를 확인하지 못했어요. 메뉴에서 다시 로그인해 주세요')
      })
      .catch(() => {
        clearTimeout(slow)
        if (alive) setError('오답 노트를 불러오지 못했어요. 인터넷을 확인해 주세요')
      })
    return () => {
      alive = false
      clearTimeout(slow)
    }
  }, [me?.username])

  const allList = useMemo(() => (book ? reviewList(book) : []), [book])
  // 단원별 보기 — 단원(문제 세트)마다 남은 문제 수
  const [unit, setUnit] = useState(null) // null = 전체
  const units = useMemo(() => {
    const n = {}
    for (const w of allList) n[w.unit] = (n[w.unit] || 0) + 1
    return Object.entries(n).sort((a, b) => b[1] - a[1])
  }, [allList])
  const list = useMemo(() => (unit ? allList.filter((w) => w.unit === unit) : allList), [allList, unit])
  const [printing, setPrinting] = useState(false)
  const player = useMemo(
    () => ({
      name: me ? me.name || me.username : '',
      avatar: AVATARS.includes(me?.avatar) ? me.avatar : '🦊',
      color: 'bg-violet-500',
    }),
    [me],
  )

  if (!me) {
    return (
      <Shell onBack={onBack}>
        <p className="text-center font-bold text-amber-800">로그인하면 내 오답 노트를 볼 수 있어요.</p>
      </Shell>
    )
  }

  async function answer(ans) {
    const item = queue[idx]
    const correct = ans !== '__TIMEOUT__' && isCorrect(item.question, ans)
    correct ? sfx.correct() : sfx.wrong()
    const graduated = correct && (item.streak || 0) + 1 >= MASTER_STREAK
    setFeedback({ correct, item, graduated })
    setScore((s) => ({ right: s.right + (correct ? 1 : 0), graduated: s.graduated + (graduated ? 1 : 0) }))
    try {
      const a = await accountApi()
      const next = await a.recordResult(a.ME, item.question, correct)
      if (next) setBook(next)
    } catch {
      setError('결과를 저장하지 못했어요. 인터넷을 확인해 주세요')
    }
  }

  function nextQuestion() {
    setFeedback(null)
    setIdx((i) => i + 1)
  }

  // ── 문제 푸는 중 ──
  if (queue && idx < queue.length) {
    const item = queue[idx]
    return (
      <div className="min-h-[100dvh] hero-bg-soft">
        {!feedback && (
          <QuestionModal
            key={`${item.key}-${idx}`}
            question={item.question}
            intent="review"
            player={player}
            onSubmit={answer}
            stake={`${idx + 1} / ${queue.length} · 연속 ${MASTER_STREAK}번 맞히면 졸업`}
          />
        )}
        {feedback && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-sky-950/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-[1.75rem] bg-white p-6 text-center shadow-2xl"
            >
              <div className="text-5xl">{feedback.graduated ? '🎓' : feedback.correct ? '⭕' : '❌'}</div>
              <h3 className={`mt-2 text-2xl font-black ${feedback.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
                {feedback.graduated ? '졸업! 이제 이 문제는 자신 있어요' : feedback.correct ? '정답! 한 번 더 맞히면 졸업' : '아쉬워요'}
              </h3>
              {!feedback.correct && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-left text-sm font-semibold text-amber-950">
                  <div>
                    정답: <MathText>{formatAnswer(feedback.item.question)}</MathText>
                  </div>
                  {feedback.item.question.explanation && (
                    <div className="mt-1 text-amber-800">
                      <MathText>{feedback.item.question.explanation}</MathText>
                    </div>
                  )}
                </div>
              )}
              <GameButton color="violet" onClick={nextQuestion} className="mt-5 w-full py-3 text-lg">
                {idx + 1 < queue.length ? '다음 문제' : '결과 보기'}
              </GameButton>
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  // ── 다 풀었을 때 ──
  if (queue) {
    return (
      <Shell onBack={onBack}>
        <div className="text-center">
          <div className="text-5xl">🏁</div>
          <h3 className="mt-2 text-xl font-black text-amber-900">
            {queue.length}문제 중 {score.right}개 맞혔어요
          </h3>
          {score.graduated > 0 && <p className="mt-1 font-bold text-violet-700">🎓 {score.graduated}문제 졸업!</p>}
          <p className="mt-1 text-sm font-semibold text-amber-700">노트에 남은 문제 {list.length}개</p>
          {list.length > 0 && (
            <GameButton color="violet" onClick={() => start()} className="mt-5 w-full py-3 text-lg">
              한 번 더 풀기
            </GameButton>
          )}
        </div>
      </Shell>
    )
  }

  function start() {
    setQueue(list.slice(0, 10))
    setIdx(0)
    setScore({ right: 0, graduated: 0 })
  }

  // ── 노트 보기 ──
  return (
    <Shell onBack={onBack}>
      <div className="text-center">
        <h2 className="text-2xl font-black text-amber-900">📒 {player.name}의 오답 노트</h2>
        <p className="mt-1 text-sm font-semibold text-amber-700">
          틀린 문제를 다시 풀어요. 연속 {MASTER_STREAK}번 맞히면 졸업!
        </p>
      </div>
      {error && <p className="mt-4 text-center font-bold text-rose-600">{error}</p>}
      {!book && !error && <p className="mt-6 animate-pulse text-center font-bold text-amber-700">불러오는 중…</p>}
      {book && (
        <>
          {/* 단원 고르기 */}
          {units.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[[null, allList.length], ...units].map(([u, n]) => (
                <button
                  key={u || 'all'}
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                    unit === u ? 'bg-violet-600 text-white shadow' : 'bg-violet-50 text-violet-800 hover:bg-violet-100'
                  }`}
                >
                  {u || '전체'} <span className="opacity-80">{n}</span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-rose-50 p-3">
              <div className="text-2xl font-black text-rose-600">{list.length}</div>
              <div className="text-xs font-bold text-rose-700">다시 풀 문제{unit ? ' (이 단원)' : ''}</div>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3">
              <div className="text-2xl font-black text-violet-600">{book.mastered || 0}</div>
              <div className="text-xs font-bold text-violet-700">졸업한 문제</div>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="mt-6 text-center font-bold text-emerald-700">
              다시 풀 문제가 없어요! 보드게임에서 틀린 문제가 여기에 모여요.
            </p>
          ) : (
            <>
              <ul className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                {list.map((w) => (
                  <li key={w.key} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-amber-700">
                      <span className="truncate">{unit ? '' : `${w.unit} · `}{w.question.category || '문제'}</span>
                      <span>
                        {w.count}번 틀림{w.streak ? ` · ⭕${w.streak}` : ''}
                      </span>
                    </div>
                    <div className="mt-0.5 line-clamp-2">
                      <MathText>{w.question.question}</MathText>
                    </div>
                  </li>
                ))}
              </ul>
              <GameButton color="violet" onClick={start} className="mt-5 w-full py-3.5 text-lg">
                다시 풀기 시작 ({Math.min(10, list.length)}문제)
              </GameButton>
              <button onClick={() => setPrinting(true)} className="mt-3 w-full text-sm font-bold text-amber-700 hover:underline">
                🖨️ 오답 노트 인쇄하기 ({list.length}문제)
              </button>
              {printing && (
                <PrintSheet
                  title={`${player.name}의 오답 노트`}
                  subtitle={unit || '전체 단원'}
                  questions={list.map((w) => w.question)}
                  onClose={() => setPrinting(false)}
                  nameLine={false}
                />
              )}
            </>
          )}
        </>
      )}
    </Shell>
  )
}

function Shell({ onBack, children }) {
  return (
    <div className="min-h-[100dvh] hero-bg-soft flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[1.75rem] bg-white p-6 card-soft ring-1 ring-amber-900/5">
        <button onClick={onBack} className="mb-3 text-sm font-semibold text-amber-700 hover:underline">
          ← 메인 메뉴
        </button>
        {children}
      </div>
    </div>
  )
}
