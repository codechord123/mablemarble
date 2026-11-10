import React from 'react'
import ReactDOM from 'react-dom/client'
// Pretendard 한글 웹폰트 (동적 서브셋 — 사용하는 글자만 로드, OFL 라이선스)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import App from './App.jsx'
import MuteToggle from './components/ui/MuteToggle.jsx'
import { initMusic } from './utils/bgm.js'
import './index.css'

initMusic()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* 음악·효과음 켜고 끄기 — 메뉴·설정·게임판·결과 어느 화면에서나 */}
    <MuteToggle />
  </React.StrictMode>,
)
