import { useState } from 'react'

const TYPE_LABEL = {
  multiple_choice: '객관식',
  true_false: 'OX',
  short_answer: '단답형',
}

function answerDisplay(q) {
  if (q.type === 'multiple_choice') return q.choices[q.answer] ?? '?'
  if (q.type === 'true_false') return q.answer === 0 ? 'O' : 'X'
  return String(q.answer)
}

export default function QuestionPreview({ preview, name, onNameChange, onSave, onCancel }) {
  const [questions, setQuestions] = useState(preview.questions)

  const removeAt = (i) => setQuestions((qs) => qs.filter((_, j) => j !== i))

  const difficultyMix = questions.reduce(
    (acc, q) => ({ ...acc, [q.difficulty]: (acc[q.difficulty] || 0) + 1 }),
    {},
  )

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-amber-900 mb-1">
        미리보기 · {questions.length}문제
        {preview.errors?.length > 0 && (
          <span className="ml-2 text-rose-600 text-sm">⚠️ {preview.errors.length}건 경고</span>
        )}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        난이도 ★ {difficultyMix[1] || 0} · ★★ {difficultyMix[2] || 0} · ★★★ {difficultyMix[3] || 0}
        {' · '}소스: {preview.source}
      </p>

      <div className="mb-3">
        <label className="block text-sm font-semibold text-amber-800 mb-1">문제 세트 이름</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="예: 5학년 1학기 사회"
          className="w-full p-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none"
        />
      </div>

      {preview.errors?.length > 0 && (
        <details className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm">
          <summary className="font-semibold text-rose-700 cursor-pointer">
            파싱 경고 {preview.errors.length}건 (행 건너뜀)
          </summary>
          <ul className="mt-2 text-rose-700 list-disc list-inside space-y-0.5">
            {preview.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
            {preview.errors.length > 20 && <li>... 외 {preview.errors.length - 20}건</li>}
          </ul>
        </details>
      )}

      <div className="max-h-96 overflow-y-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-amber-50 sticky top-0 text-amber-900">
            <tr>
              <th className="p-2 text-left w-10">#</th>
              <th className="p-2 text-left">카테고리</th>
              <th className="p-2">난이도</th>
              <th className="p-2">유형</th>
              <th className="p-2 text-left">문제</th>
              <th className="p-2 text-left">정답</th>
              <th className="p-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} className="border-t hover:bg-amber-50">
                <td className="p-2 text-gray-500">{i + 1}</td>
                <td className="p-2">{q.category}</td>
                <td className="p-2 text-center text-amber-600">{'★'.repeat(q.difficulty)}</td>
                <td className="p-2 text-center">{TYPE_LABEL[q.type] || q.type}</td>
                <td className="p-2 truncate max-w-[18rem]" title={q.question}>{q.question}</td>
                <td className="p-2 font-semibold text-emerald-700 truncate max-w-[8rem]">{answerDisplay(q)}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => removeAt(i)}
                    className="text-rose-500 hover:bg-rose-50 px-2 rounded"
                    aria-label="문제 제거"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave(questions)}
          disabled={questions.length === 0 || !name.trim()}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg font-bold shadow hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          저장
        </button>
        <button onClick={onCancel} className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 font-semibold">
          취소
        </button>
      </div>
    </div>
  )
}
