import { useState } from 'react'
import { setMuted, isMuted } from '../../utils/sounds.js'

export default function MuteToggle() {
  const [muted, setLocal] = useState(isMuted())

  const toggle = () => {
    const next = !muted
    setMuted(next)
    setLocal(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? '효과음 켜기' : '효과음 끄기'}
      title={muted ? '효과음 켜기' : '효과음 끄기'}
      className="fixed bottom-3 left-3 z-30 h-11 w-11 rounded-full bg-white/90 shadow-lg hover:bg-white text-lg border border-amber-200"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
