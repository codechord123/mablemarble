import { describe, it, expect } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { upQuaternion, topValue, bounceHeight, spinLeft, FACE_VALUES } from '../src/components/game/dice3dMath.js'

describe('3D 주사위 계산', () => {
  it('어떤 눈이든, 위에서 어떻게 돌려도 그 눈이 위를 본다', () => {
    for (let v = 1; v <= 6; v++) {
      for (const yaw of [0, 0.7, 2, -1.3]) expect(topValue(upQuaternion(v, yaw))).toBe(v)
    }
  })
  it('마주 보는 면의 합은 7', () => {
    for (let i = 0; i < 6; i += 2) expect(FACE_VALUES[i] + FACE_VALUES[i + 1]).toBe(7)
  })
  it('굴림 끝에는 정확히 목표 회전·바닥에 멈춘다', () => {
    expect(bounceHeight(1)).toBe(0)
    expect(bounceHeight(0)).toBeGreaterThan(1)
    expect(spinLeft(1, 20)).toBe(0)
    const qT = upQuaternion(5, 1)
    const q = qT.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 1, 0).normalize(), spinLeft(1, 30)))
    expect(topValue(q)).toBe(5)
  })
})
