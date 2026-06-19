import { useEffect, useState } from 'react'
import { useQuestionStore } from '../../stores/questionStore.js'
import { loadQuestions } from '../../db/dexie.js'
import FileUpload from './FileUpload.jsx'
import QuestionPreview from './QuestionPreview.jsx'

export default function QuestionManager({ onBack }) {
  const sets = useQuestionStore((s) => s.sets)
  const refresh = useQuestionStore((s) => s.refresh)
  const createSet = useQuestionStore((s) => s.createSet)
  const deleteSetFn = useQuestionStore((s) => s.deleteSet)

  const [preview, setPreview] = useState(null) // { questions, errors, source, fileName }
  const [setName, setSetName] = useState('')

  useEffect(() => { refresh() }, [refresh])

  const handleParsed = (result, fileName) => {
    setPreview({ ...result, fileName })
    setSetName(fileName.replace(/\.(hwpx|docx|xlsx)$/i, ''))
  }

  const handleSave = async (finalQuestions) => {
    await createSet(setName, '기타', finalQuestions)
    setPreview(null)
    setSetName('')
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" 세트를 삭제할까요?`)) return
    await deleteSetFn(id)
  }

  const handleExport = async (set) => {
    const questions = await loadQuestions(set.id)
    const data = { name: set.name, subject: set.subject, questions }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${set.name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-amber-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="text-amber-700 hover:underline mb-4 font-semibold">
          ← 메인 메뉴
        </button>
        <h2 className="text-3xl font-extrabold text-amber-900 mb-1">📚 문제 관리</h2>
        <p className="text-amber-700 mb-6">교사용 문제 파일을 업로드해서 게임에 사용하세요.</p>

        <FileUpload onParsed={handleParsed} />

        {preview && (
          <QuestionPreview
            preview={preview}
            name={setName}
            onNameChange={setSetName}
            onSave={handleSave}
            onCancel={() => setPreview(null)}
          />
        )}

        <div className="mt-8">
          <h3 className="text-xl font-bold text-amber-900 mb-3">저장된 문제 세트</h3>
          {sets.length === 0 ? (
            <div className="p-4 bg-white/60 rounded-xl text-gray-500 text-center">
              아직 업로드한 문제 세트가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {sets.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow">
                  <div>
                    <div className="font-bold text-amber-900">{s.name}</div>
                    <div className="text-sm text-gray-600">
                      {s.count}문제 · {new Date(s.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleExport(s)}
                      className="text-amber-700 hover:bg-amber-50 px-3 py-1 rounded font-semibold text-sm"
                      title="JSON으로 내보내기"
                    >
                      내보내기
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-rose-500 hover:bg-rose-50 px-3 py-1 rounded font-semibold text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 p-4 bg-amber-100/60 rounded-xl text-sm text-amber-900">
          <strong>📝 표 템플릿:</strong> 번호 / 카테고리 / 난이도(1~3) / 유형(객관식·OX·단답형) /
          문제 / 보기1~4 / 정답 / 해설
        </div>
      </div>
    </div>
  )
}
