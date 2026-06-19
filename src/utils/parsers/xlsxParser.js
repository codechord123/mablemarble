import * as XLSX from 'xlsx'
import { rowsToQuestions } from './templateSchema.js'

export async function parseXlsx(file) {
  const buffer = await file.arrayBuffer()
  let workbook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    throw new Error('XLSX 파일을 열 수 없습니다. 손상되었거나 지원되지 않는 형식입니다.')
  }

  const rows = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const sheetRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    for (const row of sheetRows) {
      rows.push(row.map((c) => String(c ?? '').trim()))
    }
  }

  if (rows.length === 0) {
    throw new Error('XLSX 안에 데이터가 없습니다.')
  }

  return rowsToQuestions(rows, 'xlsx')
}
