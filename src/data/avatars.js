// 캐릭터 아바타 10종 + 게임 시작 시 플레이어가 선택.

export const AVATARS = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐵', '🐸']

export const DEFAULT_AVATAR = '🐶'

export function nextAvailableAvatar(currentAvatars, current) {
  const used = new Set(currentAvatars.filter((a) => a !== current))
  const startIdx = AVATARS.indexOf(current)
  for (let i = 1; i <= AVATARS.length; i++) {
    const candidate = AVATARS[(startIdx + i) % AVATARS.length]
    if (!used.has(candidate)) return candidate
  }
  return current
}
