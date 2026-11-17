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

// incoming(이 기기에서 저장하려는 마을)과 saved(계정에 있는 마을)를 합친 결과.
// 장사 기록이 더 앞선 쪽을 바탕으로 하고, 짝꿍 계산은 더 많이 푼 쪽, 문제별 기록은 둘 다.
export function safeTown(incoming, saved) {
  if (!saved) return incoming
  if (!incoming) return saved
  const base = isBehind(incoming, saved) ? saved : incoming
  const pi = incoming.pair
  const ps = saved.pair
  const pair = (ps?.done || 0) > (pi?.done || 0) ? ps : pi
  const out = { ...base }
  if (pair) out.pair = pair
  if (incoming.log || saved.log) out.log = mergeLog(saved.log, incoming.log)
  return out
}
