// HWPX 자체 파서. HWPX는 ZIP + OWPML XML 구조.
// Contents/section*.xml에서 표(tbl) 노드를 추출하고 셀의 텍스트를 모아 행으로 만든다.
// 네임스페이스 prefix(hp:, hp10: 등) 변동 대비 localName 기반 탐색.

import JSZip from 'jszip'
import { rowsToQuestions } from './templateSchema.js'

const SECTION_PATTERN = /^Contents\/section\d+\.xml$/i

export async function parseHwpx(file) {
  const buffer = await file.arrayBuffer()
  let zip
  try {
    zip = await JSZip.loadAsync(buffer)
  } catch {
    throw new Error('HWPX 파일을 열 수 없습니다. (.hwpx ZIP 구조 손상)')
  }

  const sectionNames = Object.keys(zip.files)
    .filter((name) => SECTION_PATTERN.test(name))
    .sort()

  if (sectionNames.length === 0) {
    throw new Error('HWPX 안에 Contents/section*.xml을 찾을 수 없습니다. .hwp가 아닌 .hwpx인지 확인하세요.')
  }

  const allRows = []
  for (const name of sectionNames) {
    const xml = await zip.file(name).async('string')
    const doc = new DOMParser().parseFromString(xml, 'text/xml')

    const parserError = doc.getElementsByTagName('parsererror')
    if (parserError.length > 0) continue // XML 파싱 실패 섹션은 건너뜀

    const tables = elementsByLocalName(doc, 'tbl')
    for (const table of tables) {
      const rows = elementsByLocalName(table, 'tr')
      for (const tr of rows) {
        const cells = elementsByLocalName(tr, 'tc').map(extractCellText)
        allRows.push(cells)
      }
    }
  }

  if (allRows.length === 0) {
    throw new Error('HWPX 안에서 표를 찾지 못했습니다. 문제 표가 포함되어 있는지 확인하세요.')
  }

  return rowsToQuestions(allRows, 'hwpx')
}

function elementsByLocalName(root, localName) {
  const result = []
  const all = root.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) result.push(all[i])
  }
  return result
}

function extractCellText(cell) {
  // <hp:t> 노드들의 텍스트를 단락 단위로 결합
  const paragraphs = elementsByLocalName(cell, 'p')
  if (paragraphs.length === 0) {
    return cell.textContent.replace(/\s+/g, ' ').trim()
  }
  return paragraphs
    .map((p) => elementsByLocalName(p, 't').map((t) => t.textContent).join(''))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
}
