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
- ⏳ Phase 2 — XLSX/HWPX 업로드 + 미리보기 + Firestore 연동
