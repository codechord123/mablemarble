// 텍스트 안의 분수 패턴(예: "1/2", "1과 2/3")을 분자/분모 박스로 시각화.
// 정수/연산자/한글은 그대로 두고 분수만 변환.

function Fraction({ num, den }) {
  return (
    <span
      className="inline-flex flex-col items-center justify-center text-center align-middle tabular-nums leading-[1.05]"
      style={{ fontSize: '0.82em', verticalAlign: '-0.28em', margin: '0 0.12em' }}
    >
      <span className="px-[0.35em]">{num}</span>
      <span
        className="block w-full bg-current rounded-full"
        style={{ height: '0.09em', margin: '0.06em 0' }}
      />
      <span className="px-[0.35em]">{den}</span>
    </span>
  )
}

// 대분수: 정수부를 살짝 크게, 분수부를 바로 옆에 붙여 교과서에 가까운 표기.
// 읽기 보조용 '과'는 작고 옅게 표시.
function Mixed({ int, num, den }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap align-middle">
      <span>{int}</span>
      <span className="text-[0.72em] opacity-60 mx-[0.1em] font-semibold">과</span>
      <Fraction num={num} den={den} />
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
        return <Mixed key={idx} int={t.int} num={t.num} den={t.den} />
      })}
    </span>
  )
}
