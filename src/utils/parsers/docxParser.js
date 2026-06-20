// 브라우저 빌드를 직접 import — 기본 'mammoth'는 Node용이라 Vite 빌드에서 fs 모듈 에러 발생
import mammoth from 'mammoth/mammoth.browser.js'
import { rowsToQuestions } from './templateSchema.js'

export async function parseDocx(file) {
  const buffer = await file.arrayBuffer()
  let result
  try {
    result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  } catch {
    throw new Error('DOCX 파일을 열 수 없습니다. 손상되었거나 지원되지 않는 형식입니다.')
  }

  const html = result.value
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const tables = doc.querySelectorAll('table')

  const rows = []
  for (const table of tables) {
    for (const tr of table.querySelectorAll('tr')) {
      const cells = [...tr.querySelectorAll('td, th')].map((c) =>
        c.textContent.replace(/\s+/g, ' ').trim(),
      )
      rows.push(cells)
    }
  }

  if (rows.length === 0) {
    throw new Error('DOCX 안에서 표를 찾지 못했습니다.')
  }

  return rowsToQuestions(rows, 'docx')
}
