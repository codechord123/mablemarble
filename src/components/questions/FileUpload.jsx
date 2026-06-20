import { useState } from 'react'
import { parseHwpx } from '../../utils/parsers/hwpxParser.js'
import { parseXlsx } from '../../utils/parsers/xlsxParser.js'
import { parseDocx } from '../../utils/parsers/docxParser.js'
import { parseJson } from '../../utils/parsers/jsonParser.js'

const PARSERS = {
  hwpx: parseHwpx,
  xlsx: parseXlsx,
  docx: parseDocx,
  json: parseJson,
}

export default function FileUpload({ onParsed }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const parser = PARSERS[ext]
      if (!parser) throw new Error(`지원하지 않는 형식: .${ext} (.hwpx · .xlsx · .docx · .json 만 가능)`)
      const result = await parser(file)
      onParsed(result, file.name)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files?.[0])
      }}
      className={`border-2 border-dashed rounded-2xl p-8 bg-white text-center transition ${
        dragOver ? 'border-amber-500 bg-amber-50' : 'border-amber-300'
      }`}
    >
      <div className="text-5xl mb-2">📂</div>
      <p className="text-amber-900 font-bold mb-1">문제 파일을 끌어다 놓거나 선택하세요</p>
      <p className="text-sm text-gray-500 mb-1">
        <strong className="text-amber-700">.hwpx</strong> (우선) · <strong>.xlsx</strong> · <strong>.docx</strong> · <strong>.json</strong> (공유 형식)
      </p>
      <p className="text-xs text-amber-700 mb-4">
        ⚠️ 표 헤더에서 셀 병합을 사용하지 마세요 (컬럼이 어긋날 수 있음)
      </p>
      <input
        type="file"
        accept=".hwpx,.xlsx,.docx,.json"
        onChange={(e) => handleFile(e.target.files[0])}
        disabled={busy}
        className="block mx-auto text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200"
      />
      {busy && <div className="mt-3 text-amber-600 animate-pulse">파싱 중…</div>}
      {error && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm text-left">
          ⚠️ {error}
        </div>
      )}
    </div>
  )
}
