import { useEffect, useState } from 'react'
import { useQuestionStore } from '../../stores/questionStore.js'
import { AVATARS, DEFAULT_AVATAR, nextAvailableAvatar } from '../../data/avatars.js'
import AnimalFace, { animalLabel } from '../ui/AnimalFace.jsx'
import { GAME_MODES, DEFAULT_MODE } from '../../data/gameModes.js'
import { loadLastSetup } from '../../utils/persistence.js'
import GameButton from '../ui/GameButton.jsx'
import StudentLogin from '../account/StudentLogin.jsx'
import { loginSeat, logoutSeat } from '../../account/store.js'

// 자리마다 따로 로그인한다 — 플레이어를 빼고 넣어도 자리 이름은 그대로
let seatCounter = 0
const newSeat = () => `seat${Date.now().toString(36)}${seatCounter++}`

// 마지막 설정이 있으면 자동 로드 (T23 — 같은 친구들로 다시)
function initialPlayers() {
  const last = loadLastSetup()
  if (last?.players?.length >= 2) {
    return last.players.map((p) => ({
      name: p.name || '플레이어',
      avatar: p.avatar || AVATARS[0],
      seat: newSeat(),
    }))
  }
  return [
    { name: '플레이어1', avatar: AVATARS[0], seat: newSeat() },
    { name: '플레이어2', avatar: AVATARS[1], seat: newSeat() },
  ]
}

function initialMode() {
  const last = loadLastSetup()
  return last?.modeId || DEFAULT_MODE
}

export default function GameSetup({ onStart, onBack }) {
  const [players, setPlayers] = useState(initialPlayers)
  const [modeId, setModeId] = useState(initialMode)
  const [linking, setLinking] = useState(null) // 아이디를 연결하는 중인 플레이어 번호

  const bundledSets = useQuestionStore((s) => s.bundledSets)
  const sets = useQuestionStore((s) => s.sets)
  const selectedSetId = useQuestionStore((s) => s.selectedSetId)
  const activeQuestions = useQuestionStore((s) => s.activeQuestions)
  const refresh = useQuestionStore((s) => s.refresh)
  const selectSet = useQuestionStore((s) => s.selectSet)

  useEffect(() => { refresh() }, [refresh])

  const usedAvatars = players.map((p) => p.avatar)

  const updatePlayer = (i, patch) => {
    setPlayers((curr) => {
      const next = [...curr]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }

  const cycleAvatar = (i) => {
    const current = players[i].avatar
    const next = nextAvailableAvatar(usedAvatars, current)
    updatePlayer(i, { avatar: next })
  }

  const pickAvatar = (i, avatar) => {
    if (usedAvatars.includes(avatar) && avatar !== players[i].avatar) return
    updatePlayer(i, { avatar })
  }

  const removePlayer = (i) => {
    if (players[i].account) logoutSeat(players[i].seat).catch(() => {})
    setPlayers((curr) => curr.filter((_, j) => j !== i))
  }

  // 플레이어에 학생 아이디 연결 — 이 판에서 틀린 문제가 그 학생 오답 노트에 저장된다
  const linkAccount = async (i, username, password) => {
    const u = (username || '').trim().toLowerCase()
    if (players.some((p, j) => j !== i && p.account?.username === u)) throw new Error('이미 다른 플레이어에 연결된 아이디예요')
    const p = players[i]
    const acc = await loginSeat(p.seat, u, password)
    updatePlayer(i, {
      account: { username: acc.username, name: acc.name, classId: acc.classId, slot: p.seat },
      name: (acc.name || acc.username).slice(0, 10),
    })
    setLinking(null)
  }

  const unlinkAccount = (i) => {
    logoutSeat(players[i].seat).catch(() => {})
    updatePlayer(i, { account: null })
  }

  const addPlayer = () => {
    setPlayers((curr) => {
      const used = curr.map((p) => p.avatar)
      const avatar = AVATARS.find((a) => !used.includes(a)) || DEFAULT_AVATAR
      return [...curr, { name: `플레이어${curr.length + 1}`, avatar, seat: newSeat() }]
    })
  }

  const validPlayers = players.filter((p) => p.name.trim()).length >= 2
  const canStart = validPlayers && activeQuestions.length > 0

  const handleSetChange = (e) => {
    const raw = e.target.value
    // bundled:* 는 문자열 그대로, 그 외는 숫자 변환
    selectSet(raw.startsWith('bundled:') ? raw : Number(raw))
  }

  return (
    <div className="min-h-screen hero-bg-soft flex items-center justify-center p-6">
      <div className="max-w-lg w-full mx-auto bg-white rounded-[1.75rem] card-soft ring-1 ring-amber-900/5 p-6">
        {onBack && (
          <button onClick={onBack} className="text-amber-700 hover:underline mb-3 text-sm font-semibold">
            ← 메인 메뉴
          </button>
        )}
        <h2 className="text-2xl font-bold text-amber-900 mb-1">게임 설정</h2>
        <p className="text-sm text-amber-700 mb-4">2~5명, 캐릭터·이름 선택 후 시작!</p>

        <div className="mb-5">
          <label className="block text-sm font-bold text-amber-900 mb-2">게임 모드</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(GAME_MODES).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setModeId(mode.id)}
                className={`p-2 rounded-xl border-2 text-left transition ${
                  modeId === mode.id
                    ? 'border-amber-500 bg-amber-50 shadow'
                    : 'border-gray-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div className="font-bold text-amber-900 text-sm">{mode.label}</div>
                <div className="text-[10px] text-amber-700 mt-0.5 leading-snug">
                  {mode.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-bold text-amber-900 mb-1">문제 세트</label>
          <select
            value={selectedSetId}
            onChange={handleSetChange}
            className="w-full p-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none bg-white"
          >
            <optgroup label="기본 내장">
              {bundledSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.questions.length}문제)
                </option>
              ))}
            </optgroup>
            {sets.length > 0 && (
              <optgroup label="내가 업로드한 세트">
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.count}문제)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="text-xs text-gray-500 mt-1">현재 활성: {activeQuestions.length}문제</div>
        </div>

        <label className="block text-sm font-bold text-amber-900 mb-2">플레이어</label>
        <div className="space-y-3">
          {players.map((p, i) => (
            <div key={p.seat || i} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => cycleAvatar(i)}
                  className="h-12 w-12 shrink-0 rounded-full bg-white shadow border-2 border-amber-300 flex items-center justify-center hover:scale-110 active:scale-95 transition"
                  title="클릭하여 다른 캐릭터로 변경"
                >
                  <AnimalFace emoji={p.avatar} className="w-[86%] h-[86%]" />
                </button>
                <input
                  value={p.name}
                  onChange={(e) => updatePlayer(i, { name: e.target.value })}
                  className="flex-1 min-w-0 px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 outline-none bg-white"
                  maxLength={10}
                  placeholder="이름"
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    className="px-3 text-rose-500 hover:bg-rose-50 rounded"
                    aria-label="플레이어 제거"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold">
                {p.account ? (
                  <>
                    <span className="truncate text-emerald-700">🎒 {p.account.name || p.account.username} 연결됨 · 틀린 문제는 오답 노트로</span>
                    <button onClick={() => unlinkAccount(i)} className="shrink-0 text-gray-400 underline">해제</button>
                  </>
                ) : (
                  <button onClick={() => setLinking(i)} className="text-amber-700 hover:underline">
                    🔑 아이디 연결 (오답 노트 저장)
                  </button>
                )}
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {AVATARS.map((a) => {
                  const taken = usedAvatars.includes(a) && a !== p.avatar
                  const selected = a === p.avatar
                  return (
                    <button
                      key={a}
                      onClick={() => pickAvatar(i, a)}
                      disabled={taken}
                      title={animalLabel(a)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition ${
                        selected
                          ? 'bg-amber-500 ring-2 ring-amber-700 scale-110'
                          : taken
                            ? 'bg-gray-200 opacity-30 cursor-not-allowed'
                            : 'bg-white hover:bg-amber-100'
                      }`}
                    >
                      <AnimalFace emoji={a} className="w-[88%] h-[88%]" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {players.length < 5 && (
          <button onClick={addPlayer} className="mt-3 text-amber-600 hover:underline text-sm">
            + 플레이어 추가
          </button>
        )}

        <GameButton
          color="orange"
          onClick={() => onStart(players.filter((p) => p.name.trim()), modeId)}
          disabled={!canStart}
          className="mt-6 w-full py-3.5 text-lg"
        >
          게임 시작!
        </GameButton>
      </div>
      {linking !== null && players[linking] && (
        <StudentLogin
          title={`${players[linking].name} 아이디 연결`}
          onClose={() => setLinking(null)}
          onLogin={(u, pw) => linkAccount(linking, u, pw)}
        />
      )}
    </div>
  )
}
