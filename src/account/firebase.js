// 역사게임(탐험의 지도)과 같은 Firebase 프로젝트 — 같은 아이디로 들어온다.
// 한 기기에서 여러 학생이 동시에 로그인할 수 있게 '자리(slot)'마다 Firebase 앱을 따로 둔다.
//   me      : 메뉴·수련장·오답 다시 풀기에서 쓰는 학생 (이 기기에 기억)
//   seatN   : 보드게임 플레이어 자리 (탭을 닫으면 풀린다)
import { initializeApp, getApp } from 'firebase/app'
import { initializeAuth, getAuth, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAF_2Oyq7EHOvUAsOFmSdzeuYDIFUV9kpg',
  authDomain: 'history-a31c4.firebaseapp.com',
  projectId: 'history-a31c4',
  storageBucket: 'history-a31c4.firebasestorage.app',
  messagingSenderId: '14768463828',
  appId: '1:14768463828:web:372265ff66e010c31a4041',
}

export const ME = 'me'

function appFor(slot) {
  try {
    return getApp(slot)
  } catch {
    const app = initializeApp(firebaseConfig, slot)
    initializeAuth(app, { persistence: slot === ME ? browserLocalPersistence : browserSessionPersistence })
    return app
  }
}

export const authOf = (slot) => getAuth(appFor(slot))
export const dbOf = (slot) => getFirestore(appFor(slot))
