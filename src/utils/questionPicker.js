import sampleQuestions from '../data/sampleQuestions.json'

// 난이도에 맞는 미사용 문제 우선 선택. 없으면 인접 난이도 → 전체 → 풀 리셋 순으로 폴백.
// pool은 외부에서 주입 가능 (기본은 샘플). Phase 2 이후 사용자 업로드 풀 사용.
export function pickQuestion(difficulty = 1, usedIds = [], pool = sampleQuestions) {
  const used = new Set(usedIds)

  const exact = pool.filter((q) => q.difficulty === difficulty && !used.has(q.id))
  if (exact.length > 0) return { question: random(exact), poolReset: false }

  const adjacent = pool.filter(
    (q) => Math.abs(q.difficulty - difficulty) <= 1 && !used.has(q.id),
  )
  if (adjacent.length > 0) return { question: random(adjacent), poolReset: false }

  const anyUnused = pool.filter((q) => !used.has(q.id))
  if (anyUnused.length > 0) return { question: random(anyUnused), poolReset: false }

  // 풀 완전 소진 → 리셋
  return { question: random(pool), poolReset: true }
}

// 답안 한 개를 정규화하고 동등한 다른 표현(가분수↔대분수)도 함께 반환
// '과'/'와' 모두 인식하고 내부적으로 '과'로 통일
function expandForms(raw) {
  let str = String(raw).replace(/\s+/g, '').toLowerCase()
  // '와' → '과' 통일 (학생이 어느 쪽으로 입력해도 OK)
  str = str.replace(/와/g, '과')
  // "0과5/12" → "5/12" (자연수에 0 입력한 경우)
  str = str.replace(/^0과/, '')
  // 숫자 앞 0 정리 ("01/02" → "1/2", "1과07/10" → "1과7/10")
  str = str.replace(/^(\d+)과(\d+)\/(\d+)$/, (_, i, n, d) => `${+i}과${+n}/${+d}`)
  str = str.replace(/^(\d+)\/(\d+)$/, (_, n, d) => `${+n}/${+d}`)
  str = str.replace(/^0+(\d)/, '$1')

  const forms = new Set([str])

  // 대분수 → 가분수 자동 추가
  const mixed = str.match(/^(\d+)과(\d+)\/(\d+)$/)
  if (mixed) {
    const i = +mixed[1], n = +mixed[2], d = +mixed[3]
    if (d > 0) forms.add(`${i * d + n}/${d}`)
  }

  // 가분수 → 대분수 자동 추가 (분자 >= 분모인 경우)
  const frac = str.match(/^(\d+)\/(\d+)$/)
  if (frac) {
    const n = +frac[1], d = +frac[2]
    if (d > 0 && n >= d) {
      const intP = Math.floor(n / d)
      const rem = n % d
      forms.add(rem === 0 ? String(intP) : `${intP}과${rem}/${d}`)
    }
  }

  return forms
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function isCorrect(question, answer) {
  if (question.type === 'short_answer') {
    const allowed = new Set()
    String(question.answer)
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => expandForms(s).forEach((f) => allowed.add(f)))
    const userForms = expandForms(answer)
    for (const u of userForms) {
      if (allowed.has(u)) return true
    }
    return false
  }
  return Number(answer) === Number(question.answer)
}
