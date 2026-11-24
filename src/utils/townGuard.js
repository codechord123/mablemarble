// 학생 마을 기록 지키기 — 기록이 뒤로 가지 않게 한다.
// 새 기기·브라우저 기록 지움·다른 디벗처럼 이 기기에 마을이 없으면 빈 마을로 시작하는데,
// 그 빈 마을이 계정(서버)에 저장된 진짜 기록을 덮어쓰면 안 된다.
// 받은 손님 수·지난 날 수·짝꿍 계산은 줄어드는 일이 없으니, 이 숫자가 더 작은 쪽은 '뒤처진 기록'이다.

export function townProgress(t) {
  if (!t) return { pair: 0, days: 0, served: 0 }
  return {
    pair: t.pair?.done || 0,
    days: t.days || 0,
    served: (t.served || 0) + (t.dayInProgress?.stats?.served || 0),
  }
}

// a가 b보다 뒤처졌나 (장사 기록 기준)
export function isBehind(a, b) {
  const x = townProgress(a)
  const y = townProgress(b)
  return x.days < y.days || (x.days === y.days && x.served < y.served)
}

// 문제별 기록은 두 기기 것을 합친다 (같은 때·같은 문제는 하나로)
function mergeLog(a = [], b = []) {
  const seen = new Set()
  const out = []
  for (const e of [...a, ...b]) {
    const k = `${e.t}|${e.l}|${e.q}|${e.r}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out.sort((x, y) => (x.t || 0) - (y.t || 0)).slice(-600)
}

// 건물은 칸마다 합친다 — 더 나중에 짓거나 키운(at) 쪽, 판 기록(removed)이 더 나중이면 없앤다.
// 예전엔 '장사가 더 앞선 마을'을 통째로 골라서, 다른 기기에서 지은 건물·산 땅이 빠졌다.
export function mergeBuilt(baseBuilt = {}, otherBuilt = {}, removed = {}) {
  const out = {}
  for (const k of new Set([...Object.keys(baseBuilt), ...Object.keys(otherBuilt)])) {
    const a = baseBuilt[k]
    const b = otherBuilt[k]
    const pick = !a ? b : !b ? a : (b.at || 0) > (a.at || 0) ? b : a
    const gone = removed[k] || 0
    if (gone && gone >= (pick.at || 0)) continue // 판 뒤로 다시 지은 적 없으면 없앤다
    out[k] = pick
  }
  return out
}
const union = (x = [], y = []) => [...new Set([...x, ...y])]
function maxMap(x = {}, y = {}) {
  const out = { ...x }
  for (const [k, v] of Object.entries(y)) out[k] = Math.max(out[k] || 0, v || 0)
  return out
}
function bestRecords(x = {}, y = {}) {
  const out = { ...x }
  for (const [k, v] of Object.entries(y)) if (!out[k] || (v?.secs ?? Infinity) < (out[k].secs ?? Infinity)) out[k] = v
  return out
}

// incoming(이 기기에서 저장하려는 마을)과 saved(계정에 있는 마을)를 합친 결과.
// 장사 기록(돈·하던 장사)은 더 앞선 쪽, 건물은 칸마다 최신, 땅·지도·받은 목표는 양쪽 모두,
// 짝꿍 계산은 더 많이 푼 쪽, 문제별 기록은 둘 다, 차시 기록은 더 빠른 것.
export function safeTown(incoming, saved) {
  if (!saved) return incoming
  if (!incoming) return saved
  const behind = isBehind(incoming, saved)
  const base = behind ? saved : incoming
  const other = behind ? incoming : saved
  const pi = incoming.pair
  const ps = saved.pair
  const pair = (ps?.done || 0) > (pi?.done || 0) ? ps : pi
  const removed = maxMap(saved.removed, incoming.removed)
  const out = {
    ...base,
    built: mergeBuilt(base.built, other.built, removed),
    zones: union(base.zones, other.zones),
    maps: union(base.maps, other.maps),
    claimed: union(base.claimed, other.claimed),
    records: bestRecords(base.records, other.records),
    met: maxMap(base.met, other.met),
  }
  if (Object.keys(removed).length) out.removed = removed
  if (pair) out.pair = pair
  if (incoming.log || saved.log) out.log = mergeLog(saved.log, incoming.log)
  return out
}
