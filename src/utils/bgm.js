// 배경음악. 한 곡을 반복 재생한다.
// - 브라우저는 사용자가 한 번이라도 화면을 누르기 전에는 소리를 막으므로,
//   첫 터치·클릭·키 입력 때 재생을 시작한다.
// - 문제를 푸는 동안에는 음량을 낮춰 집중을 돕는다(duck).
// - 다른 탭으로 가면 멈추고, 돌아오면 이어서 튼다.
// - 켜고 끈 상태는 브라우저에 기억한다.

import src from '../assets/audio/bgm-across-the-painted-map.mp3'

const KEY = 'boomarble_music_off'
const VOLUME = 0.32
const DUCKED = 0.1

let audio = null
let off = readOff()
let ducked = false
let unlocked = false
let fadeTimer = null
const listeners = new Set()

function readOff() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

function target() {
  return ducked ? DUCKED : VOLUME
}

function ensure() {
  if (audio || typeof Audio === 'undefined') return audio
  audio = new Audio(src)
  audio.loop = true
  audio.preload = 'auto'
  audio.volume = 0
  return audio
}

// 음량을 부드럽게 옮긴다 — 뚝 끊기거나 갑자기 커지지 않게
function fadeTo(v, ms = 600, then) {
  const a = ensure()
  if (!a) return
  clearInterval(fadeTimer)
  const start = a.volume
  const steps = Math.max(1, Math.round(ms / 40))
  let i = 0
  fadeTimer = setInterval(() => {
    i += 1
    a.volume = Math.min(1, Math.max(0, start + ((v - start) * i) / steps))
    if (i >= steps) {
      clearInterval(fadeTimer)
      then?.()
    }
  }, 40)
}

function play() {
  const a = ensure()
  if (!a || off || document.hidden) return
  const p = a.play()
  if (p && typeof p.catch === 'function') p.catch(() => { /* 아직 허용 전 — 다음 입력 때 다시 */ })
  fadeTo(target(), 1200)
}

function pause() {
  if (!audio) return
  fadeTo(0, 400, () => audio.pause())
}

// 첫 사용자 입력에서 재생을 연다
function unlock() {
  if (unlocked) return
  unlocked = true
  play()
  window.removeEventListener('pointerdown', unlock)
  window.removeEventListener('keydown', unlock)
}

export function initMusic() {
  if (typeof window === 'undefined') return
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause()
    else if (unlocked) play()
  })
}

export function isMusicOff() {
  return off
}

export function setMusicOff(value) {
  off = !!value
  try { localStorage.setItem(KEY, off ? '1' : '0') } catch { /* ignore */ }
  if (off) pause()
  else if (unlocked) play()
  listeners.forEach((fn) => fn(off))
}

export function onMusicChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// 문제 풀이 중에는 작게
export function duckMusic(on) {
  if (ducked === !!on) return
  ducked = !!on
  if (audio && !audio.paused) fadeTo(target(), 500)
}
