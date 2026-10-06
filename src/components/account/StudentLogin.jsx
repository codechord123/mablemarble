import { useState } from 'react'
import GameButton from '../ui/GameButton.jsx'

// 아이디·비밀번호 창 — 역사게임(탐험의 지도)과 같은 아이디
export default function StudentLogin({ title = '학생 로그인', onLogin, onClose }) {
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
    'w-full rounded-xl border-2 border-amber-200 bg-white px-4 py-3 text-base font-bold text-amber-950 outline-none focus:border-amber-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-[1.5rem] bg-white p-5 shadow-2xl ring-1 ring-amber-900/10"
      >
        <div className="text-center">
          <div className="text-3xl">🔑</div>
          <h3 className="mt-1 text-lg font-black text-amber-900">{title}</h3>
          <p className="mt-0.5 text-xs font-semibold text-amber-700">역사게임(탐험의 지도)과 같은 아이디예요</p>
        </div>
        <div className="mt-4 space-y-2.5">
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
        </div>
        {error && <p className="mt-2 text-center text-sm font-bold text-rose-600">{error}</p>}
        <GameButton type="submit" color="orange" disabled={busy} className="mt-4 w-full py-3 text-lg">
          {busy ? '확인하는 중…' : '로그인'}
        </GameButton>
        <button type="button" onClick={onClose} className="mt-3 w-full text-sm font-bold text-gray-400">
          닫기
        </button>
      </form>
    </div>
  )
}
