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
      className="fixed top-3 right-3 z-30 h-10 w-10 rounded-full bg-white/80 shadow hover:bg-white text-lg"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
