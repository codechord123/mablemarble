// 단답형 답안 입력 — 자연수/분자/분모 칸 + 게임 전용 숫자 키패드.
// mode: 'integer' | 'fraction' | 'text'
//   - integer: 답 칸 1개
//   - fraction: 자연수 + 분자/분모 (자연수를 비우면 진분수/가분수)
//   - text: 자유 입력 (QuestionModal이 따로 처리)
//
// 예전에는 칸마다 네이티브 <input>이라 폰에서 숫자 키보드가 올라왔다. 문제 창은
// 화면 가운데 고정이라 키보드가 올라와도 비켜나지 않았고, 키보드 위 브라우저
// 도구줄과 주소 표시가 입력칸을 덮고, 정답 제출 버튼은 키보드 밑으로 사라졌다.
// 아이가 자기가 뭘 입력했는지 볼 수 없었다. 이제 폰 키보드를 쓰지 않는다.
// 칸은 눌러서 고르고, 숫자는 창 안의 큰 키패드로 넣는다. 컴퓨터에서는 키보드
// 숫자·←→·Tab·Backspace·Enter도 그대로 된다.

import { useCallback, useEffect, useRef, useState } from 'react'
import { sfx } from '../../utils/sounds.js'
import { popEl } from '../../utils/juice.js'
import { mixedParticle } from '../../utils/korean.js'

// 조사 '과/와'는 앞 수의 받침에 따라 달라지므로 둘 다 받는다.
export const MIXED_SEPARATOR = /[과와]/

export function detectInputMode(answer) {
  const first = String(answer).split(/[,，]/)[0].trim()
  if (/^\d+\s*[과와]\s*\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+\/\d+$/.test(first)) return 'fraction'
  if (/^\d+$/.test(first)) return 'fraction'
  return 'text'
}

// 분수 부품은 3자리, 정수 답(넓이 5400 등)과 자연수 칸은 6자리까지
const MAX_DIGITS = { int: 6, num: 3, den: 3 }

function Box({ value, active, onSelect, ariaLabel, wide, boxRef }) {
  const widthClass = wide
    ? value.length > 3 ? 'w-24 sm:w-28' : 'w-16 sm:w-20'
    : 'w-14 sm:w-16'
  return (
    <button
      ref={boxRef}
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`${widthClass} h-12 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-extrabold rounded-xl border-2 tabular-nums text-amber-900 transition-colors duration-150 ${
        active
          ? 'bg-amber-50 border-amber-500 focus-ring'
          : value
            ? 'bg-amber-50/60 border-amber-400'
            : 'bg-white border-amber-200'
      }`}
    >
      {value || (active ? <span className="block w-[2px] h-7 bg-amber-500 animate-pulse" /> : '')}
    </button>
  )
}

function Label({ children, hidden }) {
  return (
    <span className={`text-xs sm:text-sm mt-1.5 font-semibold ${hidden ? 'invisible' : 'text-gray-500'}`} aria-hidden={hidden}>
      {children}
    </span>
  )
}

function Key({ children, onPress, tone = 'digit', ariaLabel, wide, order = '' }) {
  const tones = {
    digit: 'bg-white text-amber-900 border-amber-200 shadow-[0_3px_0_#fcd34d]',
    action: 'bg-amber-100 text-amber-800 border-amber-300 shadow-[0_3px_0_#f59e0b]',
  }
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={(e) => { e.preventDefault(); onPress() }}
      onKeyDown={(e) => {
        // 키패드 버튼에 포커스가 있을 때 Enter는 그 키만 누른다(제출까지 되지 않게)
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onPress() }
      }}
      className={`${order} ${wide ? 'col-span-2' : ''} flex items-center justify-center leading-none h-11 sm:h-14 rounded-xl border-2 font-extrabold text-2xl tabular-nums select-none active:translate-y-[2px] active:shadow-none transition-transform ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

export default function FractionInput({ mode, onValueChange, onEnter }) {
  // 입력 순서는 교과서대로 자연수 → 분모 → 분자. (화면 배치는 분자가 위)
  // '다음 칸', Tab·→, 빈 칸에서 지우기로 되돌아가는 순서 모두 이 순서를 따른다.
  const fields = mode === 'integer' ? ['int'] : ['int', 'den', 'num']
  const [vals, setVals] = useState({ int: '', num: '', den: '' })
  const [active, setActive] = useState(fields[0])
  const refs = { int: useRef(null), num: useRef(null), den: useRef(null) }

  useEffect(() => {
    const { int, num, den } = vals
    let assembled = ''
    let valid = false
    if (mode === 'integer') {
      assembled = int
      valid = int.length > 0
    } else if (mode === 'fraction') {
      if (num && den) {
        assembled = int ? `${int}과${num}/${den}` : `${num}/${den}`
        valid = true
      } else if (int && !num && !den) {
        // 자연수만 입력해도 정수 형태로 인정 (예: 1, 2)
        assembled = int
        valid = true
      }
    }
    onValueChange(assembled, valid)
  }, [vals, mode, onValueChange])

  const typeDigit = useCallback((d) => {
    setVals((v) => {
      const cur = v[active]
      if (cur.length >= MAX_DIGITS[active]) return v
      if (cur === '0') return { ...v, [active]: d } // 앞자리 0은 바꿔 쓴다
      return { ...v, [active]: cur + d }
    })
    sfx.tick()
    popEl(refs[active].current)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const backspace = useCallback(() => {
    if (vals[active]) {
      setVals((v) => ({ ...v, [active]: v[active].slice(0, -1) }))
    } else {
      // 빈 칸에서 지우면 앞 칸으로 돌아간다
      const i = fields.indexOf(active)
      if (i > 0) setActive(fields[i - 1])
    }
  }, [active, vals]) // eslint-disable-line react-hooks/exhaustive-deps

  const move = useCallback((dir) => {
    const i = fields.indexOf(active)
    setActive(fields[(i + dir + fields.length) % fields.length])
    sfx.select()
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearAll = () => setVals({ int: '', num: '', den: '' })

  // 컴퓨터 키보드 — 숫자, 지우기, 칸 이동, 제출
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); typeDigit(e.key) }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
      else if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) { if (fields.length > 1) { e.preventDefault(); move(1) } }
      else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) { if (fields.length > 1) { e.preventDefault(); move(-1) } }
      else if (e.key === 'Enter') { e.preventDefault(); onEnter?.() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [typeDigit, backspace, move, onEnter, fields.length])

  const pick = (f) => { setActive(f); sfx.select() }

  // 폰에선 2줄×6칸(1–5 ⌫ / 6–9 0 →), 넓은 화면에선 익숙한 3×4 배치.
  // 4줄이면 작은 폰에서 문제·입력칸·키패드·제출 버튼이 한 화면에 안 들어간다.
  // 같은 버튼을 두 배치에서 쓰려고 order만 바꾼다.
  const ORDER = {
    1: 'order-1', 2: 'order-2', 3: 'order-3', 4: 'order-4', 5: 'order-5',
    6: 'order-7 sm:order-6', 7: 'order-8 sm:order-7', 8: 'order-9 sm:order-8', 9: 'order-10 sm:order-9',
  }
  const keypad = (
    <div className="grid grid-cols-6 sm:grid-cols-3 gap-1.5 sm:gap-2 w-full sm:max-w-[18rem] mx-auto mt-2 sm:mt-3" role="group" aria-label="숫자 키패드">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <Key key={d} order={ORDER[d]} onPress={() => typeDigit(d)}>{d}</Key>
      ))}
      <Key order="order-6 sm:order-10" tone="action" onPress={backspace} ariaLabel="한 글자 지우기">⌫</Key>
      <Key order="order-11" onPress={() => typeDigit('0')}>0</Key>
      {fields.length > 1 ? (
        <Key order="order-12" tone="action" onPress={() => move(1)} ariaLabel="다음 칸">
          <span className="text-sm sm:text-base leading-none">
            <span className="sm:hidden">다음<br />칸 →</span>
            <span className="hidden sm:inline">다음 칸 →</span>
          </span>
        </Key>
      ) : (
        <Key order="order-12" tone="action" onPress={clearAll} ariaLabel="모두 지우기">
          <span className="text-sm sm:text-base leading-none">
            <span className="sm:hidden">모두<br />지움</span>
            <span className="hidden sm:inline">모두 지움</span>
          </span>
        </Key>
      )}
    </div>
  )

  if (mode === 'integer') {
    return (
      <div className="flex flex-col items-center">
        <Box value={vals.int} active wide onSelect={() => {}} ariaLabel="정수 답" boxRef={refs.int} />
        <Label>답</Label>
        {keypad}
      </div>
    )
  }

  // 대분수는 정수부가 분수의 세로 중앙에 와야 한다. 열을 같은 높이로 늘리고
  // 자연수 칸은 남는 공간의 가운데, 라벨은 바닥에 붙인다.
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-bold text-amber-500 tracking-wide mb-0.5 sm:mb-1">
        자연수 → 분모 → 분자 순서로 써요
      </div>
      <div className="flex items-stretch justify-center gap-2 sm:gap-3">
        <div className="flex flex-col items-center">
          <div className="flex-1 flex items-center">
            <Box value={vals.int} active={active === 'int'} wide onSelect={() => pick('int')}
              ariaLabel="대분수의 자연수 부분" boxRef={refs.int} />
          </div>
          <Label>자연수</Label>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex-1 flex items-center">
            <span className={`font-bold text-lg ${vals.int ? 'text-amber-800' : 'text-amber-800/35'}`}>
              {mixedParticle(vals.int)}
            </span>
          </div>
          <Label hidden>·</Label>
        </div>

        <div className="flex flex-col items-center">
          <div className="inline-flex flex-col items-center gap-1.5">
            <Box value={vals.num} active={active === 'num'} onSelect={() => pick('num')} ariaLabel="분자" boxRef={refs.num} />
            <div className="w-16 sm:w-20 h-1 bg-amber-700 rounded" />
            <Box value={vals.den} active={active === 'den'} onSelect={() => pick('den')} ariaLabel="분모" boxRef={refs.den} />
          </div>
          <Label>분자 / 분모</Label>
        </div>
      </div>
      {keypad}
    </div>
  )
}
