import MathText from '../ui/MathText.jsx'
import ShapeDiagram from '../ui/ShapeDiagram.jsx'
import { formatAnswer } from '../game/ResultBanner.jsx'
import { CIRCLED } from '../../utils/worksheet.js'

// 선생님이 문제를 확인하는 카드 — 문제 글, 그림, 보기(정답 표시), 정답, 풀이.
export default function QuestionCard({ q, compact = false }) {
  if (!q) return null
  return (
    <div className={compact ? 'text-sm' : 'text-base'}>
      <div className={`font-bold text-slate-800 leading-relaxed ${compact ? '' : 'text-lg'}`}>
        <MathText>{q.question}</MathText>
      </div>
      {q.figure && (
        <div className="my-2 w-full max-w-[420px] rounded-xl bg-amber-50/70 p-2 ring-1 ring-amber-200 question-figure">
          <ShapeDiagram figure={q.figure} />
        </div>
      )}
      {q.type === 'multiple_choice' && (
        <ol className="mt-1 space-y-0.5">
          {q.choices.map((c, i) => (
            <li key={i} className={i === Number(q.answer) ? 'font-extrabold text-emerald-700' : 'text-slate-700'}>
              {CIRCLED[i]} <MathText>{c}</MathText>
              {i === Number(q.answer) && ' ✔'}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-2 font-bold text-emerald-700">
        정답: <MathText>{formatAnswer(q)}</MathText>
      </div>
      {q.explanation && (
        <div className="mt-1 text-slate-600">
          💡 <MathText>{q.explanation}</MathText>
        </div>
      )}
    </div>
  )
}
