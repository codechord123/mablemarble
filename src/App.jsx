import { BOARD } from './utils/boardConfig.js'

export default function App() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-amber-900">부르마블 학습 게임</h1>
      <p className="mt-2 text-amber-700">
        Phase 1 · Step A — 스캐폴딩 완료 ({BOARD.length}칸 보드 로드됨)
      </p>
    </div>
  )
}
