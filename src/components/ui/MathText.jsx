// 텍스트 안의 분수 패턴(예: "1/2", "1과 2/3")을 분자/분모 박스로 시각화.
// 정수/연산자/한글은 그대로 두고 분수만 변환.

import { mixedParticle } from '../../utils/korean.js'

// 세로 정렬은 middle — 분수 상자의 가운데(=가로선)가 글자의 가운데 높이에 온다.
// 예전 값(-0.28em)은 분자의 바닥선을 글줄 아래로 내려서, 분자는 글자 줄에,
// 분모는 줄 밑에 매달린 모양이 됐다. 크기(0.7em)·행간(1)을 줄여 분수가 든
// 줄만 벌어지지 않게 한다.
function Fraction({ num, den }) {
  return (
    <span
      className="inline-flex flex-col items-center text-center tabular-nums"
      style={{ fontSize: '0.7em', lineHeight: 1, verticalAlign: 'middle', margin: '0 0.14em' }}
    >
      <span className="px-[0.3em]">{num}</span>
      <span
        className="block w-full bg-current rounded-full"
        style={{ height: '0.1em', margin: '0.08em 0' }}
      />
      <span className="px-[0.3em]">{den}</span>
    </span>
  )
}

// 대분수: 정수부를 살짝 크게, 분수부를 바로 옆에 붙여 교과서에 가까운 표기.
// 읽기 보조용 조사는 작고 옅게. '과/와'는 정수부의 받침에 따라 달라진다
// (2와 2분의 1, 1과 3분의 2) — 데이터에 뭐라 적혀 있든 읽는 대로 보여준다.
function Mixed({ int, num, den }) {
  return (
    // 정수부는 보통 글자처럼 바닥선에 두고, 분수만 가운데 정렬로 띄운다
    <span className="whitespace-nowrap">
      {int}
      <span className="text-[0.72em] opacity-60 mx-[0.1em] font-semibold">{mixedParticle(int)}</span>
      <Fraction num={num} den={den} />
    </span>
  )
}

// 매치 우선순위: 대분수 (NUM과 NUM/NUM 또는 NUM와 NUM/NUM) → 단순 분수 (NUM/NUM)
// 데이터에는 '과'/'와'가 섞여 있으므로 둘 다 받고, 표시는 mixedParticle이 정한다
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
