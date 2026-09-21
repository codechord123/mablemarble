# 부르마블 그래픽 에셋 제작 가이드

Canva·Gemini 등으로 에셋을 만들 때 쓰는 규격서입니다.
**파일명을 그대로 맞춰서 주시면 코드 수정 없이 바로 교체**됩니다.

---

## 0. 공통 규칙 (전부 해당)

| 항목 | 값 |
|---|---|
| 형식 | **PNG, 투명 배경** (SVG 주시면 더 좋음) |
| 색 공간 | sRGB |
| 여백 | 캔버스 가장자리에서 **8% 안쪽**에 그림이 들어오게 |
| 잘림 방지 | 그림자·외곽선도 여백 안에 |

### 아트 디렉션 (모든 에셋 공통 톤)

> **밝고 둥근 3D 캐주얼 모바일 보드게임 스타일.**
> 굵고 진한 외곽선, 부드러운 그라데이션, 아래쪽에 은은한 그림자.
> 파스텔 아님 — 채도 높고 또렷하게. 평면 벡터 아이콘 아님 — 살짝 입체감.

### 게임 색상 팔레트 (이 색들 안에서 쓰면 통일감 생김)

| 용도 | HEX |
|---|---|
| 배경 크림 | `#FFFAF0` |
| 메인 앰버(주황) | `#F59E0B` → `#D97706` |
| 외곽선·글자 진갈색 | `#7C2D12` / `#B45309` |
| 초록 | `#16A34A` |
| 파랑 | `#2563EB` |
| 빨강 | `#DC2626` |
| 노랑(황금) | `#FCD34D` |

---

## 1순위 ⭐ 동물 캐릭터 10종 (효과 가장 큼)

지금은 이모지(🐶🐱…)라 **기기마다 모양이 달라 보입니다.** 이것만 바꿔도 체감이 큽니다.

- **크기: 512 × 512 px** (정사각형)
- 얼굴이 정면을 보는 **상반신 또는 얼굴 위주**
- 게임에서 **28px까지 작게** 표시됨 → 디테일 적게, 대비 강하게, 실루엣이 또렷하게
- 10마리가 **한 세트로 보이게** 같은 화풍·같은 선 굵기

| 파일명 | 동물 |
|---|---|
| `dog.png` | 강아지 |
| `cat.png` | 고양이 |
| `rabbit.png` | 토끼 |
| `fox.png` | 여우 |
| `bear.png` | 곰 |
| `panda.png` | 판다 |
| `lion.png` | 사자 |
| `tiger.png` | 호랑이 |
| `monkey.png` | 원숭이 |
| `frog.png` | 개구리 |

---

## 2순위 도시 랜드마크 15종

보드 칸에 들어갑니다. 지금은 국기 SVG만 있어요.

- **크기: 512 × 512 px**
- **세로로 솟은 실루엣 형태**가 좋음 (탑·건물)
- 칸에서 **36px 정도로 작게** 표시 → 단순화 필수
- 배경 없이 건물만

| 파일명 | 도시 | 추천 랜드마크 |
|---|---|---|
| `tw.png` | 타이베이 | 타이베이 101 타워 |
| `cn.png` | 베이징 | 천안문 또는 만리장성 |
| `ph.png` | 마닐라 | 마닐라 대성당 |
| `hk.png` | 홍콩 | 빅토리아 항 고층 스카이라인 |
| `jp.png` | 도쿄 | 도쿄 타워 |
| `eg.png` | 카이로 | 피라미드 + 스핑크스 |
| `gr.png` | 아테네 | 파르테논 신전 |
| `au.png` | 시드니 | 오페라 하우스 |
| `ru.png` | 모스크바 | 성 바실리 대성당 |
| `de.png` | 베를린 | 브란덴부르크 문 |
| `gb.png` | 런던 | 빅벤 |
| `us.png` | 뉴욕 | 자유의 여신상 |
| `fr.png` | 파리 | 에펠탑 |
| `it.png` | 로마 | 콜로세움 |
| `kr.png` | 서울 | N서울타워 또는 경복궁 |

---

## 3순위 특수칸 아이콘 6종

- **크기: 512 × 512 px**

| 파일명 | 칸 | 그림 |
|---|---|---|
| `start.png` | 출발 | 체크무늬 깃발 |
| `goldenkey.png` | 황금열쇠 | 반짝이는 금색 열쇠 |
| `island.png` | 무인도 | 야자수 있는 작은 섬 |
| `space.png` | 우주여행 | 로켓 |
| `tax.png` | 세금 | 지폐 묶음 |
| `welfare.png` | 사회복지 | 리본 달린 선물상자 |

---

## 4순위 건물 4종 (현재 SVG 있음 — 교체는 선택)

- **크기: 512 × 512 px**, 살짝 비스듬한 3D 뷰

| 파일명 | 단계 | 지붕색 |
|---|---|---|
| `b0_land.png` | 땅 | 빈 잔디밭/흙 |
| `b1_condo.png` | 콘도 | 초록 `#16A34A` |
| `b2_apartment.png` | 아파트 | 파랑 `#2563EB` |
| `b3_hotel.png` | 호텔 | 빨강 `#DC2626` + 금색 별 |

---

## 5순위 로고

- **크기: 1536 × 768 px** (가로형), 투명 배경
- 파일명 `logo.png`
- "부르마블" 두꺼운 3D 레터링 + 지구본 + 주사위
  (지금 코드로 만든 버전이 있으니, 더 멋진 걸로 교체하는 개념)

---

## 6순위 (선택) 카드·화폐

| 파일명 | 크기 | 내용 |
|---|---|---|
| `card_back.png` | 768 × 1024 | 카드 뒷면 — 부르마블 로고 들어간 디자인 |
| `card_fortune.png` | 768 × 1024 | 행운 카드 앞면 틀 |
| `card_penalty.png` | 768 × 1024 | 불운 카드 앞면 틀 |
| `coin.png` | 512 × 512 | 금화 (₩ 각인) |

---

# Canva 제작 템플릿

## 세팅
1. **맞춤 크기**로 새 디자인 → `512` × `512` px
2. 배경은 **투명하게 비워두기** (흰 배경 깔지 말 것)
3. 한 파일 안에서 페이지를 10장 만들어 캐릭터 10종을 한 번에 작업하면 톤이 통일됨

## 내보내기 (중요)
- 다운로드 → **PNG** → **"배경 투명" 체크** *(Canva Pro 기능)*
- Pro가 없다면: 흰 배경으로 뽑은 뒤 → Canva **배경 제거** 도구 사용
- "파일 크기 압축" 체크 해제

## 톤 맞추는 팁
- 모든 캐릭터에 **같은 외곽선 두께** 적용 (예: 8px, `#7C2D12`)
- 모든 캐릭터 발밑에 **같은 타원 그림자** 복사해 붙이기
- 캐릭터마다 색이 겹치지 않게: 강아지=베이지, 고양이=회색, 토끼=흰색,
  여우=주황, 곰=갈색, 판다=흑백, 사자=황금, 호랑이=주황+검정줄, 원숭이=밤색, 개구리=초록

---

# Gemini 프롬프트 (복사해서 쓰세요)

> 💡 이미지 AI는 **영어 프롬프트**가 결과가 더 좋습니다.
> 투명 배경이 안 나오면 **순백 배경으로 뽑은 뒤 Canva 배경 제거**를 쓰세요.

## 동물 캐릭터 (10종 — `[ANIMAL]` 부분만 바꿔가며)

```
A cute [ANIMAL] character head for a children's board game piece.
Style: glossy 3D casual mobile game art, rounded friendly shapes,
thick dark brown outline (#7C2D12), soft gradient shading,
subtle drop shadow underneath.
Front-facing, big friendly eyes, simple cheerful expression.
Bold readable silhouette that stays clear when shrunk to 30 pixels.
Centered in frame with generous padding. Pure white background,
no text, no props, no border.
```

`[ANIMAL]` 자리: `shiba dog` / `cat` / `rabbit` / `fox` / `bear` /
`panda` / `lion` / `tiger` / `monkey` / `frog`

**10마리 톤 통일 팁:** 첫 마리가 마음에 들면 그 이미지를 첨부하고
`"Same art style as the attached image, but a [ANIMAL]"` 라고 이어서 요청하세요.

## 도시 랜드마크 (15종 — `[LANDMARK]`, `[CITY]` 교체)

```
A simplified icon of [LANDMARK] in [CITY].
Style: glossy 3D casual mobile board game art, rounded shapes,
thick dark brown outline, soft gradient shading, warm colors.
Vertical composition, the building only — no sky, no ground, no people.
Bold simple silhouette that remains recognizable at 36 pixels.
Centered with padding. Pure white background, no text.
```

예) `[LANDMARK]`=`the Eiffel Tower`, `[CITY]`=`Paris`

## 특수칸 아이콘

```
A [ITEM] icon for a children's board game.
Style: glossy 3D casual mobile game art, rounded chunky shapes,
thick dark brown outline, soft gradient, vibrant saturated colors.
Single object centered with padding, slight top-down angle.
Pure white background, no text, no shadow on the background.
```

`[ITEM]` 자리:
`a checkered start flag` / `a shiny golden key` /
`a tiny desert island with a palm tree` / `a cartoon rocket` /
`a stack of paper money` / `a gift box with a ribbon`

## 건물 4종

```
A small [BUILDING] for a board game property, isometric 3D view.
Style: glossy 3D casual mobile game art, rounded chunky shapes,
thick dark brown outline, cream walls (#FEF3C7), [ROOF] roof,
soft gradient shading. Cute and simple, readable at 32 pixels.
Centered with padding. Pure white background, no text.
```

- 콘도: `[BUILDING]`=`one-story cottage`, `[ROOF]`=`green (#16A34A)`
- 아파트: `[BUILDING]`=`two-story apartment building`, `[ROOF]`=`blue (#2563EB)`
- 호텔: `[BUILDING]`=`grand hotel with a gold star on top`, `[ROOF]`=`red (#DC2626)`

## 로고

```
A logo for a Korean children's math board game.
A glossy 3D globe with world landmarks (Eiffel Tower, Big Ben,
Statue of Liberty) rising behind it, and two white dice in front.
Style: glossy 3D casual mobile game art, thick outlines,
warm amber and orange palette, playful and inviting.
Horizontal composition, empty space in the lower area for a title.
Transparent or pure white background, no text.
```

> 한글 "부르마블" 글자는 AI가 잘 못 만듭니다.
> **그림만 뽑고 글자는 Canva에서 직접** 넣는 걸 권합니다.

---

# 전달 방법

1. 위 파일명 그대로 저장
2. 폴더째 압축해서 주시거나, 파일을 그대로 올려주세요
3. 제가 `src/assets/` 에 넣고 코드에 연결합니다

**한 번에 다 안 만들어도 됩니다.** 1순위 동물 10종만 먼저 주셔도
바로 적용해서 확인하실 수 있어요.
