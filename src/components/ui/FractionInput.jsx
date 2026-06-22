// 단답형 답안의 형식에 맞춰 분자/분모/대분수 정수부를 별도 입력 박스로 받음.
// mode: 'integer' | 'fraction' | 'mixed' | 'text'

import { useEffect, useRef, useState } from 'react'

// 정답 문자열에서 입력 모드 자동 추론
export function detectInputMode(answer) {
  const first = String(answer).split(/[,，]/)[0].trim()
  if (/^\d+\s*과\s*\d+\/\d+$/.test(first)) return 'mixed'
  if (/^\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+$/.test(first)) return 'integer'
  return 'text'
}

function NumBox({ value, onChange, onEnter, placeholder, autoFocus, refEl, onKeyTab }) {
  return (
    <input
      ref={refEl}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
        if (e.key === 'Tab') onKeyTab?.(e)
      }}
      className="w-12 sm:w-14 h-11 sm:h-12 text-center text-xl sm:text-2xl font-bold border-2 border-amber-300 rounded-lg focus:border-amber-500 outline-none bg-white"
    />
  )
}

function FractionStack({ num, den, onNum, onDen, onEnter, autoFocusFirst, refNum, refDen }) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <NumBox value={num} onChange={onNum} onEnter={onEnter} placeholder="분자" autoFocus={autoFocusFirst} refEl={refNum} />
      <div className="w-14 sm:w-16 h-0.5 bg-amber-700 rounded" />
      <NumBox value={den} onChange={onDen} onEnter={onEnter} placeholder="분모" refEl={refDen} />
    </div>
  )
}

export default function FractionInput({ mode, onValueChange, onEnter, autoFocus = true }) {
  const [intPart, setIntPart] = useState('')
  const [num, setNum] = useState('')
  const [den, setDen] = useState('')
  const refInt = useRef(null)
  const refNum = useRef(null)
  const refDen = useRef(null)

  useEffect(() => {
    let assembled = ''
    let valid = false
    if (mode === 'integer') {
      assembled = intPart
      valid = intPart.length > 0
    } else if (mode === 'fraction') {
      if (num && den) {
        assembled = `${num}/${den}`
        valid = true
      }
    } else if (mode === 'mixed') {
      if (num && den) {
        assembled = intPart ? `${intPart}과${num}/${den}` : `${num}/${den}`
        valid = true
      }
    }
    onValueChange(assembled, valid)
  }, [intPart, num, den, mode, onValueChange])

  if (mode === 'integer') {
    return (
      <div className="flex items-center justify-center">
        <NumBox
          value={intPart}
          onChange={setIntPart}
          onEnter={onEnter}
          placeholder="답"
          autoFocus={autoFocus}
          refEl={refInt}
        />
      </div>
    )
  }

  if (mode === 'fraction') {
    return (
      <div className="flex items-center justify-center py-2">
        <FractionStack
          num={num} den={den}
          onNum={setNum} onDen={setDen}
          onEnter={onEnter}
          autoFocusFirst={autoFocus}
          refNum={refNum} refDen={refDen}
        />
      </div>
    )
  }

  // mixed
  return (
    <div className="flex items-end justify-center gap-2 py-2">
      <div className="flex items-center gap-1">
        <NumBox
          value={intPart}
          onChange={setIntPart}
          onEnter={onEnter}
          placeholder="정수"
          autoFocus={autoFocus}
          refEl={refInt}
        />
        <span className="text-amber-800 font-bold pb-3">과</span>
      </div>
      <FractionStack
        num={num} den={den}
        onNum={setNum} onDen={setDen}
        onEnter={onEnter}
        refNum={refNum} refDen={refDen}
      />
      <div className="text-xs text-gray-500 pb-3 ml-1">
        {intPart ? '대분수' : '(정수부 비워두면 가분수)'}
      </div>
    </div>
  )
}
