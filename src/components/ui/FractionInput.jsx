// 단답형 답안의 형식에 맞춰 자연수/분자/분모를 별도 입력 박스로 받음.
// mode: 'integer' | 'fraction' | 'text'
//   - integer: 자연수 1개 박스
//   - fraction: 자연수 + 분자/분모 (3개 박스, 자연수 비워두면 진분수/가분수)
//   - text: 자유 입력

import { useEffect, useRef, useState } from 'react'

// 정답 문자열에서 입력 모드 자동 추론
export function detectInputMode(answer) {
  const first = String(answer).split(/[,，]/)[0].trim()
  // 분수가 들어 있으면 항상 3박스 모드 (자연수 포함, 학생이 형식 선택 가능)
  if (/^\d+\s*과\s*\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+$/.test(first)) return 'integer'
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
      className="w-12 sm:w-14 h-11 sm:h-12 text-center text-xl sm:text-2xl font-bold border-2 border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
    />
  )
}

function LabeledBox({ children, label }) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <span className="text-[10px] sm:text-xs text-gray-500 mt-1">{label}</span>
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
        <div className="inline-flex flex-col items-center gap-1">
          <NumBox value={num} onChange={setNum} onEnter={onEnter}
            placeholder="" ariaLabel="분자" />
          <div className="w-14 sm:w-16 h-0.5 bg-amber-700 rounded" />
          <NumBox value={den} onChange={setDen} onEnter={onEnter}
            placeholder="" ariaLabel="분모" />
        </div>
        <span className="text-[10px] sm:text-xs text-gray-500 mt-1">분자 / 분모</span>
      </div>
    </div>
  )
}
