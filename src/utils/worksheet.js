// 오답 문제지 — 인쇄용 묶음과 알림장에 붙여 넣을 글.
export const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧']

export function answerLine(q) {
  if (q.type === 'multiple_choice') return `${CIRCLED[q.answer] || q.answer + 1} ${q.choices?.[q.answer] ?? ''}`.trim()
  return String(q.answer).split(/[,，]/)[0].trim()
}

const today = () => {
  const d = new Date()
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

// answers: 'end' 맨 뒤에 정답 | 'inline' 문제마다 정답 | 'none' 정답 없이
export function worksheetText({ title, subtitle = '', questions, answers = 'end' }) {
  const lines = [`📒 ${title} (${today()})`]
  if (subtitle) lines.push(subtitle)
  lines.push('')
  questions.forEach((q, i) => {
    lines.push(`${i + 1}. ${q.question}`)
    if (q.type === 'multiple_choice') lines.push(`   ${q.choices.map((c, j) => `${CIRCLED[j]} ${c}`).join('   ')}`)
    else lines.push('   답: ________')
    if (answers === 'inline') lines.push(`   → 정답: ${answerLine(q)}`)
    lines.push('')
  })
  if (answers === 'end') {
    lines.push('[정답과 풀이]')
    questions.forEach((q, i) => lines.push(`${i + 1}. ${answerLine(q)}${q.explanation ? ` — ${q.explanation}` : ''}`))
  }
  return lines.join('\n').trim()
}
