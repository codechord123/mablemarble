import React from 'react'
import ReactDOM from 'react-dom/client'
// Pretendard 한글 웹폰트 (동적 서브셋 — 사용하는 글자만 로드, OFL 라이선스)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
