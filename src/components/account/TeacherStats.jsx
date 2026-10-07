import { useEffect, useState } from 'react'
import { accountApi, useAccount } from '../../account/store.js'
import { summarize, unitsOf } from '../../account/classStats.js'
import { formatAnswer } from '../game/ResultBanner.jsx'
import MathText from '../ui/MathText.jsx'
import GameButton from '../ui/GameButton.jsx'
import PrintSheet from './PrintSheet.jsx'

const pct = (r) => (r == null ? '–' : `${r}%`)
const rateColor = (r) => (r == null ? 'bg-gray-300' : r >= 80 ? 'bg-emerald-500' : r >= 50 ? 'bg-amber-400' : 'bg-rose-400')
const ago = (t) => {
  if (!t) return ''
  const d = Math.floor((Date.now() - t) / 86400000)
  return d <= 0 ? '오늘' : d === 1 ? '어제' : `${d}일 전`
}

// 선생님 — 우리 반 부르마블 통계 (정답률·영역별·많이 틀린 문제·학생별 오답 노트)
export default function TeacherStats({ onBack }) {
  const me = useAccount((s) => s.me)
  const [rows, setRows] = useState(null)
  const [unit, setUnit] = useState(null) // null = 전체 단원
  const data = rows ? summarize(rows, unit) : null
  const units = rows ? unitsOf(rows) : []
  const [error, setError] = useState(null)
  const [openQ, setOpenQ] = useState(null)
  const [printing, setPrinting] = useState(false)

  async function load() {
    setError(null)
    setRows(null)
    try {
      const a = await accountApi()
      setRows(await a.loadClassProgress(me.classId))
    } catch (e) {
      console.warn(e)
      setError('기록을 불러오지 못했어요. 인터넷을 확인하고 다시 눌러 주세요')
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
          {data && (
            <button onClick={load} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">↻ 새로고침</button>
          )}
        </div>
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
                ['남은 오답 / 졸업', `${data.totals.wrongLeft} / ${data.totals.mastered}`],
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
                          </span>
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-black text-rose-700">{w.students}명</span>
                        </div>
                      </button>
                      {openQ === w.key && (
                        <div className="mt-2 border-t border-rose-100 pt-2 text-xs font-semibold text-slate-600">
                          <div className="text-emerald-700">정답: <MathText>{formatAnswer(w.question)}</MathText></div>
                          {w.question.explanation && <div className="mt-1">💡 <MathText>{w.question.explanation}</MathText></div>}
                          <div className="mt-1 text-rose-700">틀린 학생: {w.names.join(', ')}</div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* 학생별 */}
            <section className="mt-6">
              <h3 className="font-black text-amber-900">학생별</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold text-amber-700">
                      <th className="py-1.5">이름</th>
                      <th>푼 문제</th>
                      <th>정답률</th>
                      <th>남은 오답</th>
                      <th>졸업</th>
                      <th>수련장</th>
                      <th>최근</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((s) => (
                      <tr key={s.uid} className="border-t border-amber-100 font-semibold text-slate-800">
                        <td className="py-2 font-black">{s.name}</td>
                        <td>{s.answered}</td>
                        <td>
                          <span className={`mr-1 inline-block h-2 w-2 rounded-full ${rateColor(s.rate)}`} />
                          {pct(s.rate)}
                        </td>
                        <td className={s.wrongLeft ? 'text-rose-600' : ''}>{s.wrongLeft}</td>
                        <td className="text-violet-700">{s.mastered}</td>
                        <td>{s.drillLevel ? `Lv.${s.drillLevel}` : '–'}</td>
                        <td className="text-xs text-slate-500">{ago(s.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                정답률은 이번 업데이트 뒤에 푼 문제부터 쌓여요. 남은 오답은 학생이 '오답 다시 풀기'에서 연속 2번 맞히면 졸업해요.
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
