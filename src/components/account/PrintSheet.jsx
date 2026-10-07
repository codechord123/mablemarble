import { useState } from 'react'
import { createPortal } from 'react-dom'
import MathText from '../ui/MathText.jsx'
import ShapeDiagram from '../ui/ShapeDiagram.jsx'
import { CIRCLED, answerLine, worksheetText } from '../../utils/worksheet.js'

// 오답 문제지 — 인쇄하기 / 알림장에 붙여 넣을 글 복사.
// 인쇄는 화면과 따로 body 바로 아래에 문제지만 그려 두고(print-root), 인쇄할 때 그것만 보이게 한다.
function Sheet({ title, subtitle, questions, answers, nameLine }) {
  const d = new Date()
  return (
    <div className="worksheet text-black">
      <div className="flex items-end justify-between border-b-2 border-black pb-2">
        <div>
          <div className="text-xl font-black">📒 {title}</div>
          {subtitle && <div className="mt-0.5 text-sm font-semibold">{subtitle}</div>}
        </div>
        <div className="text-right text-sm font-semibold">
          {d.getFullYear()}. {d.getMonth() + 1}. {d.getDate()}.
          {nameLine && <div className="mt-1">이름: ____________</div>}
        </div>
      </div>
      <ol className="mt-3 space-y-4">
        {questions.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <div className="font-bold">
              {i + 1}. <MathText>{q.question}</MathText>
            </div>
            {q.figure && (
              <div className="my-1 max-w-[260px]">
                <ShapeDiagram figure={q.figure} />
              </div>
            )}
            {q.type === 'multiple_choice' ? (
              <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5 pl-4 text-sm">
                {q.choices.map((c, j) => (
                  <div key={j}>
                    {CIRCLED[j]} <MathText>{c}</MathText>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 pl-4 text-sm">답: ______________________</div>
            )}
            {answers === 'inline' && (
              <div className="mt-1 pl-4 text-sm font-semibold">
                → 정답: <MathText>{answerLine(q)}</MathText>
              </div>
            )}
          </li>
        ))}
      </ol>
      {answers === 'end' && (
        <div className="mt-6 break-before-auto border-t border-dashed border-black pt-3 text-sm">
          <div className="font-black">정답과 풀이</div>
          <ol className="mt-1 space-y-1">
            {questions.map((q, i) => (
              <li key={i}>
                {i + 1}. <b><MathText>{answerLine(q)}</MathText></b>
                {q.explanation && <span> — <MathText>{q.explanation}</MathText></span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

export default function PrintSheet({ title, subtitle = '', questions, onClose, nameLine = true }) {
  const [answers, setAnswers] = useState('end')
  const [copied, setCopied] = useState(false)

  async function copyText() {
    const text = worksheetText({ title, subtitle, questions, answers })
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 클립보드가 막힌 브라우저 — 글을 고른 상태로 띄워 직접 복사하게
      window.prompt('아래 글을 복사해서 알림장에 붙여 넣으세요 (Ctrl+C)', text)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/60 p-3 backdrop-blur-sm print:hidden" onClick={onClose}>
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-[1.5rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-2 border-b border-amber-100 p-4">
            <div className="mr-auto font-black text-amber-900">🖨️ 문제지 만들기 · {questions.length}문제</div>
            {[
              ['end', '정답은 맨 뒤에'],
              ['inline', '문제마다 정답'],
              ['none', '정답 없이'],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setAnswers(k)}
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${answers === k ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4">
            <div className="mx-auto max-w-[680px] rounded-lg bg-white p-6 shadow">
              <Sheet title={title} subtitle={subtitle} questions={questions} answers={answers} nameLine={nameLine} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-amber-100 p-4">
            <button onClick={onClose} className="rounded-xl bg-gray-100 py-3 text-sm font-extrabold text-gray-500">닫기</button>
            <button onClick={copyText} className="rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white">
              {copied ? '복사했어요!' : '📋 알림장용 글 복사'}
            </button>
            <button onClick={() => window.print()} className="rounded-xl bg-amber-600 py-3 text-sm font-extrabold text-white">
              🖨️ 인쇄하기
            </button>
          </div>
        </div>
      </div>
      {/* 인쇄할 때만 보이는 문제지 */}
      {createPortal(
        <div className="print-root hidden print:block">
          <Sheet title={title} subtitle={subtitle} questions={questions} answers={answers} nameLine={nameLine} />
        </div>,
        document.body,
      )}
    </>
  )
}
