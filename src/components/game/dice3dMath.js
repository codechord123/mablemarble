// 3D 주사위 계산 — 어떤 눈이 위를 보게 하는 회전, 던져서 튀는 높이.
import { Quaternion, Vector3 } from 'three'

// 상자 면 순서(+x, -x, +y, -y, +z, -z)에 붙일 눈 — 마주 보는 면의 합이 7
export const FACE_VALUES = [3, 4, 1, 6, 2, 5]
const AXIS_X = new Vector3(1, 0, 0)
const AXIS_Y = new Vector3(0, 1, 0)
const AXIS_Z = new Vector3(0, 0, 1)

// 그 눈이 위(+y)를 보게 하는 회전 (yaw: 위에서 본 돌림 각, 라디안)
export function upQuaternion(value, yaw = 0) {
  const base = new Quaternion()
  if (value === 6) base.setFromAxisAngle(AXIS_X, Math.PI)
  else if (value === 2) base.setFromAxisAngle(AXIS_X, -Math.PI / 2)
  else if (value === 5) base.setFromAxisAngle(AXIS_X, Math.PI / 2)
  else if (value === 3) base.setFromAxisAngle(AXIS_Z, Math.PI / 2)
  else if (value === 4) base.setFromAxisAngle(AXIS_Z, -Math.PI / 2)
  return new Quaternion().setFromAxisAngle(AXIS_Y, yaw).multiply(base)
}

// 지금 회전에서 위를 보는 눈
export function topValue(q) {
  const normals = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ]
  let best = 0
  let bestY = -Infinity
  normals.forEach((n, i) => {
    const y = new Vector3(...n).applyQuaternion(q).y
    if (y > bestY) {
      bestY = y
      best = i
    }
  })
  return FACE_VALUES[best]
}

// 던진 주사위의 높이 (t: 0~1) — 떨어져서 세 번 점점 작게 튄 뒤 멈춘다
export function bounceHeight(t, drop = 2.2) {
  if (t <= 0) return drop
  if (t < 0.42) {
    const u = t / 0.42
    return drop * (1 - u * u)
  }
  const arcs = [
    [0.42, 0.66, 0.55],
    [0.66, 0.82, 0.18],
    [0.82, 0.92, 0.05],
  ]
  for (const [a, b, h] of arcs) {
    if (t < b) {
      const u = (t - a) / (b - a)
      return 4 * h * u * (1 - u)
    }
  }
  return 0
}

// 남은 회전 각 — 처음엔 빠르게 돌다 바닥에 닿을수록 느려져서 0에서 멈춘다
export const spinLeft = (t, total) => total * Math.pow(Math.max(0, 1 - t), 2.2)
