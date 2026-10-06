import { useState } from 'react'

// 보드게임 플레이어 자리에 아이디 연결하는 창.
// 한 기기에서 여러 명이 동시에 로그인해야 해서 창으로 띄우지만, 모양은 공용 로그인 화면
// (탐험의 지도 · 부르마블)과 똑같이 맞춘다 — 아이들이 '같은 로그인'으로 알아보게.
const SEA = '#2f6b6b'

export default function StudentLogin({ title = '로그인', onLogin, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onLogin(username, password)
    } catch (err) {
      setError(err.message || '잠시 후 다시 해 주세요')
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-bold text-[#2b2118] outline-none transition focus:border-[#2f6b6b]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b2118]/50 p-6" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-5 shadow-xl">
          <div className="pb-1 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3ead4] text-2xl">🧭</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3ead4] text-2xl">🎲</span>
            </div>
            <h3 className="mt-2 text-lg font-extrabold text-[#2b2118]">{title}</h3>
            <p className="mt-0.5 text-xs font-bold text-gray-400">탐험의 지도 · 부르마블 같은 아이디로 로그인해요</p>
          </div>
          <input
            className={input}
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <input
            className={input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-center text-sm font-bold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl py-3.5 font-extrabold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
            style={{ background: SEA }}
          >
            {busy ? '확인하는 중…' : '로그인'}
          </button>
          <button type="button" onClick={onClose} className="w-full text-sm font-bold text-gray-400">
            닫기
          </button>
        </form>
      </div>
    </div>
  )
}
