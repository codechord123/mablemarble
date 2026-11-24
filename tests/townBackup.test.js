import { describe, it, expect, beforeEach } from 'vitest'
import { backupTown, listBackups, missingFrom } from '../src/utils/townBackup.js'

const store = {}
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k]
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) }, removeItem: (k) => { delete store[k] } }
})

describe('마을 백업', () => {
  const town = (built, zones = [], maps = []) => ({ built, zones, maps, days: 1, served: 30 })
  it('모양이 바뀔 때만 남기고, 최근 것부터 보여 준다', () => {
    backupTown('kid', town({ '2,2': { kind: 'shop', id: 'candyshop', lv: 1 } }))
    backupTown('kid', town({ '2,2': { kind: 'shop', id: 'candyshop', lv: 1 } }))
    backupTown('kid', town({ '2,2': { kind: 'shop', id: 'candyshop', lv: 1 }, '1,1': { kind: 'decor', id: 'tree' } }, ['a']))
    const list = listBackups('kid')
    expect(list).toHaveLength(2)
    expect(Object.keys(list[0].built)).toHaveLength(2)
    expect(listBackups('other')).toEqual([])
  })
  it('빠진 건물·땅·지도, 레벨이 낮아진 가게를 찾는다 (지금 있는 건 그대로)', () => {
    const snap = { built: { '2,2': { kind: 'shop', id: 'candyshop', lv: 3 }, '1,1': { kind: 'decor', id: 'tree' }, '4,2': { kind: 'shop', id: 'donutshop', lv: 1 } }, zones: ['a', 'b'], maps: ['beach'] }
    const now = { built: { '2,2': { kind: 'shop', id: 'candyshop', lv: 1 }, '4,2': { kind: 'shop', id: 'bakery', lv: 1 } }, zones: ['a'], maps: [] }
    const m = missingFrom(now, snap)
    expect(Object.keys(m.built).sort()).toEqual(['1,1', '2,2'])
    expect(m.zones).toEqual(['b'])
    expect(m.maps).toEqual(['beach'])
  })
})
