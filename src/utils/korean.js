// 한국어 조사 처리.

// 대분수를 읽을 때 정수부 뒤에 붙는 조사.
// '과/와'는 고정된 기호가 아니라 앞말의 받침에 따라 갈리는 조사다.
// 수는 한자어로 읽으므로 끝 음절로 판정한다.
//   일(1)·삼(3)·육(6)·칠(7)·팔(8)·십(10·20·…) → 받침 있음 → '과'
//   이(2)·사(4)·오(5)·구(9)                    → 받침 없음 → '와'
// 예) 2와 2분의 1 (O) / 2과 2분의 1 (X),  1과 3분의 2 (O)
export function mixedParticle(intPart) {
  const digits = String(intPart ?? '').replace(/\D/g, '')
  if (!digits) return '과'
  return '2459'.includes(digits[digits.length - 1]) ? '와' : '과'
}
