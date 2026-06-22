// 텍스트 안의 분수 패턴(예: "1/2", "1과 2/3")을 분자/분모 박스로 시각화.
// 정수/연산자/한글은 그대로 두고 분수만 변환.

function Fraction({ num, den }) {
  return (
    <span
      className="inline-flex flex-col items-center text-center align-middle mx-0.5 leading-none"
      style={{ verticalAlign: '-0.4em', fontSize: '0.95em' }}
    >
      <span className="px-1.5">{num}</span>
      <span className="border-t border-current w-full" />
      <span className="px-1.5">{den}</span>
    </span>
  )
}

// 매치 우선순위: 대분수 (NUM과 NUM/NUM 또는 NUM와 NUM/NUM) → 단순 분수 (NUM/NUM)
// '과'(표준)와 '와'(잘못 입력) 모두 인식
const REGEX = /(\d+)[과와]\s*(\d+)\/(\d+)|(\d+)\/(\d+)/g

export default function MathText({ children, className }) {
  if (children == null) return null
  const text = String(children)

  const tokens = []
  let i = 0
  let m
  REGEX.lastIndex = 0
  while ((m = REGEX.exec(text)) !== null) {
    if (m.index > i) tokens.push({ type: 'text', value: text.slice(i, m.index) })
    if (m[1] !== undefined) {
      tokens.push({ type: 'mixed', int: m[1], num: m[2], den: m[3] })
    } else {
      tokens.push({ type: 'frac', num: m[4], den: m[5] })
    }
    i = REGEX.lastIndex
  }
  if (i < text.length) tokens.push({ type: 'text', value: text.slice(i) })

  return (
    <span className={className}>
      {tokens.map((t, idx) => {
        if (t.type === 'text') return <span key={idx}>{t.value}</span>
        if (t.type === 'frac') return <Fraction key={idx} num={t.num} den={t.den} />
        return (
          <span key={idx} className="inline-flex items-center whitespace-nowrap">
            <span>{t.int}과</span>
            <Fraction num={t.num} den={t.den} />
          </span>
        )
      })}
    </span>
  )
}
