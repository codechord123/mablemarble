// 왼쪽 아래 소리 버튼 — 배경음악과 효과음을 따로 켜고 끈다. 모든 화면에 떠 있다.
// 수업 중 선생님이 음악만 끄고 효과음은 남기고 싶을 때가 있다.
// 켜짐/꺼짐이 아이콘 모양뿐 아니라 글자·색으로도 바로 보이게 한다.

import { useEffect, useState } from 'react'
import { setMuted, isMuted } from '../../utils/sounds.js'
import { isMusicOff, setMusicOff, onMusicChange } from '../../utils/bgm.js'

const SFX_KEY = 'boomarble_sfx_off'

function Switch({ on, onClick, label, icon, iconOff, name }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      title={label}
      className={`flex h-10 items-center gap-1.5 rounded-full border pl-2.5 pr-3 text-sm font-extrabold shadow-lg transition active:scale-95 ${
        on ? 'border-amber-200 bg-white/95 text-amber-900 hover:bg-white' : 'border-gray-300 bg-gray-200/95 text-gray-500'
      }`}
    >
      <span className="text-lg leading-none">{on ? icon : iconOff}</span>
      <span className="leading-none">{name}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none text-white ${on ? 'bg-emerald-500' : 'bg-gray-400'}`}
      >
        {on ? '켜짐' : '꺼짐'}
      </span>
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
    <div className="fixed bottom-3 left-3 z-30 flex flex-col items-start gap-1.5" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
      <Switch on={musicOn} onClick={() => setMusicOff(musicOn)} name="음악"
        label={musicOn ? '배경음악 끄기' : '배경음악 켜기'} icon="🎵" iconOff="🔕" />
      <Switch on={sfxOn} onClick={toggleSfx} name="효과음"
        label={sfxOn ? '효과음 끄기' : '효과음 켜기'} icon="🔊" iconOff="🔇" />
    </div>
  )
}
