// 마을 백업 — 이 기기에 마을 모습(건물·땅·지도)을 날마다 남겨 둔다.
// 건물이나 땅이 사라졌다고 할 때 '빠진 건물·땅 되살리기'로 되찾는다 (지금 있는 건 그대로 두고 빠진 것만 더한다).
const KEY = 'boomarble_town_backup_v1'
const KEEP = 10

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export const shapeOf = (t) => ({
  built: t.built || {},
  zones: t.zones || [],
  maps: t.maps || [],
  days: t.days || 0,
  served: t.served || 0,
})
const sig = (b) => JSON.stringify([Object.keys(b.built).sort(), [...b.zones].sort(), [...b.maps].sort()])

export function listBackups(who) {
  return (read()[who] || []).slice().reverse() // 최근 것부터
}

// 지금 마을을 백업에 남긴다 (바로 앞 백업과 모양이 같으면 건너뜀)
export function backupTown(who, town) {
  try {
    if (!town || !Object.keys(town.built || {}).length) return
    const all = read()
    const list = all[who] || []
    const snap = { at: Date.now(), ...shapeOf(town) }
    if (list.length && sig(list[list.length - 1]) === sig(snap)) return
    all[who] = [...list, snap].slice(-KEEP)
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* 저장 공간이 없으면 건너뜀 */
  }
}

// 백업에는 있는데 지금 마을에 없는 건물·땅·지도
export function missingFrom(town, snap) {
  // 없는 건물, 그리고 같은 가게인데 레벨이 낮아진 건물
  const built = Object.fromEntries(Object.entries(snap.built).filter(([k, v]) => {
    const now = town.built?.[k]
    return !now || (now.id === v.id && (v.lv || 1) > (now.lv || 1))
  }))
  return {
    built,
    zones: snap.zones.filter((z) => !(town.zones || []).includes(z)),
    maps: snap.maps.filter((m) => !(town.maps || []).includes(m)),
  }
}
