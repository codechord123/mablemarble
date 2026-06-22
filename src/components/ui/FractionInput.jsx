// 단답형 답안의 형식에 맞춰 자연수/분자/분모를 별도 입력 박스로 받음.
// mode: 'integer' | 'fraction' | 'text'
//   - integer: 자연수 1개 박스
//   - fraction: 자연수 + 분자/분모 (3개 박스, 자연수 비워두면 진분수/가분수)
//   - text: 자유 입력

import { useEffect, useRef, useState } from 'react'

// 정답 문자열에서 입력 모드 자동 추론
// 모든 숫자형 답안은 'fraction' 모드(자연수+분자/분모 3박스) 사용 — 학생이
// 정수/분수/대분수 중 어떤 형태로든 입력 가능. 텍스트만 별도 모드.
export function detectInputMode(answer) {
  const first = String(answer).split(/[,，]/)[0].trim()
  if (/^\d+\s*과\s*\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+$/.test(first)) return 'fraction'  // 정수 답도 3박스 UI로 통일
  return 'text'
}

function NumBox({ value, onChange, onEnter, placeholder, autoFocus, refEl, ariaLabel }) {
  return (
    <input
      ref={refEl}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.() }}
      className="w-14 sm:w-16 h-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold border-2 border-amber-300 rounded-xl focus:border-amber-500 outline-none bg-white"
    />
  )
}

function LabeledBox({ children, label }) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <span className="text-xs sm:text-sm text-gray-600 mt-1.5 font-semibold">{label}</span>
    </div>
  )
}

export default function FractionInput({ mode, onValueChange, onEnter, autoFocus = true }) {
  const [intPart, setIntPart] = useState('')
  const [num, setNum] = useState('')
  const [den, setDen] = useState('')

  useEffect(() => {
    let assembled = ''
    let valid = false
    if (mode === 'integer') {
      assembled = intPart
      valid = intPart.length > 0
    } else if (mode === 'fraction') {
      // 분자/분모만 → 진분수 또는 가분수
      // 자연수 + 분자/분모 → 대분수
      if (num && den) {
        assembled = intPart ? `${intPart}과${num}/${den}` : `${num}/${den}`
        valid = true
      } else if (intPart && !num && !den) {
        // 자연수만 입력해도 정수 형태로 인정 (예: 1, 2)
        assembled = intPart
        valid = true
      }
    }
    onValueChange(assembled, valid)
  }, [intPart, num, den, mode, onValueChange])

  if (mode === 'integer') {
    return (
      <div className="flex items-center justify-center">
        <LabeledBox label="답">
          <NumBox value={intPart} onChange={setIntPart} onEnter={onEnter}
            placeholder="" autoFocus={autoFocus} ariaLabel="정수 답" />
        </LabeledBox>
      </div>
    )
  }

  // fraction 모드: 자연수 + 분자/분모 (3박스)
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 py-2">
      <LabeledBox label="자연수">
        <NumBox value={intPart} onChange={setIntPart} onEnter={onEnter}
          placeholder="" autoFocus={autoFocus} ariaLabel="대분수의 자연수 부분" />
      </LabeledBox>

      <span className="text-amber-800 font-bold pb-7 text-lg">과</span>

      <div className="flex flex-col items-center">
        <div className="inline-flex flex-col items-center gap-1.5">
          <NumBox value={num} onChange={setNum} onEnter={onEnter}
            placeholder="" ariaLabel="분자" />
          <div className="w-16 sm:w-20 h-1 bg-amber-700 rounded" />
          <NumBox value={den} onChange={setDen} onEnter={onEnter}
            placeholder="" ariaLabel="분모" />
        </div>
        <span className="text-xs sm:text-sm text-gray-600 mt-1.5 font-semibold">분자 / 분모</span>
      </div>
    </div>
  )
}
