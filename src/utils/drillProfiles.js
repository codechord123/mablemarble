// 분수 곱셈 연습 기록 — 기기(브라우저)에 이름·캐릭터별로 저장한다.
// 교실 기기 한 대를 여럿이 쓰므로 계정 없이 '이름 + 캐릭터'로 구분한다.

const KEY = 'boomarble_drill_v1'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? JSON.parse(raw) : null
    return data && typeof data === 'object' && data.profiles ? data : { profiles: {} }
  } catch {
    return { profiles: {} }
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export const profileId = (name, avatar) => `${avatar}|${name.trim()}`

export function listProfiles() {
  return Object.values(readAll().profiles).sort((a, b) => b.xp - a.xp)
}

export function loadProfile(name, avatar) {
  const id = profileId(name, avatar)
  return readAll().profiles[id] || {
    id, name: name.trim(), avatar, xp: 0, solved: 0, correct: 0, bestStreak: 0, updatedAt: 0,
  }
}

export function saveProfile(profile) {
  const data = readAll()
  data.profiles[profile.id] = { ...profile, updatedAt: Date.now() }
  return writeAll(data)
}

export function deleteProfile(id) {
  const data = readAll()
  delete data.profiles[id]
  return writeAll(data)
}
