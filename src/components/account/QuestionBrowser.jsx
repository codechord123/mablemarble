import { useMemo, useState } from 'react'
import { BUNDLED_SETS } from '../../data/bundledSets.js'
import MathText from '../ui/MathText.jsx'
import QuestionCard from './QuestionCard.jsx'

// 문제 점검 — 선생님이 내장 문제를 단원·영역·난이도별로 하나씩 펼쳐 보고,
// 이상한 문제에 ⚠️ 표시와 메모를 남긴 뒤 번호 목록을 복사해 알려 줄 수 있다.
// 표시는 이 기기에만 저장된다(게임에는 영향 없음).
const FLAG_KEY = 'boomarble_review_flags_v1'
function loadFlags() {
  try {
    return JSON.parse(localStorage.getItem(FLAG_KEY) || '{}')
  } catch {
    return {}
  }
}
function saveFlags(f) {
  try {
    localStorage.setItem(FLAG_KEY, JSON.stringify(f))
  } catch {
    /* 저장 못 해도 화면에서는 보인다 */
  }
}

const TYPE = { multiple_choice: '객관식', true_false: 'O/X', short_answer: '단답형' }

export default function QuestionBrowser({ onBack }) {
  const [setId, setSetId] = useState(BUNDLED_SETS[0].id)
  const [cat, setCat] = useState(null)
  const [diff, setDiff] = useState(0)
  const [figOnly, setFigOnly] = useState(false)
  const [flagOnly, setFlagOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(() => new Set())
  const [flags, setFlags] = useState(loadFlags)
  const [copied, setCopied] = useState(false)

  const set = BUNDLED_SETS.find((s) => s.id === setId) || BUNDLED_SETS[0]
  const cats = useMemo(() => [...new Set(set.questions.map((q) => q.category))], [set])
  const list = set.questions.filter(
    (q) =>
      (!cat || q.category === cat) &&
      (!diff || q.difficulty === diff) &&
      (!figOnly || q.figure) &&
      (!flagOnly || flags[q.id]) &&
      (!search.trim() || q.id.includes(search.trim()) || q.question.includes(search.trim())),
  )
  const flagged = Object.entries(flags)

  function toggle(id) {
    setOpen((cur) => {
      const n = new Set(cur)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function setFlag(id, val) {
    setFlags((cur) => {
      const n = { ...cur }
      if (val === null) delete n[id]
      else n[id] = { note: val, at: Date.now() }
      saveFlags(n)
      return n
    })
  }
  async function copyFlags() {
    const unitOf = (id) => BUNDLED_SETS.find((s) => s.questions.some((q) => q.id === id))?.name || ''
    const text = ['부르마블 문제 점검 — 고칠 문제', ...flagged.map(([id, f]) => `${id} (${unitOf(id)})${f.note ? `: ${f.note}` : ''}`)].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('아래 글을 복사해 주세요', text)
    }
  }

  const chip = (on) =>
    `rounded-full px-3 py-1.5 text-xs font-extrabold transition ${on ? 'bg-amber-600 text-white shadow' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`

  return (
    <div className="min-h-[100dvh] hero-bg-soft p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-[1.75rem] bg-white p-5 sm:p-6 card-soft ring-1 ring-amber-900/5">
        <button onClick={onBack} className="text-sm font-semibold text-amber-700 hover:underline">← 뒤로</button>
        <h2 className="mt-2 text-2xl font-black text-amber-900">📋 문제 점검</h2>
        <p className="mt-1 text-sm font-semibold text-amber-700">
          문제를 눌러 그림·정답·풀이를 확인하세요. 이상한 문제는 ⚠️로 표시하고, 목록을 복사해 알려 주면 고칠 수 있어요.
        </p>

        <select
          value={setId}
          onChange={(e) => {
            setSetId(e.target.value)
            setCat(null)
            setOpen(new Set())
          }}
          className="mt-4 w-full rounded-xl border-2 border-amber-200 bg-white p-2.5 font-bold text-amber-900"
        >
          {BUNDLED_SETS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.questions.length}문제)
            </option>
          ))}
        </select>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[null, ...cats].map((c) => (
            <button key={c || 'all'} onClick={() => setCat(c)} className={chip(cat === c)}>
              {c || '전체 영역'}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {[0, 1, 2, 3].map((d) => (
            <button key={d} onClick={() => setDiff(d)} className={chip(diff === d)}>
              {d ? '★'.repeat(d) : '모든 난이도'}
            </button>
          ))}
          <button onClick={() => setFigOnly((v) => !v)} className={chip(figOnly)}>🖼️ 그림 문제만</button>
          <button onClick={() => setFlagOnly((v) => !v)} className={chip(flagOnly)}>⚠️ 표시한 문제만</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="번호(cg149)나 낱말로 찾기"
          className="mt-2 w-full rounded-xl border-2 border-amber-100 p-2.5 text-sm font-semibold outline-none focus:border-amber-400"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-amber-800">
          <span>{list.length}문제</span>
          <span className="flex items-center gap-2">
            <button onClick={() => setOpen(new Set(list.map((q) => q.id)))} className="text-xs text-amber-700 underline">모두 펼치기</button>
            <button onClick={() => setOpen(new Set())} className="text-xs text-amber-700 underline">모두 접기</button>
          </span>
        </div>

        {flagged.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
            <span>⚠️ 표시한 문제 {flagged.length}개: {flagged.map(([id]) => id).join(', ')}</span>
            <button onClick={copyFlags} className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white shadow">
              {copied ? '복사했어요!' : '📋 목록 복사'}
            </button>
          </div>
        )}

        <ol className="mt-3 space-y-2">
          {list.map((q) => {
            const isOpen = open.has(q.id)
            const f = flags[q.id]
            return (
              <li key={q.id} className={`rounded-xl p-3 ring-1 ${f ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50/40 ring-amber-100'}`}>
                <button className="w-full text-left" onClick={() => toggle(q.id)}>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold text-amber-700">
                    <span className="font-black text-amber-900">{q.id}</span>
                    <span>{'★'.repeat(q.difficulty)}</span>
                    <span>{TYPE[q.type]}</span>
                    <span className="text-amber-600">{q.category}</span>
                    {q.figure && <span>🖼️</span>}
                    {f && <span className="text-rose-600">⚠️</span>}
                    <span className="ml-auto text-amber-500">{isOpen ? '접기 ▲' : '펼치기 ▼'}</span>
                  </div>
                  {!isOpen && (
                    <div className="mt-1 line-clamp-2 text-sm font-semibold text-slate-800">
                      <MathText>{q.question}</MathText>
                    </div>
                  )}
                </button>
                {isOpen && (
                  <div className="mt-2">
                    <QuestionCard q={q} />
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-100 pt-2">
                      {f ? (
                        <>
                          <input
                            value={f.note || ''}
                            onChange={(e) => setFlag(q.id, e.target.value)}
                            placeholder="무엇이 이상한지 적어 주세요 (예: 그림과 각도가 안 맞음)"
                            className="min-w-0 flex-1 rounded-lg border-2 border-rose-200 p-2 text-sm font-semibold outline-none focus:border-rose-400"
                          />
                          <button onClick={() => setFlag(q.id, null)} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                            표시 지우기
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setFlag(q.id, '')} className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-rose-600 ring-1 ring-rose-200">
                          ⚠️ 이 문제 이상해요
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        {list.length === 0 && <p className="mt-6 text-center font-bold text-amber-700">조건에 맞는 문제가 없어요.</p>}
      </div>
    </div>
  )
}
