import { describe, it, expect } from 'vitest'
import { townMissions, townSummary } from '../src/account/classStats.js'

const town = (o) => ({ days: 1, served: 30, pair: { done: 0 }, records: {}, log: [], ...o })
const rows = [
  { uid: 'a', name: '가', town: town({ pair: { done: 50 }, records: { dn1: { secs: 300, stars: 3 }, dn2: { secs: 900, stars: 2 } } }) },
  { uid: 'b', name: '나', town: town({ pair: { done: 23 }, dayInProgress: { type: 'dn1', stats: { served: 12 } } }) },
  { uid: 'c', name: '다', town: town({ pair: { done: 5 }, log: Array.from({ length: 50 }, (_, i) => ({ t: i, l: 'pair', q: `${i}`, r: 1 })) }) },
  { uid: 'd', name: '라' }, // 마을을 아직 시작 안 함
]

describe('선생님 화면 — 소수 마을 미션 현황', () => {
  it('짝꿍 통과는 게임과 같은 기준(문제별 기록 포함)', () => {
    expect(townSummary(rows[2].town).pairDone).toBe(50)
    const m = townMissions(rows)
    expect(m).toMatchObject({ total: 4, started: 3, pairPassed: 2 })
  })
  it('차시별 성공·★★★·하는 중', () => {
    const m = townMissions(rows)
    const dn1 = m.lessons.find((l) => l.type === 'dn1')
    expect(dn1).toMatchObject({ name: '2차시', done: 1, stars3: 1, playing: 1 })
    expect(m.lessons.find((l) => l.type === 'dn2')).toMatchObject({ done: 1, stars3: 0 })
    expect(m.lessons).toHaveLength(8)
  })
  it('학생은 이름순, 시작 안 한 학생도 목록에 있다', () => {
    const m = townMissions(rows)
    expect(m.students.map((x) => x.name)).toEqual(['가', '나', '다', '라'])
    expect(m.students[3].t).toBe(null)
  })
})
