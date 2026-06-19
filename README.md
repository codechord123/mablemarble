# 부르마블 학습 게임 (boomarble-edu)

5학년 교실용 모두의 마블 스타일 학습 보드게임. 한 기기 2-5인 패스앤플레이.
교사가 만든 HWPX/XLSX/DOCX 문제 파일을 그대로 활용 가능. 전체 설계는 `PLANNING.md` 참고.

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm test         # 단위 테스트 (Vitest)
```

## 진행 단계

- ✅ Phase 1 · Step A — 스캐폴딩 + 24칸 보드 정의 + 게임엔진 골격
- ✅ Phase 1 · Step B — 보드 렌더링 + 턴 시스템 + 풀스크린 턴 안내
- ✅ Phase 1 · Step C — 문제 모달 + 도시 구매/통행료/세금/파산/승리 (MVP 완성)
- ✅ Phase 2 — HWPX/XLSX/DOCX 업로드 + 미리보기 + 로컬 저장 (IndexedDB)
- ✅ Phase 3 — 황금열쇠 카드 12종 / 무인도 갇힘+탈출 / 우주여행 도시 선택
- ✅ Phase 4 — Web Audio 효과음 / canvas-confetti / 정답률·과목별 통계
- ✅ Phase 5 — Firebase Hosting 자동 배포 + JSON 문제 세트 공유

## 배포 (Firebase Hosting)

### 최초 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. `.firebaserc`의 `boomarble-edu`를 본인 프로젝트 ID로 교체
3. Firebase CLI 설치 후 로컬 테스트:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase init hosting   # 기존 firebase.json 유지 선택
   npm run build && firebase deploy
   ```

### GitHub Actions 자동 배포
1. Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
2. 다운받은 JSON 전체를 GitHub Secret으로 추가:
   - 저장소 Settings → Secrets and variables → Actions
   - Name: `FIREBASE_SERVICE_ACCOUNT`, Value: JSON 전체 붙여넣기
3. `main`에 push 시 자동 배포, PR 시 7일 임시 프리뷰 URL 코멘트로 부착
4. 워크플로우 파일: `.github/workflows/deploy.yml`

## 문제 입력 방법

| 형식 | 우선순위 | 특징 |
|---|---|---|
| `.hwpx` | ⭐ 권장 | 한컴오피스에서 "다른 이름으로 저장 → HWPX" |
| `.xlsx` | 안정적 | 엑셀에서 표 형식으로 작성 |
| `.docx` | 호환용 | MS Word 표 형식 |
| `.json` | 공유용 | 다른 선생님과 세트 공유 시 내보내기/가져오기 |

### 표 템플릿 (모든 형식 공통)

| 번호 | 카테고리 | 난이도 | 유형 | 문제 | 보기1 | 보기2 | 보기3 | 보기4 | 정답 | 해설 |
|------|----------|--------|------|------|-------|-------|-------|-------|------|------|
| 1 | 사회 | 1 | 객관식 | 수도? | 서울 | 부산 | 인천 | 대구 | 1 | 대한민국 수도 |
| 2 | 과학 | 2 | OX | 식물은 광합성한다 | O | X | | | 1 | 잎의 엽록체 |
| 3 | 국어 | 3 | 단답형 | '크다'의 반대말? | | | | | 작다 | 크기 표현 |

- 난이도: `1`(하) / `2`(중) / `3`(상)
- 유형: `객관식` / `OX` / `단답형`
- 정답:
  - 객관식 → 보기 번호(1~4)
  - OX → `1`(O) 또는 `2`(X)
  - 단답형 → 문자열 (콤마로 복수 정답 가능: `추하다,못생기다`)
