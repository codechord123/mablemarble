# 부르마블 학습 게임 (boomarble-edu)

5학년 교실용 모두의 마블 스타일 학습 보드게임. 한 기기 2-5인 패스앤플레이.
전체 설계는 `PLANNING.md` 참고.

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm test         # 단위 테스트 (Vitest)
```

## 현재 진행 단계

- ✅ Phase 1 · Step A — 스캐폴딩 + 24칸 보드 정의 + 게임엔진 골격
- ✅ Phase 1 · Step B — 보드 렌더링 + 턴 시스템 + 풀스크린 턴 안내
- ✅ Phase 1 · Step C — 문제 모달 + 도시 구매/통행료/세금/파산/승리 (MVP 완성)
- ✅ Phase 2 — HWPX/XLSX/DOCX 업로드 + 미리보기 + 로컬 저장 (IndexedDB)
- ✅ Phase 3 — 황금열쇠 카드 12종 / 무인도 갇힘+탈출 / 우주여행 도시 선택
- ✅ Phase 4 — Web Audio 효과음 / canvas-confetti / 정답률·과목별 통계
- ⏳ Phase 5 — 배포 (Firebase Hosting + GitHub Actions)
