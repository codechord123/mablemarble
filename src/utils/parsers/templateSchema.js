// 모든 파서가 표(2차원 배열)를 받아 동일한 Question 객체로 변환하기 위한 공통 어댑터.
// 표 헤더: 번호 | 카테고리 | 난이도 | 유형 | 문제 | 보기1 | 보기2 | 보기3 | 보기4 | 정답 | 해설
// (기획서 4.4절 참고)

const HEADER_KEYS = [
  '번호', '카테고리', '난이도', '유형', '문제',
  '보기1', '보기2', '보기3', '보기4', '정답', '해설',
]

const TYPE_MAP = {
  '객관식': 'multiple_choice',
  '선택형': 'multiple_choice',
  '단답형': 'short_answer',
  '주관식': 'short_answer',
  'OX':    'true_false',
  'O/X':   'true_false',
  'ox':    'true_false',
}

export function rowsToQuestions(rows, source = 'unknown') {
  if (!rows || rows.length < 2) {
    return { questions: [], errors: ['표가 비어있거나 데이터 행이 없습니다.'], source }
  }

  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    return {
      questions: [],
      errors: ['표 헤더 행(번호/카테고리/문제/정답...)을 찾을 수 없습니다. 템플릿을 확인하세요.'],
      source,
    }
  }

  const idx = mapHeaderColumns(rows[headerIdx])
  if (idx['문제'] === -1 || idx['정답'] === -1) {
    return {
      questions: [],
      errors: ['헤더에 "문제" 또는 "정답" 열이 없습니다.'],
      source,
    }
  }

  const questions = []
  const errors = []

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.every((c) => !String(c ?? '').trim())) continue

    try {
      questions.push(rowToQuestion(row, idx, r))
    } catch (e) {
      errors.push(`행 ${r + 1}: ${e.message}`)
    }
  }

  return { questions, errors, source }
}

function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const joined = (rows[i] || []).map((c) => String(c ?? '').replace(/\s/g, ''))
    if (joined.some((c) => c.includes('문제')) && joined.some((c) => c.includes('정답'))) {
      return i
    }
  }
  return -1
}

function mapHeaderColumns(headerRow) {
  const out = Object.fromEntries(HEADER_KEYS.map((k) => [k, -1]))
  for (const key of HEADER_KEYS) {
    const i = headerRow.findIndex(
      (cell) => String(cell ?? '').replace(/\s/g, '').includes(key),
    )
    out[key] = i
  }
  return out
}

function rowToQuestion(row, idx, rowNum) {
  const get = (key) => (idx[key] >= 0 ? String(row[idx[key]] ?? '').trim() : '')

  const questionText = get('문제')
  if (!questionText) throw new Error('문제 텍스트가 비어있습니다.')

  const typeRaw = get('유형').trim()
  const type = TYPE_MAP[typeRaw] || (typeRaw ? guessType(typeRaw) : 'multiple_choice')

  const choices = []
  for (const k of ['보기1', '보기2', '보기3', '보기4']) {
    const v = get(k)
    if (v) choices.push(v)
  }

  const answerRaw = get('정답')
  if (!answerRaw) throw new Error('정답이 비어있습니다.')

  let answer
  if (type === 'multiple_choice') {
    if (choices.length < 2) throw new Error('객관식인데 보기가 2개 미만입니다.')
    const n = Number(answerRaw)
    if (!Number.isInteger(n) || n < 1 || n > choices.length) {
      throw new Error(`정답이 보기 번호 1~${choices.length} 범위를 벗어났습니다: "${answerRaw}"`)
    }
    answer = n - 1
  } else if (type === 'true_false') {
    if (choices.length === 0) choices.push('O', 'X')
    const n = Number(answerRaw)
    if (!Number.isInteger(n) || (n !== 1 && n !== 2)) {
      throw new Error(`OX 정답은 1(O) 또는 2(X)여야 합니다: "${answerRaw}"`)
    }
    answer = n - 1
  } else {
    answer = answerRaw
  }

  return {
    id: `q_${rowNum}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    number: Number(get('번호')) || rowNum,
    category: get('카테고리') || '기타',
    difficulty: clampDifficulty(Number(get('난이도'))),
    type,
    question: questionText,
    choices,
    answer,
    explanation: get('해설') || '',
  }
}

function clampDifficulty(d) {
  if (!Number.isFinite(d) || d < 1) return 1
  if (d > 3) return 3
  return Math.round(d)
}

function guessType(typeRaw) {
  const s = typeRaw.replace(/\s/g, '').toLowerCase()
  if (s.includes('o') && s.includes('x')) return 'true_false'
  if (s.includes('단답')) return 'short_answer'
  return 'multiple_choice'
}
