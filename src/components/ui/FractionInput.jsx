// 단답형 답안의 형식에 맞춰 자연수/분자/분모를 별도 입력 박스로 받음.
// mode: 'integer' | 'fraction' | 'text'
//   - integer: 자연수 1개 박스
//   - fraction: 자연수 + 분자/분모 (3개 박스, 자연수 비워두면 진분수/가분수)
//   - text: 자유 입력

import { useEffect, useRef, useState } from 'react'
import { sfx } from '../../utils/sounds.js'
import { popEl } from '../../utils/juice.js'
import { mixedParticle } from '../../utils/korean.js'

// 정답 문자열에서 입력 모드 자동 추론
// 모든 숫자형 답안은 'fraction' 모드(자연수+분자/분모 3박스) 사용.
// 대분수 구분자: 조사 '과/와'는 앞 수의 받침에 따라 달라지므로 둘 다 받는다.
export const MIXED_SEPARATOR = /[과와]/

export function detectInputMode(answer) {
  const first = String(answer).split(/[,，]/)[0].trim()
  if (/^\d+\s*[과와]\s*\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+$/.test(first)) return 'fraction'
  return 'text'
}

// maxDigits: 분수 부품(분자/분모/자연수)은 3자리면 충분하지만
// 정수 답안(넓이 등)은 5400 같은 네 자리 이상이 나오므로 모드별로 달리 준다.
function NumBox({ value, onChange, onEnter, autoFocus, ariaLabel, maxDigits = 3 }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const filled = value.length > 0
  // 4자리 이상 입력 중이면 박스를 넓혀 숫자가 잘려 보이지 않게
  const wide = maxDigits > 3
  const widthClass = wide
    ? (value.length > 3 ? 'w-24 sm:w-28' : 'w-16 sm:w-20')
    : 'w-14 sm:w-16'

  const handleChange = (e) => {
    const next = e.target.value.replace(/\D/g, '').slice(0, maxDigits)
    if (next !== value) {
      if (next.length > value.length) {
        sfx.tick()
        popEl(inputRef.current) // WAAPI — 리렌더에 안 잘리고 매번 재생
      }
      onChange(next)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={handleChange}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.() }}
      className={`${widthClass} h-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold rounded-xl outline-none transition-all duration-150 border-2 tabular-nums ${
        filled
          ? 'bg-amber-50 border-amber-500 text-amber-900'
          : 'bg-white border-amber-300 text-amber-900'
      } ${focused ? 'focus-ring border-amber-500' : ''}`}
    />
  )
}

function LabeledBox({ children, label }) {
  return (
    <div className="flex flex-col items-center">
      {children}
      <span className="text-xs sm:text-sm text-gray-500 mt-1.5 font-semibold">{label}</span>
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
            autoFocus={autoFocus} ariaLabel="정수 답" maxDigits={6} />
        </LabeledBox>
      </div>
    )
  }

  // fraction 모드: 자연수 + 분자/분모 (3박스)
  // 예전에는 바닥 정렬(items-end)이라 자연수 박스가 분모 박스와 같은 높이에
  // 놓여 분수보다 한참 아래로 보였다. 대분수는 정수부가 분수의 세로 중앙에
  // 오는 게 맞으므로, 열을 같은 높이로 늘리고(items-stretch) 박스는 남는
  // 공간의 가운데에, 라벨은 바닥에 붙인다. 라벨끼리도 높이가 맞는다.
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs font-bold text-amber-500 tracking-wide">여기에 답을 입력하세요</div>
      <div className="flex items-stretch justify-center gap-2 sm:gap-3 py-1">
        <div className="flex flex-col items-center">
          <div className="flex-1 flex items-center">
            {/* 자연수만 답하는 문제(연도 등)가 이 UI로 올 수 있으므로 큰 수도 허용 */}
            <NumBox value={intPart} onChange={setIntPart} onEnter={onEnter}
              autoFocus={autoFocus} ariaLabel="대분수의 자연수 부분" maxDigits={6} />
          </div>
          <span className="text-xs sm:text-sm text-gray-500 mt-1.5 font-semibold">자연수</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex-1 flex items-center">
            {/* 입력한 수에 맞춰 조사가 바뀐다 (2와 · 1과) */}
            <span className={`font-bold text-lg transition-opacity ${intPart ? 'text-amber-800' : 'text-amber-800/35'}`}>
              {mixedParticle(intPart)}
            </span>
          </div>
          <span className="text-xs sm:text-sm mt-1.5 font-semibold invisible" aria-hidden="true">·</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="inline-flex flex-col items-center gap-1.5">
            <NumBox value={num} onChange={setNum} onEnter={onEnter}
              ariaLabel="분자" />
            <div className="w-16 sm:w-20 h-1 bg-amber-700 rounded" />
            <NumBox value={den} onChange={setDen} onEnter={onEnter}
              ariaLabel="분모" />
          </div>
          <span className="text-xs sm:text-sm text-gray-500 mt-1.5 font-semibold">분자 / 분모</span>
        </div>
      </div>
    </div>
  )
}
