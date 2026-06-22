// 게임 진행 상태를 localStorage에 저장·복구. 라운드 사이(phase='rolling')에만 스냅샷 저장.

const KEY = 'boomarble_save_v1'
const LAST_SETUP_KEY = 'boomarble_last_setup_v1'

// 영구 저장에 포함할 필드만 추림 — 모달/문제 등 transient 상태 제외.
const SNAPSHOT_KEYS = [
  'players',
  'currentTurn',
  'ownership',
  'welfarePool',
  'usedQuestions',
  'currentRound',
  'turnLimit',
  'startMoney',
  'modeId',
]

export function persistSnapshot(state) {
  if (typeof window === 'undefined') return true
  try {
    const data = {}
    for (const k of SNAPSHOT_KEYS) data[k] = state[k]
    data.savedAt = Date.now()
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    // 시크릿 모드 / quota 초과 / disabled storage
    return false
  }
}

export function loadSnapshot() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.players) || data.players.length < 2) return null
    return data
  } catch {
    return null
  }
}

export function clearSnapshot() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

export function hasSnapshot() {
  return loadSnapshot() !== null
}

// 마지막 게임 설정 (플레이어/모드/문제 세트) 저장 — '같은 친구들로 다시'용
export function persistLastSetup({ players, modeId, setId }) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LAST_SETUP_KEY, JSON.stringify({
      players: players.map((p) => ({ name: p.name, avatar: p.avatar })),
      modeId,
      setId,
      savedAt: Date.now(),
    }))
  } catch { /* ignore */ }
}

export function loadLastSetup() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LAST_SETUP_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.players) || data.players.length < 2) return null
    return data
  } catch {
    return null
  }
}
