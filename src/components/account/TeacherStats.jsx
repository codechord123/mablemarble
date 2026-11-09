import { useEffect, useState } from 'react'
import { accountApi, useAccount } from '../../account/store.js'
import { summarize, unitsOf } from '../../account/classStats.js'
import MathText from '../ui/MathText.jsx'
import GameButton from '../ui/GameButton.jsx'
import PrintSheet from './PrintSheet.jsx'
import QuestionCard from './QuestionCard.jsx'

const pct = (r) => (r == null ? '–' : `${r}%`)
const rateColor = (r) => (r == null ? 'bg-gray-300' : r >= 80 ? 'bg-emerald-500' : r >= 50 ? 'bg-amber-400' : 'bg-rose-400')
const ago = (t) => {
  if (!t) return ''
  const d = Math.floor((Date.now() - t) / 86400000)
  return d <= 0 ? '오늘' : d === 1 ? '어제' : `${d}일 전`
}

const day = (t) => (t ? `${new Date(t).getMonth() + 1}/${new Date(t).getDate()}` : '')

// 학생 한 명 — 남은 오답(틀린 횟수·마지막 날짜). 다시 풀어 맞히면 목록에서 없어진다.
// 문제를 누르면 그림·정답까지 펼친다.
function StudentDetail({ s }) {
  const [openK, setOpenK] = useState(null)
  const row = (key, q, right) => (
    <li key={key} className="rounded-lg bg-white p-2 text-sm ring-1 ring-amber-100">
      <button className="flex w-full items-start gap-2 text-left" onClick={() => setOpenK(openK === key ? null : key)}>
        <span className="flex-1 font-semibold text-slate-800">
          <MathText>{q.question}</MathText>
          {q.figure && <span className="ml-1">🖼️</span>}
        </span>
        {right}
      </button>
      {openK === key && (
        <div className="mt-2 border-t border-amber-100 pt-2">
          <QuestionCard q={q} compact />
        </div>
      )}
    </li>
  )
  return (
    <div className="space-y-3 border-t border-amber-200 px-3 pb-3 pt-2">
      <div>
        <div className="text-xs font-black text-rose-700">❌ 남은 오답 {s.wrongList.length}개 <span className="font-bold text-rose-400">(많이 틀린 것부터 · 다시 풀어 맞히면 없어져요)</span></div>
        {s.wrongList.length === 0 ? (
          <p className="mt-1 text-xs font-bold text-slate-400">남은 오답이 없어요 👍</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {s.wrongList.map((w) =>
              row(
                w.key,
                w.q,
                <span className="shrink-0 text-right text-[11px] font-bold leading-tight text-slate-500">
                  <span className="text-rose-600">{w.count}번 틀림</span>

                  <br />
                  {day(w.lastAt)}
                </span>,
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

// 선생님 — 우리 반 부르마블 통계 (정답률·영역별·많이 틀린 문제·학생별 오답 노트)
export default function TeacherStats({ onBack, onCheckQuestions }) {
  const me = useAccount((s) => s.me)
  const [rows, setRows] = useState(null)
  const [unit, setUnit] = useState(null) // null = 전체 단원
  const data = rows ? summarize(rows, unit) : null
  const units = rows ? unitsOf(rows) : []
  const [error, setError] = useState(null)
  const [openQ, setOpenQ] = useState(null)
  const [openS, setOpenS] = useState(null) // 펼친 학생
  const [printing, setPrinting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadedAt, setLoadedAt] = useState(null)

  // 학생 이름을 누르면 아래 '학생별'에서 그 학생을 펼치고 그 자리로 간다
  function showStudent(uid) {
    setOpenS(uid)
    setTimeout(() => document.getElementById(`stu-${uid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  // 새로고침은 보던 화면을 그대로 둔 채 새 기록을 받아 와서 바꾼다
  async function load() {
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const a = await accountApi()
      setRows(await a.loadClassProgress(me.classId))
      setLoadedAt(new Date())
    } catch (e) {
      console.warn(e)
      setError('기록을 불러오지 못했어요. 인터넷을 확인하고 다시 눌러 주세요')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (me?.role === 'teacher' && me.classId) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.username])

  return (
    <div className="min-h-[100dvh] hero-bg-soft p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-5 sm:p-6 card-soft ring-1 ring-amber-900/5">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onBack} className="text-sm font-semibold text-amber-700 hover:underline">← 메인 메뉴</button>
          <span className="flex items-center gap-1.5">
            {onCheckQuestions && (
              <button onClick={onCheckQuestions} className="rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">📋 문제 점검</button>
            )}
            {me?.role === 'teacher' && (
              <button
                onClick={load}
                disabled={loading}
                className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow disabled:opacity-60"
              >
                <span className={loading ? 'inline-block animate-spin' : ''}>↻</span> {loading ? '불러오는 중…' : '새로고침'}
              </button>
            )}
          </span>
        </div>
        {loadedAt && (
          <p className="mt-1 text-right text-[11px] font-bold text-slate-400">
            {loadedAt.getHours()}시 {String(loadedAt.getMinutes()).padStart(2, '0')}분에 불러온 기록 · 아이들이 문제를 더 풀었으면 새로고침을 눌러 주세요
          </p>
        )}
        <h2 className="mt-2 text-2xl font-black text-amber-900">👩‍🏫 우리 반 부르마블 통계</h2>
        <p className="mt-1 text-sm font-semibold text-amber-700">
          아이디를 연결하고 푼 문제만 모여요. (게임 설정에서 플레이어마다 아이디 연결)
        </p>

        {me?.role !== 'teacher' && <p className="mt-6 text-center font-bold text-rose-600">선생님 아이디로 로그인해야 볼 수 있어요.</p>}
        {error && (
          <div className="mt-6 text-center">
            <p className="font-bold text-rose-600">{error}</p>
            <GameButton color="orange" onClick={load} className="mt-3 px-6 py-2">다시 불러오기</GameButton>
          </div>
        )}
        {me?.role === 'teacher' && !data && !error && <p className="mt-8 animate-pulse text-center font-bold text-amber-700">불러오는 중…</p>}

        {/* 단원 고르기 */}
        {units.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {[null, ...units].map((u) => (
              <button
                key={u || 'all'}
                onClick={() => setUnit(u)}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${
                  unit === u ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {u || '전체 단원'}
              </button>
            ))}
          </div>
        )}

        {data && data.totals.students === 0 && (
          <p className="mt-8 text-center font-bold text-amber-800">
            {unit ? '이 단원은 아직 기록이 없어요.' : '아직 기록이 없어요. 아이들이 게임 설정에서 아이디를 연결하고 문제를 풀면 여기에 모여요.'}
          </p>
        )}

        {data && data.totals.students > 0 && (
          <>
            {/* 요약 */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['학생', `${data.totals.students}명`],
                ['푼 문제', `${data.totals.answered}개`],
                ['정답률', pct(data.totals.rate)],
                ['남은 오답', `${data.totals.wrongLeft}개`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-amber-50 p-3 text-center">
                  <div className="text-[11px] font-bold text-amber-700">{k}</div>
                  <div className="mt-0.5 text-xl font-black text-amber-950">{v}</div>
                </div>
              ))}
            </div>

            {/* 영역별 정답률 — 낮은 것부터 */}
            {data.byCat.length > 0 && (
              <section className="mt-5">
                <h3 className="font-black text-amber-900">영역별 정답률 <span className="text-xs font-bold text-amber-600">(어려워하는 영역부터)</span></h3>
                <div className="mt-2 space-y-1.5">
                  {data.byCat.map((c) => (
                    <div key={c.cat} className="flex items-center gap-2 text-sm">
                      <span className="w-32 shrink-0 truncate font-bold text-slate-700 sm:w-44">{c.cat}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span className={`block h-full ${rateColor(c.rate)}`} style={{ width: `${c.rate || 0}%` }} />
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs font-bold tabular-nums text-slate-600">
                        {pct(c.rate)} <span className="text-slate-400">({c.c}/{c.a})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 많이 틀린 문제 */}
            {data.topWrong.length > 0 && (
              <section className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-black text-amber-900">우리 반이 많이 틀린 문제 <span className="text-xs font-bold text-amber-600">(오답 노트에 남아 있는 학생 수)</span></h3>
                  <button onClick={() => setPrinting(true)} className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white shadow">
                    🖨️ 인쇄 · 알림장
                  </button>
                </div>
                <ol className="mt-2 space-y-2">
                  {data.topWrong.map((w, i) => (
                    <li key={w.key} className="rounded-xl bg-rose-50 p-3 text-sm">
                      <button className="w-full text-left" onClick={() => setOpenQ(openQ === w.key ? null : w.key)}>
                        <div className="flex items-start gap-2">
                          <span className="font-black text-rose-600">{i + 1}</span>
                          <span className="flex-1 font-semibold text-slate-800">
                            {!unit && <span className="mr-1 text-[11px] font-bold text-rose-500">[{w.unit}]</span>}
                            <MathText>{w.question.question}</MathText>
                            {w.question.figure && <span className="ml-1">🖼️</span>}
                            <span className="ml-1 text-[11px] font-bold text-rose-400">{openQ === w.key ? '▲' : '▼ 눌러서 보기'}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-black text-rose-700">
                            {w.students}명
                          </span>
                        </div>
                      </button>
                      {openQ === w.key && (
                        <div className="mt-2 border-t border-rose-100 pt-2">
                          {/* 펼치면 문제 전체(그림·보기·정답·풀이)를 보여 준다 */}
                          <QuestionCard q={w.question} compact />
                          {w.question.id && <div className="mt-1 text-[11px] font-bold text-slate-400">문제 번호 {w.question.id}</div>}
                          <div className="mt-2 text-xs font-bold">
                            <div className="rounded-lg bg-white p-2 text-rose-700">
                              ❌ 아직 오답 노트에 남은 학생 ({w.who.length}):{' '}
                              {w.who.map((x) => (
                                <button key={x.uid} onClick={() => showStudent(x.uid)} className="mr-1 underline decoration-dotted underline-offset-2">
                                  {x.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="mt-1 text-[11px] font-bold text-slate-400">학생 이름을 누르면 그 학생의 오답 노트로 가요</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 학생별 — 이름을 누르면 그 학생의 남은 오답 */}
            <section className="mt-6">
              <h3 className="font-black text-amber-900">
                학생별 <span className="text-xs font-bold text-amber-600">(이름을 누르면 아직 남은 오답 문제가 보여요)</span>
              </h3>
              <div className="mt-2 space-y-1.5">
                {data.students.map((s) => {
                  const open = openS === s.uid
                  return (
                    <div key={s.uid} id={`stu-${s.uid}`} className={`scroll-mt-4 rounded-xl ring-1 ${open ? 'ring-amber-300 bg-amber-50/50' : 'ring-amber-100'}`}>
                      <button className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left text-sm" onClick={() => setOpenS(open ? null : s.uid)}>
                        <span className="w-24 shrink-0 truncate font-black text-amber-800 underline decoration-dotted underline-offset-4">{s.name}</span>
                        <span className="text-xs font-bold text-slate-500">푼 문제 {s.answered}</span>
                        <span className="text-xs font-bold text-slate-600">
                          <span className={`mr-1 inline-block h-2 w-2 rounded-full ${rateColor(s.rate)}`} />
                          정답률 {pct(s.rate)}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-black ${s.wrongLeft ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                          ❌ 남은 오답 {s.wrongLeft}
                        </span>
                        {s.drillLevel && <span className="text-xs font-bold text-violet-600">수련장 Lv.{s.drillLevel}</span>}
                        <span className="ml-auto text-[11px] font-bold text-slate-400">{ago(s.updatedAt)} {open ? '▲' : '▼'}</span>
                      </button>
                      {open && <StudentDetail s={s} />}
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                남은 오답은 학생이 '오답 다시 풀기'(또는 게임)에서 맞히면 목록에서 없어져요. 다시 틀리면 또 들어와요.
              </p>
            </section>
          </>
        )}
      </div>
      {printing && data && (
        <PrintSheet
          title="우리 반 복습 문제"
          subtitle={`${unit || '전체 단원'} · 우리 반이 많이 틀린 문제`}
          questions={data.topWrong.map((w) => w.question)}
          onClose={() => setPrinting(false)}
        />
      )}
    </div>
  )
}
