// Three.js로 그린 진짜 3D 주사위. 처음 쓸 때만 불러오는(lazy) 모듈이다.
// WebGL 캔버스는 하나만 만들어 두고, 주사위 칸이 다시 나타나면 그 칸에 옮겨 붙인다.
// (차례마다 새로 만들면 브라우저의 WebGL 개수 제한에 걸려 화면이 깨질 수 있다.)
import {
  CanvasTexture,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Vector3,
  WebGLRenderer,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { FACE_VALUES, bounceHeight, spinLeft, upQuaternion } from './dice3dMath.js'

const REST_X = [-0.72, 0.72]
const HALF = 0.5
const DROP = 1.2
const FOV = 30

// 3x3 칸 중 눈이 찍히는 자리
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

function faceTexture(value) {
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')
  const bg = g.createRadialGradient(S * 0.35, S * 0.3, S * 0.1, S / 2, S / 2, S * 0.75)
  bg.addColorStop(0, '#ffffff')
  bg.addColorStop(0.6, '#fbf6ec')
  bg.addColorStop(1, '#e9dfcb')
  g.fillStyle = bg
  g.fillRect(0, 0, S, S)
  const big = value === 1
  const r = big ? S * 0.15 : S * 0.085
  for (const i of PIPS[value]) {
    const x = S * (0.25 + (i % 3) * 0.25)
    const y = S * (0.25 + Math.floor(i / 3) * 0.25)
    // 살짝 파인 홈처럼 — 아래쪽 밝은 테, 안쪽은 위가 어두운 빨강
    g.beginPath()
    g.arc(x, y + r * 0.08, r * 1.08, 0, Math.PI * 2)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.fill()
    const pip = g.createRadialGradient(x - r * 0.25, y - r * 0.35, r * 0.1, x, y, r)
    pip.addColorStop(0, '#7f1d1d')
    pip.addColorStop(0.55, '#c81e1e')
    pip.addColorStop(1, '#ef4444')
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fillStyle = pip
    g.fill()
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

let ctx = null
let failed = false

function build() {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.style.display = 'block'

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1.6, 0.1, 50)
  camera.position.set(0, 4.5, 2.4)
  camera.lookAt(0, 0.3, 0.05)

  scene.add(new HemisphereLight(0xffffff, new Color('#d9c6a3'), 1.9))
  const sun = new DirectionalLight(0xffffff, 2.2)
  sun.position.set(-1.8, 6, 2.6)
  sun.castShadow = true
  sun.shadow.mapSize.set(512, 512)
  sun.shadow.camera.left = -3
  sun.shadow.camera.right = 3
  sun.shadow.camera.top = 3
  sun.shadow.camera.bottom = -3
  sun.shadow.radius = 4
  scene.add(sun)

  const ground = new Mesh(new PlaneGeometry(12, 12), new ShadowMaterial({ opacity: 0.28 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const geo = new RoundedBoxGeometry(1, 1, 1, 4, 0.16)
  const mats = FACE_VALUES.map(
    (v) => new MeshStandardMaterial({ map: faceTexture(v), roughness: 0.42, metalness: 0 }),
  )
  const dice = REST_X.map((x) => {
    const m = new Mesh(geo, mats)
    m.castShadow = true
    m.position.set(x, HALF, 0)
    scene.add(m)
    return m
  })

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    failed = true
    listeners.forEach((fn) => fn())
  })

  return { renderer, canvas, scene, camera, dice, host: null, ro: null, anim: null, raf: 0 }
}

const listeners = new Set()
// WebGL이 중간에 끊기면(메모리 부족 등) 알려 준다 — 그러면 예전 주사위로 돌아간다
export function onLost(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// 이 기기에서 3D 주사위를 쓸 수 있는지 — 처음 부를 때 캔버스를 만든다
export function init() {
  if (failed) return false
  if (ctx) return true
  try {
    ctx = build()
    return true
  } catch {
    failed = true
    return false
  }
}

function render() {
  if (ctx?.host) ctx.renderer.render(ctx.scene, ctx.camera)
}

function fit() {
  if (!ctx?.host) return
  // 캔버스는 칸보다 위·옆으로 조금 크다(CSS). 칸 안은 FOV로 맞추고, 넘친 부분은 그 바깥이
  // 이어서 보이게 — 더 큰 가상 화면의 일부를 그리는 식으로 맞춘다.
  const hostH = ctx.host.clientHeight
  const w = ctx.canvas.clientWidth || ctx.host.clientWidth
  const h = ctx.canvas.clientHeight || hostH
  if (!w || !h || !hostH) return
  const fullH = hostH + 2 * Math.max(0, h - hostH)
  const cam = ctx.camera
  cam.fov = (2 * Math.atan(Math.tan((FOV * Math.PI) / 360) * (fullH / hostH)) * 180) / Math.PI
  cam.aspect = w / fullH
  cam.setViewOffset(w, fullH, 0, 0, w, h)
  cam.updateProjectionMatrix()
  ctx.renderer.setSize(w, h, false)
  render()
}

export function attach(host) {
  if (!init() || !host) return false
  if (ctx.host !== host) {
    ctx.ro?.disconnect()
    ctx.host = host
    host.appendChild(ctx.canvas)
    ctx.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null
    ctx.ro?.observe(host)
  }
  fit()
  // 셰이더를 미리 준비해 첫 굴림이 끊기지 않게
  if (!ctx.compiled) {
    ctx.compiled = true
    ctx.renderer.compile(ctx.scene, ctx.camera)
  }
  return true
}

export function detach(host) {
  if (!ctx || ctx.host !== host) return
  ctx.ro?.disconnect()
  ctx.ro = null
  cancelAnimationFrame(ctx.raf)
  ctx.anim = null
  if (ctx.canvas.parentNode === host) host.removeChild(ctx.canvas)
  ctx.host = null
}

const jitter = (n) => (Math.random() * 2 - 1) * n

// 굴리지 않고 그 눈이 위를 보게 놓아 둔다
export function setRest(d1, d2) {
  if (!ctx) return
  ;[d1, d2].forEach((v, i) => {
    const m = ctx.dice[i]
    m.position.set(REST_X[i] + jitter(0.05), HALF, jitter(0.08))
    m.quaternion.copy(upQuaternion(v || 1, jitter(0.4)))
  })
  render()
}

const _q = new Quaternion()

// 굴린다 — durationS 동안 날아와 튕기다가 d1·d2가 위를 보며 멈춘다.
// onSlow: 화면이 너무 끊기면(느린 기기) 한 번 불린다.
export function roll(d1, d2, { durationS = 1.3, staggerS = 0.1, onSlow } = {}) {
  if (!ctx) return
  const start = performance.now()
  const plans = [d1, d2].map((v, i) => {
    const end = new Vector3(REST_X[i] + jitter(0.06), HALF, jitter(0.1))
    // 왼쪽 앞에서 던져 오른쪽 뒤로 굴러간다 (캔버스 밖으로 잘리지 않을 만큼만)
    const from = new Vector3(end.x - 1.05 - jitter(0.15), HALF, end.z + 0.35 + jitter(0.1))
    const dir = end.clone().sub(from).setY(0).normalize()
    // 굴러가는 방향으로 도는 축(살짝 비틀어서 매번 다르게 보이게)
    const axis = new Vector3(dir.z, jitter(0.35), -dir.x).normalize()
    return {
      delay: i * staggerS * 1000,
      from,
      end,
      axis,
      spin: Math.PI * 2 * (2.4 + Math.random() * 0.8),
      target: upQuaternion(v, jitter(0.4)),
    }
  })
  const total = (durationS + staggerS) * 1000
  let frames = 0
  let measureFrom = 0
  let slowSent = false
  cancelAnimationFrame(ctx.raf)

  const step = (now) => {
    if (!ctx?.host) return
    let done = true
    plans.forEach((p, i) => {
      const t = Math.min(1, Math.max(0, (now - start - p.delay) / (durationS * 1000)))
      if (t < 1) done = false
      const m = ctx.dice[i]
      // 앞으로는 빠르게 나아가다 점점 느려진다
      const along = 1 - Math.pow(1 - t, 2.4)
      m.position.lerpVectors(p.from, p.end, along)
      m.position.y = HALF + bounceHeight(t, DROP)
      _q.setFromAxisAngle(p.axis, -spinLeft(t, p.spin))
      m.quaternion.multiplyQuaternions(_q, p.target)
    })
    render()
    // 처음 몇 장은 준비 때문에 늦을 수 있어 빼고 잰다
    frames += 1
    if (frames === 4) measureFrom = now
    const measured = now - measureFrom
    if (!slowSent && onSlow && measureFrom && measured > 600 && measured / (frames - 4) > 50) {
      slowSent = true
      onSlow(measured / (frames - 4))
    }
    const elapsed = now - start
    if (!done && elapsed < total + 200) ctx.raf = requestAnimationFrame(step)
  }
  ctx.raf = requestAnimationFrame(step)
}
