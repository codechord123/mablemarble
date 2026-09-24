// 왼쪽 아래 소리 버튼 두 개 — 음악과 효과음을 따로 끈다.
// 수업 중 선생님이 음악만 끄고 효과음은 남기고 싶을 때가 있다.

import { useEffect, useState } from 'react'
import { setMuted, isMuted } from '../../utils/sounds.js'
import { isMusicOff, setMusicOff, onMusicChange } from '../../utils/bgm.js'

const SFX_KEY = 'boomarble_sfx_off'

function RoundButton({ on, onClick, label, iconOn, iconOff }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={`h-11 w-11 rounded-full shadow-lg border text-lg transition-colors ${
        on ? 'bg-white/90 hover:bg-white border-amber-200' : 'bg-gray-200/90 border-gray-300 opacity-80'
      }`}
    >
      {on ? iconOn : iconOff}
    </button>
  )
}

export default function MuteToggle() {
  const [sfxOn, setSfxOn] = useState(() => {
    let saved = false
    try { saved = localStorage.getItem(SFX_KEY) === '1' } catch { /* ignore */ }
    if (saved) setMuted(true)
    return !(saved || isMuted())
  })
  const [musicOn, setMusicOn] = useState(!isMusicOff())

  useEffect(() => onMusicChange((off) => setMusicOn(!off)), [])

  const toggleSfx = () => {
    const next = !sfxOn
    setMuted(!next)
    setSfxOn(next)
    try { localStorage.setItem(SFX_KEY, next ? '0' : '1') } catch { /* ignore */ }
  }

  return (
    <div className="fixed bottom-3 left-3 z-30 flex flex-col gap-2">
      <RoundButton on={musicOn} onClick={() => setMusicOff(musicOn)}
        label={musicOn ? '배경음악 끄기' : '배경음악 켜기'} iconOn="🎵" iconOff="🎵" />
      <RoundButton on={sfxOn} onClick={toggleSfx}
        label={sfxOn ? '효과음 끄기' : '효과음 켜기'} iconOn="🔊" iconOff="🔇" />
    </div>
  )
}
