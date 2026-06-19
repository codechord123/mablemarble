// Web Audio API로 즉석 생성하는 효과음. 오디오 파일 의존성 없음.
// 모바일 자동재생 정책을 위해 첫 사용자 상호작용 이후에만 작동.

let ctx = null
let muted = false

function ensureCtx() {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    return ctx
  } catch {
    return null
  }
}

function tone(freq, duration = 200, type = 'sine', volume = 0.08, delay = 0) {
  const c = ensureCtx()
  if (!c || muted) return
  const now = c.currentTime + delay / 1000
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  gain.gain.setValueAtTime(volume, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000)
  osc.connect(gain).connect(c.destination)
  osc.start(now)
  osc.stop(now + duration / 1000)
}

export const sfx = {
  dice() {
    tone(440, 70, 'square', 0.06)
    tone(660, 70, 'square', 0.06, 80)
    tone(880, 100, 'square', 0.06, 160)
  },
  correct() {
    tone(523, 120, 'triangle', 0.1)
    tone(659, 120, 'triangle', 0.1, 120)
    tone(784, 200, 'triangle', 0.1, 240)
  },
  wrong() {
    tone(200, 350, 'sawtooth', 0.08)
  },
  coin() {
    tone(880, 80, 'sine', 0.08)
    tone(1320, 120, 'sine', 0.08, 80)
  },
  card() {
    tone(660, 120, 'triangle', 0.07)
    tone(880, 120, 'triangle', 0.07, 120)
  },
  victory() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => tone(f, 200, 'triangle', 0.1, i * 130))
  },
  bankrupt() {
    tone(330, 200, 'sawtooth', 0.08)
    tone(220, 300, 'sawtooth', 0.08, 200)
  },
}

export function setMuted(value) {
  muted = !!value
}

export function isMuted() {
  return muted
}
