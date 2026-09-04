# 坂道シリーズ リンクハブ — 작업지시서 v1.0

> ⛔ **폐기됨 (2026-08-20)**: 이 문서는 [`AUDIT_AND_REBUILD_PLAN.md`](./AUDIT_AND_REBUILD_PLAN.md) §1에 의해 폐기되었으며 이력 참고용으로만 유지합니다. 현행 제품 줄기는 [`PRODUCT_RMVP_PLAN.md`](./PRODUCT_RMVP_PLAN.md), 실행 기록은 [`WORK_ORDER_RMVP_2026-08-25.md`](./WORK_ORDER_RMVP_2026-08-25.md), 운영 상태는 [`CODEX_HANDOVER.md`](./CODEX_HANDOVER.md)를 우선합니다. `AUDIT_AND_REBUILD_PLAN.md`는 감사·재설계 이력입니다.
>
> **대상 실행자**: Antigravity CLI (자율 코딩 에이전트)
> **작성일**: 2026-08-16
> **문서 성격**: 구현 계약서. 이 문서에 없는 것은 만들지 않는다. 이 문서와 충돌하는 판단은 하지 않는다.

---

## 0. 이 문서를 읽는 에이전트에게 — 최우선 규칙 5개

이 5개는 다른 모든 지시보다 우선한다. 위반 시 해당 커밋은 전부 폐기한다.

### 규칙 1 — 멤버 데이터를 기억으로 채우지 마라

너는 坂道 그룹 멤버 이름과 URL을 "알고 있다"고 느낄 것이다. **그 느낌은 신뢰할 수 없다.** 이 도메인은 다음 이유로 모델 기억이 구조적으로 틀린다:

- 졸업/가입이 월 단위로 발생한다
- 동명이인, 개명, 표기 흔들림(髙/高, 﨑/崎)이 많다
- 공식 사이트의 `ct` 파라미터는 규칙성이 없는 내부 코드다 (예측 불가)

**따라서**: 멤버 이름, 생년월일, 블로그 코드, SNS 계정을 **한 건도 손으로 지어내지 않는다.** 반드시 `scripts/fetch/*.ts`가 공식 사이트에서 가져온 결과만 데이터에 들어간다. 확인 못 한 필드는 `null` + `provenance.source = 'manual'` + `note`에 사유를 남긴다.

### 규칙 2 — 인물 사진을 호스팅하지 않는다

나무위키·공식사이트·팬사이트 어디서 가져오든 아이돌 프로필 사진은 소속사(Seed & Flower / Sony Music) 저작물이다. 다운로드·재배포·핫링크 전부 금지.

**대안(이미 설계에 반영됨)**: 성(姓)의 첫 글자를 그룹 팔레트 위에 얹은 **글리프 아바타**. 사진 없이도 카드가 성립하도록 타이포그래피와 색으로 밀도를 만든다. 이건 타협이 아니라 이 사이트의 미감이다 — 사진 없는 편이 "하늘하늘한 일본 블로그" 톤에 오히려 맞는다.

### 규칙 3 — 나무위키를 데이터 출처로 쓰지 않는다

- 나무위키 본문은 CC BY-NC-SA 2.0 KR이라 상업적 사용이 막히고, 이미지는 애초에 라이선스가 없다
- Cloudflare로 자동 접근을 차단하며, 스크래핑은 이용약관 위반이다

**허용 출처는 4개뿐이다** (`SourceKind`): `official`, `official_sns`, `wikipedia_ja`(CC BY-SA 4.0, 출처 표기), `manual`. 한국어 이름 표기는 나무위키를 베끼지 말고 **국립국어원 외래어 표기법**으로 직접 변환하고, 애매하면 `aliases`에 후보를 함께 넣어 검색만 되게 한다.

### 규칙 4 — 검증되지 않은 링크는 렌더링되지 않는다

`MemberLink.status === 'unverified'`인 링크는 UI에 절대 나오지 않는다. 이 필터는 `renderableLinks()` 한 곳에만 존재하고, 컴포넌트는 반드시 이 함수를 통과한 배열만 받는다. 우회 금지.

### 규칙 5 — 데이터와 표현을 분리한다

`/data/*.json`은 사실만, `/src/design/tokens.ts`는 표현만 담는다. 컴포넌트는 JSON의 형태를 알되 내용을 알지 못한다. **그룹이 하나 늘어나도 컴포넌트 코드는 한 줄도 바뀌지 않아야 한다.** 이 성질이 만족되지 않으면 설계가 틀린 것이다.

---

## 1. 프로젝트 정의

### 1.1 한 문장 정의

> 坂道シリーズ 3개 그룹의 현역·졸업 멤버를 기수별로 열람하고, 각자의 **공식 블로그와 공식 SNS로 이동**할 수 있게 하는, 일본어/한국어/영어 3언어 정적 링크 허브.

### 1.2 목표 (Goals)

| # | 목표 | 성공 판정 |
|---|---|---|
| G1 | 3그룹 전 기수의 현역·졸업 멤버를 빠짐없이 열람 | 공식 사이트 멤버 수와 데이터 건수 일치 |
| G2 | 멤버당 공식 블로그 + 공식 SNS 링크 도달 | 링크 헬스체크 통과율 95% 이상 |
| G3 | ja/ko/en 완전 전환 | 3언어 전 페이지 하드코딩 문자열 0건 |
| G4 | 그룹 선택 시 배경색·모티프가 부드럽게 전환 | 전환 중 프레임 55fps 이상 유지 |
| G5 | Vercel 무료 티어에서 운영 가능 | 서버 런타임 0, 전부 SSG |

### 1.3 비목표 (Non-goals) — 만들지 말 것

- ❌ 블로그 본문 크롤링/미러링/RSS 재배포 (저작권 + 서버 비용)
- ❌ 인물 사진, 그룹 로고, 앨범 아트
- ❌ 로그인, 즐겨찾기 서버 저장, 댓글, 광고
- ❌ 데이터베이스 (Supabase 등). 데이터는 리포지토리 안의 JSON이다
- ❌ 해체 그룹 수록 (아래 1.4 참조)
- ❌ 프로필 상세 스펙(신장/혈액형/취미 등) 나열 — 이 사이트는 **링크 허브**지 프로필 위키가 아니다

### 1.4 수록 범위 — 그룹 확정

**수록 (3그룹)**

| id | 현재 이름 | 전신 (lineage로 편입) |
|---|---|---|
| `nogizaka46` | 乃木坂46 | 없음 |
| `sakurazaka46` | 櫻坂46 | 欅坂46 (2015-08-21 ~ 2020-10-12) |
| `hinatazaka46` | 日向坂46 | けやき坂46(ひらがなけやき) (2015-11-30 ~ 2019-02-10) |

**미수록**

- `吉本坂46` — 활동 종료. 사용자 지시(해체 그룹 제외)에 따라 제외.
- `僕が見たかった青空`, `青春アミーゴ` 등 — 坂道シリーズ 공식 소속이 아님.

**중요한 판단**: 欅坂46과 けやき坂46은 **해체가 아니라 개명/독립**이다. 따라서 "제외 대상"이 아니라 각각 櫻坂46 / 日向坂46의 `lineage` 배열에 편입한다. 欅坂46 시절에만 재적했던 멤버(예: 1期生 졸업생 다수)는 `primaryGroupId: 'sakurazaka46'` + `memberships[].endReason: 'graduation'` 으로 표현되며, UI에서는 **「欅坂46 시대」 아카이브 섹션**에 초록색 톤으로 별도 표시된다.

### 1.5 기수 현황 (2026-08 기준 · 반드시 재확인할 것)

| 그룹 | 최신 기수 | 비고 |
|---|---|---|
| 乃木坂46 | 6期生 | 1~6期. 7期生 오디션은 미개최로 파악됨 |
| 櫻坂46 | 4期生 | 1期/2期/新2期/3期/4期. **「新2期生」 별도 취급 주의** |
| 日向坂46 | 5期生 | けやき坂 시절 1期/2期 + 日向坂 3期~5期 |

> 이 표는 참고값이다. **Phase 1에서 공식 사이트로 반드시 검증**하고, 어긋나면 공식 사이트가 이긴다.

---

## 2. 기술 스택과 선택 근거

| 영역 | 채택 | 근거 (왜 이것인가) |
|---|---|---|
| 프레임워크 | **Next.js 15 (App Router)** | 전 페이지 SSG + i18n 라우팅 + Vercel 1급 지원. 페이지 수(약 600)가 정적 생성 한계 내 |
| 언어 | **TypeScript strict** | 데이터 계약이 이 프로젝트의 핵심. `any` 사용 금지, `strict: true`, `noUncheckedIndexedAccess: true` |
| 검증 | **Zod** | 스키마가 곧 런타임 검증기. `sakamichi.schema.ts` 사용 |
| 스타일 | **Tailwind CSS v4 + CSS 변수** | 그룹 컬러 전환은 Tailwind 클래스로 불가능(동적 색 보간). CSS Custom Property + `@property`가 유일한 정답 |
| 모션 | **Motion (framer-motion) 11+** | 레이아웃 전환·모티프 크로스페이드용. 배경 blob은 순수 CSS(라이브러리 미사용) |
| i18n | **next-intl 3.x** | App Router 네이티브. 메시지 타입 추론 지원 |
| 배경 파티클 | **Canvas 2D (자체 구현)** | three.js/WebGL 금지 — 번들 300KB 증가에 비해 얻는 게 없음. 파티클 60~80개면 2D로 충분 |
| 배포 | **Vercel** | `output: 'export'`가 아닌 기본 SSG. ISR 불필요 |
| 패키지 매니저 | **pnpm** | — |

### 2.1 명시적 금지 라이브러리

`three`, `@react-three/*`, `gsap`, `lottie`, `swiper`, 아이콘 폰트 패키지, UI 킷(MUI/Chakra/shadcn 전체 도입). **아이콘은 SVG 인라인으로 직접 그린다** (SNS 아이콘 8종). 이유: 번들 예산(§9)과 디자인 일관성.

---

## 3. 데이터 아키텍처

### 3.1 왜 DB가 아니라 JSON인가

이 데이터의 변경 빈도는 **월 1~2회**(가입/졸업)다. 반면 읽기는 100% 정적이다. DB를 붙이면 얻는 것(실시간 갱신)은 없고 잃는 것(런타임 비용, 장애점, 마이그레이션 부담)만 있다.

대신 다음 성질을 얻는다:
- 데이터 변경이 **git diff로 리뷰 가능**하다 — 잘못된 자동 수집을 사람이 잡을 수 있다
- 빌드 시점에 전수 검증이 끝난다 — 런타임 오류가 원천적으로 없다
- 롤백이 `git revert` 한 번이다

### 3.2 파일 배치

```
/data
  ├─ groups.json          # Group[] — 3건. 수동 관리 (거의 안 바뀜)
  ├─ members.json         # Member[] — 약 400건. 스크립트가 갱신
  ├─ link-report.json     # 헬스체크 결과 (커밋함. 이력 추적용)
  └─ CHANGELOG.md         # 가입/졸업 반영 이력 (사람이 씀)
```

`sakamichi.schema.ts`는 `/src/lib/schema.ts`에 배치한다. (별도 제공 파일 사용)

### 3.3 데이터 수집 프로토콜

#### 3.3.1 확인된 공식 URL 패턴

아래는 실측 확인된 패턴이다. **`{code}`는 예측 불가한 내부 코드이므로 반드시 목록 페이지에서 파싱한다.**

```
乃木坂46
  멤버 목록  https://www.nogizaka46.com/s/n46/search/artist?ima=0000
  블로그     https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000&ct={code}
  code 예    48006 (5자리 숫자)

櫻坂46
  멤버 목록  https://sakurazaka46.com/s/s46/search/artist?ima=0000
  블로그     https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000&ct={code}
  code 예    03, 43, 50, 57, 63 (2자리, 0 패딩 있음 → 문자열로 다룰 것)

日向坂46
  멤버 목록  https://www.hinatazaka46.com/s/official/search/artist?ima=0000
  블로그     https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000&ct={code}
  code 예    14, 15, 39 (2자리)
```

> ⚠ `ct` 코드를 숫자 타입으로 저장하면 `03 → 3`이 되어 링크가 깨진다. **반드시 string.**
> ⚠ 이 URL들은 2026-08 시점 확인값이다. Phase 1 첫 작업은 이 3개 목록 페이지를 실제로 fetch해서 200 응답과 DOM 구조를 확인하는 것이다. 구조가 다르면 **작업을 멈추고 사람에게 보고**한다. 임의로 다른 사이트를 찾아 대체하지 않는다.

#### 3.3.2 수집 순서

```
1. 목록 페이지 fetch → 멤버 이름(漢字) + ct 코드 + 기수 추출
2. 각 멤버 프로필 페이지 fetch → かな, 생년월일, 출신지, 공식 SNS 링크 추출
3. 공식 SNS 링크는 프로필 페이지에 명시된 것만 채택 (검색해서 찾지 않는다)
4. 로마자: かな → 헵번식 변환 (마크론 미사용). 변환 테이블은 scripts/lib/romaji.ts
5. 한글: 국립국어원 표기법 변환. 자동 변환 후 **전건 사람 확인 필요** → status 'manual'
6. 졸업생: 공식 사이트에서 내려가므로 wikipedia_ja 로 보완. 블로그 링크는 dead 처리
```

#### 3.3.3 스크래핑 예절 (필수)

```ts
// scripts/lib/fetcher.ts 에 반드시 구현
const DELAY_MS = 1500;          // 요청 간 최소 간격
const UA = 'SakamichiLinkHub/1.0 (+https://<배포도메인>/about; contact@example.com)';
const MAX_RETRY = 2;
// robots.txt 를 먼저 읽고 Disallow 경로면 즉시 중단
// 429/503 수신 시 지수 백오프 후 3회 실패하면 전체 중단
```

동시 요청 금지(concurrency 1). 총 요청 수를 로그에 남긴다. 하루 1회 이상 실행하지 않는다.

#### 3.3.4 링크 헬스체크

```
scripts/check-links.ts
  - 전 링크에 HEAD 요청 (HEAD 미지원 시 GET, Range: bytes=0-0)
  - 200        → status 'ok'
  - 301/302    → 최종 URL 기록 + status 'redirected' + 콘솔 경고
  - 4xx/5xx    → status 'dead'
  - 타임아웃    → 재시도 2회 후 status 유지 (섣불리 dead 처리 금지)
  - 결과를 data/link-report.json 에 저장
  - dead 비율 10% 초과 시 exit(1) → CI 실패
```

GitHub Actions로 **주 1회 월요일 09:00 JST** 실행, 변경 시 PR 자동 생성.

---

## 4. 정보 구조 (IA)와 라우팅

### 4.1 라우트

```
/                                   → /ja 로 리다이렉트 (Accept-Language 참고)
/[locale]                           홈. 3그룹 선택
/[locale]/g/[groupId]               그룹 페이지 (탭: 現役 / 卒業 / 期別)
/[locale]/g/[groupId]/gen/[genId]   기수별 목록
/[locale]/g/[groupId]/archive       欅坂46·けやき坂46 시대 (sakura/hinata 만)
/[locale]/m/[memberId]              멤버 링크 상세
/[locale]/search                    통합 검색 (클라이언트 사이드)
/[locale]/about                     출처·저작권·면책·연락처
```

`locale ∈ {ja, ko, en}`. **prefix always** (기본 언어도 `/ja` 붙임). 이유: 캐시·hreflang·공유 URL의 명확성.

### 4.2 페이지별 목적과 구성

#### 홈 `/[locale]`

- 목적: 그룹을 고르게 한다. 그 이상 아무것도 하지 않는다.
- 구성: 사이트 타이틀 → **3개의 대형 그룹 카드** → 하단 언덕선(Signature) → 푸터
- 그룹 카드 hover/focus 시: 배경이 **미리보기로** 해당 그룹 색으로 40% 이동 (전체 전환 아님). 이탈하면 복귀. 이 예고 동작이 클릭 동기를 만든다.
- 검색창은 홈 상단에 배치하지 않는다. 사용자는 그룹부터 고른다.

#### 그룹 `/[locale]/g/[groupId]`

- 진입 즉시 배경이 그룹 색으로 완전 전환 (1200ms)
- 상단: 그룹명 + 데뷔일 + 공식 링크 6종(작은 pill)
- 탭 3개: `現役` / `卒業生` / `期別に見る`
  - 現役: 기수 오름차순 → 그 안에서 かな 50음순
  - 卒業生: 졸업일 **내림차순** (최근 졸업이 위) — 사용자가 찾는 건 대개 최근 졸업생
  - 期別: 기수 아코디언, 각 기수 헤더에 가입일과 인원수
- 櫻坂46/日向坂46은 탭 우측에 `欅坂46時代 →` / `けやき坂46時代 →` 링크

#### 멤버 `/[locale]/m/[memberId]`

- 이 사이트의 **최종 목적지**. 모든 동선이 여기로 수렴한다.
- 구성:
  1. 글리프 아바타 + 이름 3표기(현재 로케일 크게, 나머지 2개 작게)
  2. 상태 배지 (現役 / 卒業 / 欅坂46時代)
  3. 소속 이력 타임라인 (memberships 배열의 시각화. 개명 시점 표시)
  4. **링크 카드 그리드** — 여기가 화면의 60%를 차지해야 한다
  5. 같은 기수 동기 멤버 가로 스크롤

### 4.3 검색

- 전체 데이터가 JSON이므로 **빌드 시 검색 인덱스를 생성**해 클라이언트에 던진다 (약 60KB gzip)
- 매칭 대상: `name.ja.kanji`, `name.ja.kana`, `name.ko.hangul`, `name.en.romaji`, `aliases`
- 히라가나/가타카나 정규화, 한글 초성 검색 지원(`ㅇㄷㅅㅋㄹ` → 엔도 사쿠라)
- 라이브러리 없이 구현. 400건에 fuzzy 라이브러리는 과잉이다.

---

## 5. 디자인 시스템

### 5.1 디자인 콘셉트 — 「坂道日和 / Sakamichi Biyori」

*"슬로프 위의 좋은 날씨"*

이 사이트는 데이터베이스처럼 보이면 안 된다. **누군가의 일기장 옆 페이지**처럼 보여야 한다. 종이의 결이 보이고, 색이 물처럼 번지고, 무언가가 아주 천천히 떠다니는.

세 가지 재료로 만든다:

1. **和紙(washi)** — 배경은 순백이 아니라 미세한 결이 있는 크림색 종이
2. **にじみ(번짐)** — 그룹 색은 칠해지지 않고 스며든다. 경계가 없다
3. **坂(슬로프)** — 페이지 하단을 가로지르는 완만한 곡선. 그룹 전환 시 이 곡선이 모양을 바꾼다

**Signature element**: 하단 언덕선. 이 사이트를 기억하게 만드는 단 하나의 요소다. 나머지는 전부 조용하게 유지한다.

> 회피할 것: 다크모드 기본, 네온 액센트, 유리 카드 남발, 큰 숫자 통계 히어로, 0px 라운드 브루탈리즘. 전부 이 브리프와 반대다.

### 5.2 컬러 토큰

#### 베이스 (그룹 무관, 항상 고정)

```css
--paper:        #FBF8F3;  /* 和紙 크림 — 최하단 배경 */
--paper-deep:   #F4EFE7;  /* 카드 구분용 한 톤 아래 */
--ink:          #3A3630;  /* 본문. 순검정 금지 */
--ink-soft:     #7A736A;  /* 보조 텍스트 */
--ink-faint:    #B5ADA2;  /* 캡션, 구분선 */
--white-veil:   rgba(251, 248, 243, 0.72); /* 카드 배경 (배경이 비침) */
```

#### 그룹 팔레트 (`groups.json` → CSS 변수 주입)

| 그룹 | brand | blobA | blobB | blobC | wash | ink |
|---|---|---|---|---|---|---|
| 乃木坂46 (紫) | `#8A6BC1` | `#B79AE0` | `#D9C6F2` | `#EDE3FA` | `#F3EDFB` | `#3E3355` |
| 櫻坂46 (桜) | `#E88AA6` | `#F3AEC2` | `#F9CFDA` | `#FDE7EE` | `#FCEFF3` | `#57323E` |
| 日向坂46 (空) | `#5AB4E0` | `#8FCFEE` | `#BEE4F7` | `#E2F2FB` | `#EDF6FC` | `#274A5C` |
| 欅坂46 (欅) | `#5FAE84` | `#93CCAB` | `#C0E2CE` | `#E4F2EA` | `#EFF7F2` | `#2C4739` |
| 홈 (mixed) | `#9E8FB8` | `#B79AE0` | `#F3AEC2` | `#8FCFEE` | `#F6F2F8` | `#3A3630` |

> けやき坂46 시대는 日向坂 팔레트를 채도만 -15% 적용해 재사용한다 (당시 공식 상징색이 명확히 확립되지 않았음).

#### 색 전환의 기술적 핵심 — `@property`

CSS Custom Property는 기본적으로 `transition`이 걸리지 않는다. `@property`로 타입을 등록해야 색 보간이 가능하다. **이것을 빼먹으면 색이 뚝뚝 끊긴다.**

```css
@property --g-blob-a { syntax: '<color>'; inherits: true; initial-value: #B79AE0; }
@property --g-blob-b { syntax: '<color>'; inherits: true; initial-value: #F3AEC2; }
@property --g-blob-c { syntax: '<color>'; inherits: true; initial-value: #8FCFEE; }
@property --g-brand  { syntax: '<color>'; inherits: true; initial-value: #9E8FB8; }
@property --g-wash   { syntax: '<color>'; inherits: true; initial-value: #F6F2F8; }
@property --g-ink    { syntax: '<color>'; inherits: true; initial-value: #3A3630; }

:root {
  transition:
    --g-blob-a 1200ms cubic-bezier(0.33, 0.02, 0.16, 1),
    --g-blob-b 1200ms cubic-bezier(0.33, 0.02, 0.16, 1) 80ms,
    --g-blob-c 1200ms cubic-bezier(0.33, 0.02, 0.16, 1) 160ms,
    --g-brand  900ms  cubic-bezier(0.33, 0.02, 0.16, 1),
    --g-wash   900ms  cubic-bezier(0.33, 0.02, 0.16, 1),
    --g-ink    900ms  cubic-bezier(0.33, 0.02, 0.16, 1);
}
```

blob 3개에 **80ms씩 지연을 주는 것**이 핵심이다. 동시에 바뀌면 "색이 스위치된" 느낌이고, 어긋나면 "번져 들어온" 느낌이 된다. 후자가 이 브리프의 요구다.

Safari 16.4 미만은 `@property` 미지원 → 즉시 전환으로 폴백(기능적 문제 없음).

### 5.3 타이포그래피

| 역할 | 서체 | 조달 | 이유 |
|---|---|---|---|
| Display (JA) | **Klee One** (400/600) | Google Fonts | 펜글씨 기반 명조. 교과서체 계열이라 "손으로 쓴 일기" 톤이 정확히 나온다 |
| Display (KO) | **Gowun Batang** (400/700) | Google Fonts | Klee One과 굵기·획 대비가 맞는 몇 안 되는 한글 명조 |
| Display (EN) | **Fraunces** (variable, `SOFT` 축 100 / `WONK` 1) | Google Fonts | 가변축으로 세리프 끝을 물리적으로 둥글게 만들 수 있다. "폭신"을 폰트 레벨에서 구현 |
| Body (JA/EN) | **Zen Maru Gothic** (400/500) | Google Fonts | 라운드 고딕. 일본 블로그 UI의 표준적 부드러움 |
| Body (KO) | **Gowun Dodum** (400) | Google Fonts | Zen Maru Gothic과 글줄 높이가 잘 맞음 |
| 숫자/라벨 | **Zen Kaku Gothic New** (500) | Google Fonts | 날짜·기수 번호 전용. 본문과 구분되는 중립성 |

> **의도적 리스크**: Fraunces의 `SOFT` 가변축 사용. 흔한 선택이 아니고, 이 브리프("폭신폭신")를 폰트의 물리적 형태로 직접 번역한다는 점에서 정당하다. `font-variation-settings: 'SOFT' 100, 'WONK' 1, 'opsz' 48;`

#### 로딩 전략

```
- display=swap
- 한국어 서브셋은 unicode-range 로 분할 (Gowun 계열 풀셋은 무겁다)
- 로케일별 조건부 로드: /ko 에서 Gowun 로드, /ja 에서는 로드하지 않는다
- next/font/google 사용, preload는 현재 로케일 Body 서체만
```

#### 타입 스케일 (1.25 배율, 16px 기준)

```
--fs-caption: 0.75rem   (12px)  line-height 1.7
--fs-small:   0.875rem  (14px)  line-height 1.75
--fs-body:    1rem      (16px)  line-height 1.9   ← 일본어 본문은 넉넉하게
--fs-lead:    1.125rem  (18px)  line-height 1.85
--fs-h3:      1.375rem  (22px)  line-height 1.6
--fs-h2:      1.75rem   (28px)  line-height 1.5
--fs-h1:      2.5rem    (40px)  line-height 1.35
--fs-hero:    clamp(2.75rem, 7vw, 4.5rem) line-height 1.2
```

일본어/한국어는 `letter-spacing: 0.04em`, 라틴은 `0`. 세로 리듬을 위해 본문 `line-height`를 1.9로 크게 잡는다 — 이게 "하늘하늘함"의 절반이다.

### 5.4 형태 토큰

```css
--r-sm: 12px;  --r-md: 20px;  --r-lg: 28px;  --r-pill: 999px;

/* 그림자는 검정이 아니라 그룹 잉크색의 저채도 버전 */
--shadow-soft:  0 2px 8px  color-mix(in oklab, var(--g-ink) 8%,  transparent),
                0 12px 32px color-mix(in oklab, var(--g-ink) 6%,  transparent);
--shadow-lift:  0 4px 12px color-mix(in oklab, var(--g-ink) 10%, transparent),
                0 20px 48px color-mix(in oklab, var(--g-ink) 8%,  transparent);

--border-hair: 1px solid color-mix(in oklab, var(--g-ink) 12%, transparent);
```

**테두리보다 그림자를, 그림자보다 배경 대비를 우선**한다. 선이 적을수록 폭신해 보인다.

### 5.5 스페이싱

4px 그리드. `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`. 카드 내부 패딩은 `24px`(모바일 `20px`), 섹션 간격은 `64px`(모바일 `48px`).

---

## 6. 배경 애니메이션 엔진 (핵심 구현)

### 6.1 레이어 구조

```
<AmbientBackground>            position: fixed; inset: 0; z-index: 0; pointer-events: none
 ├ L0  PaperGrain              SVG feTurbulence · 정적 · opacity .045 · mix-blend-mode: multiply
 ├ L1  BlobField               radial-gradient div × 4 · blur(90px) · CSS keyframes
 ├ L2  SlopeLine   ★Signature  SVG path · 하단 고정 · 그룹 전환 시 d 속성 morph
 ├ L3  ParticleCanvas          canvas 2d · 모티프별 파티클
 └ L4  Veil                    상단 15% 크림 그라데이션 (텍스트 가독성 확보)

<main> z-index: 1
```

### 6.2 L0 — PaperGrain

```html
<svg width="0" height="0" style="position:absolute">
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed="7"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
</svg>
```

`filter: url(#grain)`을 건 div를 `opacity: .045; mix-blend-mode: multiply`로 덮는다. **애니메이션 금지** — 노이즈가 움직이면 눈이 피로하고 GPU를 먹는다.

### 6.3 L1 — BlobField

```css
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
  mix-blend-mode: multiply;
}
.blob-1 { width: 62vmax; height: 62vmax; top: -18vmax; right: -14vmax;
          background: radial-gradient(circle at 40% 40%, var(--g-blob-a), transparent 68%);
          animation: drift-1 34s ease-in-out infinite alternate; }
.blob-2 { width: 54vmax; height: 54vmax; bottom: -16vmax; left: -12vmax;
          background: radial-gradient(circle at 60% 40%, var(--g-blob-b), transparent 66%);
          animation: drift-2 41s ease-in-out infinite alternate; }
.blob-3 { width: 44vmax; height: 44vmax; top: 28%; left: 22%;
          background: radial-gradient(circle at 50% 50%, var(--g-blob-c), transparent 70%);
          animation: drift-3 47s ease-in-out infinite alternate; }
.blob-4 { width: 30vmax; height: 30vmax; bottom: 18%; right: 12%;
          background: radial-gradient(circle at 50% 50%, var(--g-blob-a), transparent 72%);
          animation: drift-1 53s ease-in-out infinite alternate-reverse; }

@keyframes drift-1 { from { transform: translate3d(0,0,0)      scale(1);    }
                     to   { transform: translate3d(-6vw,4vh,0) scale(1.14); } }
@keyframes drift-2 { from { transform: translate3d(0,0,0)      scale(1.06); }
                     to   { transform: translate3d(5vw,-5vh,0) scale(0.94); } }
@keyframes drift-3 { from { transform: translate3d(0,0,0)      scale(0.96); }
                     to   { transform: translate3d(4vw,6vh,0)  scale(1.12); } }
```

**주기를 34/41/47/53초로 서로소에 가깝게** 잡는 것이 의도적이다. 최소공배수가 커서 패턴 반복이 사람 눈에 잡히지 않는다.

`transform`과 `opacity`만 애니메이트한다. `top/left/width` 애니메이션 절대 금지(리플로우).

### 6.4 L2 — SlopeLine (Signature)

하단을 가로지르는 완만한 곡선 2겹. 그룹마다 곡선의 `d`가 다르다.

```tsx
// 그룹별 path (viewBox="0 0 1440 240", preserveAspectRatio="none")
const SLOPES: Record<string, string> = {
  home:         'M0,168 C240,120 480,196 720,152 C960,108 1200,178 1440,140 L1440,240 L0,240 Z',
  nogizaka46:   'M0,150 C300,196 560,104 820,140 C1080,176 1260,120 1440,158 L1440,240 L0,240 Z',
  sakurazaka46: 'M0,178 C220,130 460,182 700,128 C940,74  1220,168 1440,124 L1440,240 L0,240 Z',
  hinatazaka46: 'M0,132 C280,168 540,110 800,164 C1060,218 1240,132 1440,166 L1440,240 L0,240 Z',
  keyakizaka46: 'M0,160 C260,110 520,190 780,142 C1040,94  1250,180 1440,136 L1440,240 L0,240 Z',
};
```

- 앞겹: `fill: var(--g-brand); opacity: .16`
- 뒷겹: 같은 path를 `translateY(-14px) scaleY(1.06)`, `fill: var(--g-blob-b); opacity: .22`
- 두 겹이 아주 느리게(60s, 90s) 좌우로 ±2% 시프트 → 언덕이 숨 쉬는 느낌
- 그룹 전환 시 `d` 값을 **Motion의 `<motion.path animate={{ d }}>`** 로 1200ms morph. 모든 path의 커맨드 수와 순서가 동일해야 morph가 성립한다(위 5개 전부 `M,C,C,L,L,Z` 동일 구조 — **새 그룹 추가 시 이 구조를 반드시 지킬 것**).

### 6.5 L3 — ParticleCanvas

```ts
interface ParticleConfig {
  motif: ParticleMotif;
  count: number;        // desktop 기준
  speed: [number, number];   // px/s 범위
  size:  [number, number];   // px 범위
  opacity: [number, number];
  drift: 'up' | 'down' | 'right' | 'still';
}

const MOTIF_CONFIG: Record<ParticleMotif, ParticleConfig> = {
  bubble:  { motif:'bubble',  count: 34, speed:[8,20],  size:[6,26],  opacity:[.18,.42], drift:'up' },
  petal:   { motif:'petal',   count: 26, speed:[14,34], size:[8,18],  opacity:[.30,.62], drift:'down' },
  sparkle: { motif:'sparkle', count: 46, speed:[4,12],  size:[2,6],   opacity:[.25,.75], drift:'right' },
  leaf:    { motif:'leaf',    count: 22, speed:[16,36], size:[10,20], opacity:[.28,.55], drift:'down' },
  mixed:   { motif:'mixed',   count: 30, speed:[8,24],  size:[4,20],  opacity:[.20,.50], drift:'up' },
};
```

**그리기 방식**

| motif | 형태 | 움직임 |
|---|---|---|
| `bubble` | 원 + 상단 좌측 하이라이트 아크 1개 | 위로 상승, `sin(t)` 좌우 흔들림 진폭 12px |
| `petal` | 베지어 2개로 만든 꽃잎 (긴쪽 축 존재) | 하강 + Z축 회전 + 좌우 진자운동(진폭 40px, 주기 4~7s) |
| `sparkle` | 4방향 별(마름모 2개 겹침) + 중심 원 | 제자리 opacity 펄스(2~4s) + 완만한 우측 드리프트 |
| `leaf` | 타원 + 중심 잎맥 선 1개 | 하강 + 회전 + 낙하 속도 변주 |
| `mixed` | bubble 50% / petal 25% / sparkle 25% | 각자 규칙 따름 |

색상은 `getComputedStyle(document.documentElement).getPropertyValue('--g-blob-a' | '--g-blob-b')`에서 **매 프레임이 아니라 200ms 스로틀로** 읽는다. 색 전환 중에도 파티클 색이 따라오되 성능을 먹지 않는다.

**모티프 전환**: 즉시 바꾸지 않는다. 기존 파티클을 `fadeOut` 상태로 전환(600ms, opacity → 0)하면서 새 모티프 파티클을 순차 생성(800ms에 걸쳐). 두 모티프가 잠깐 공존하는 이 구간이 전환의 부드러움을 만든다.

**필수 최적화 (전부 구현할 것)**

```
- DPR 상한 2 (canvas.width = cssW * Math.min(dpr, 2))
- 모바일(<768px): count × 0.55
- document.hidden === true → rAF 중단, visibilitychange 로 재개
- IntersectionObserver 불필요 (fixed 배경)
- 파티클 객체 재사용 (풀링). 화면 밖으로 나가면 재배치, 새 객체 생성 금지
- ctx.shadowBlur 사용 금지 (매우 느림). 필요한 부드러움은 radial-gradient fillStyle 로
- 오프스크린 캔버스에 petal/leaf/sparkle 스프라이트를 사이즈별 4단계로 미리 그려두고 drawImage
```

### 6.6 접근성 — `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .blob { animation: none; }
  :root { transition-duration: 0.01ms !important; }
}
```

- ParticleCanvas는 **마운트 자체를 하지 않는다** (렌더 분기)
- SlopeLine morph는 즉시 적용
- 색 전환은 유지하되 200ms로 단축 (완전 제거하면 그룹 구분 단서를 잃는다)
- 설정과 무관하게 접근할 수 있는 수동 토글을 푸터에 배치: `背景の動きを止める / 배경 움직임 끄기 / Reduce motion` → localStorage 저장

### 6.7 상태 관리

```tsx
// src/app/[locale]/theme-provider.tsx
// 서버 컴포넌트에서 groupId 를 받아 <html> 또는 <body> 에 data-group 속성으로 전달
// CSS 는 [data-group="nogizaka46"] { --g-blob-a: ...; } 형태로 반응
// → JS 상태 관리 라이브러리 불필요. 전환은 순수 CSS 가 담당한다.
```

이 설계의 요점: **색 전환에 React 리렌더가 개입하지 않는다.** `data-group` 속성 하나만 바뀌고 나머지는 브라우저 합성기가 처리한다. 이게 55fps를 지키는 방법이다.

---

## 7. 컴포넌트 명세

```
src/components/
├─ background/
│   ├─ AmbientBackground.tsx    { groupId?: string }
│   ├─ BlobField.tsx            (props 없음. CSS 변수만 소비)
│   ├─ SlopeLine.tsx            { groupId: string }
│   └─ ParticleCanvas.tsx       { motif: ParticleMotif; reduced: boolean }
├─ group/
│   ├─ GroupCard.tsx            { group: Group; locale: Locale }   // 홈 대형 카드
│   ├─ GroupHeader.tsx          { group: Group; locale: Locale }
│   ├─ GroupTabs.tsx            { active: 'current'|'graduated'|'byGen'; groupId: string }
│   └─ LineageTimeline.tsx      { lineage: LineageEntry[]; locale: Locale }
├─ member/
│   ├─ MemberCard.tsx           { member: Member; group: Group; locale: Locale; size?: 'sm'|'md' }
│   ├─ MemberGrid.tsx           { members: Member[]; ... }
│   ├─ GlyphAvatar.tsx          { glyph: string; hueShift: number; size: number }
│   ├─ LinkTile.tsx             { link: MemberLink; locale: Locale }
│   ├─ LinkGrid.tsx             { links: MemberLink[]; locale: Locale }
│   └─ StatusBadge.tsx          { status: MemberStatus; locale: Locale }
├─ generation/
│   ├─ GenerationSection.tsx    { generation: Generation; members: Member[]; ... }
│   └─ GenerationChip.tsx       { generation: Generation; locale: Locale; active?: boolean }
├─ search/
│   ├─ SearchBox.tsx
│   └─ SearchResults.tsx
└─ ui/
    ├─ Ruby.tsx                 { kanji: string; kana: string; show: boolean }
    ├─ LocaleSwitcher.tsx
    ├─ MotionToggle.tsx
    ├─ Pill.tsx
    └─ icons/                   SNS 아이콘 8종 (인라인 SVG 컴포넌트)
```

### 7.1 GroupCard (홈의 주인공)

```
┌──────────────────────────────────────┐   ← border-radius: 28px
│                                      │      background: var(--white-veil)
│   乃木坂46                            │      backdrop-filter: blur(12px)
│   のぎざかフォーティーシックス            │      box-shadow: --shadow-soft
│   노기자카46 / Nogizaka46             │      padding: 32px
│                                      │
│   2011.08.21 —                       │
│   6期生 · 現役 34名 · 卒業生 52名      │   ← 숫자는 데이터에서 계산
│                                      │
│   ╭──╮ ╭──╮ ╭──╮  +31               │   ← 글리프 아바타 3개 미리보기
│   ╰──╯ ╰──╯ ╰──╯                    │      (최근 가입 기수에서 추출)
│                                      │
│                        見る  →        │
└──────────────────────────────────────┘
```

- **hover/focus**: `translateY(-6px)`, `--shadow-lift`, 배경 프리뷰 40% 전환, 언덕선이 해당 그룹 곡선으로 40% morph
- 전환: `transform 420ms cubic-bezier(0.2,0.8,0.2,1)`
- 3장이 세로로 쌓이는 게 아니라 **데스크톱에서 가로 3열, 카드 높이 동일**. 태블릿 이하 1열.
- 각 카드의 hover 프리뷰 색은 서로 겹치지 않게 — 카드를 떠나면 400ms 후 홈 팔레트로 복귀

### 7.2 MemberCard

```
┌───────────────────────┐
│  ╭────╮               │   글리프 아바타 56px
│  │ 遠 │  遠藤さくら      │   이름: Display 서체 20px
│  ╰────╯  えんどうさくら   │   かな: 12px, --ink-soft
│          4期生 · 現役    │   메타: 12px, Zen Kaku
│                       │
│  ⌾ ⌾ ⌾                │   보유 링크 타입 도트 (최대 5개 + more)
└───────────────────────┘
```

- 카드 배경 `var(--white-veil)`, 라운드 20px
- hover: `translateY(-3px)` + 그림자 강화 + 아바타 `scale(1.06)`
- 졸업 멤버: 아바타 채도 -30%, 이름 옆 작은 `卒` 배지
- 欅坂46 시대 멤버: 아바타 테두리를 초록 계열로
- **그리드**: `repeat(auto-fill, minmax(220px, 1fr))`, gap 16px. 모바일 2열 유지(1열로 떨어뜨리지 말 것 — 목록이 너무 길어진다)

### 7.3 GlyphAvatar — 사진 대체의 핵심

```tsx
// 원형 배경 = conic 또는 radial gradient (그룹 palette + hueShift)
// 그 위에 姓 첫 글자를 Display 서체로 중앙 배치
// 배경 그라데이션 각도를 id 해시로 결정 → 같은 그룹 안에서도 개체별 차이 발생
// 테두리: 2px solid color-mix(in oklab, var(--g-brand) 30%, transparent)
// 안쪽에 아주 옅은 inset shadow → 종이에 찍은 도장 느낌
```

hueShift는 `member.avatar.hueShift` (-40~+40). 데이터 생성 시 id 문자열 해시로 결정론적 계산 → 빌드마다 색이 바뀌지 않는다.

### 7.4 LinkTile (최종 목적지)

```
┌──────────────────────────────┐
│  [icon]  公式ブログ            │   ← 44px 이상 터치 타깃
│          nogizaka46.com    ↗  │
└──────────────────────────────┘
```

- 링크 타입별 아이콘 색: 브랜드 컬러 사용하되 **채도를 낮춰 그룹 팔레트와 충돌하지 않게** (`filter: saturate(0.75)`)
- `target="_blank" rel="noopener noreferrer"`
- `status === 'dead'`: 회색조 + `cursor: not-allowed` + 「アーカイブ / 아카이브 / Archived」 배지, `<a>` 대신 `<div aria-disabled>`
- `status === 'redirected'`: 정상 동작하되 개발 모드에서만 경고 표시

### 7.5 Ruby

일본어 로케일에서만 `<ruby>漢字<rt>かな</rt></ruby>`를 사용한다. 한국어/영어 로케일에서는 かな를 별도 줄에 작게 배치 (ruby는 CJK 비사용자에게 혼란을 준다).

---

## 8. 국제화 (i18n)

### 8.1 구성

```
/messages
  ├─ ja.json
  ├─ ko.json
  └─ en.json
```

```ts
// src/i18n/config.ts
export const locales = ['ja', 'ko', 'en'] as const;
export const defaultLocale = 'ja';
export const localePrefix = 'always';
```

### 8.2 메시지 키 구조 (네임스페이스 필수)

```json
{
  "common": { "siteName": "…", "viewMore": "…", "back": "…" },
  "nav":    { "home": "…", "search": "…", "about": "…" },
  "group":  { "tabCurrent": "…", "tabGraduated": "…", "tabByGen": "…",
              "memberCount": "{count}名", "debutedOn": "…",
              "archiveLink": "{name}時代を見る" },
  "member": { "statusActive": "…", "statusGraduated": "…",
              "joinedOn": "…", "graduatedOn": "…",
              "linksHeading": "…", "sameGeneration": "…",
              "noLinks": "…" },
  "link":   { "official_blog": "…", "x": "…", "instagram": "…",
              "archived": "…", "openExternal": "…" },
  "search": { "placeholder": "…", "noResults": "…", "resultCount": "{count}件" },
  "about":  { "disclaimerTitle": "…", "disclaimerBody": "…",
              "sourcesTitle": "…", "takedownTitle": "…" },
  "a11y":   { "skipToContent": "…", "reduceMotion": "…", "changeLanguage": "…" }
}
```

### 8.3 로케일별 표기 규칙

| 항목 | ja | ko | en |
|---|---|---|---|
| 멤버명 | 漢字 + ruby(かな) | 한글 (漢字 병기, 작게) | Romaji |
| 그룹명 | 乃木坂46 | 노기자카46 | Nogizaka46 |
| 기수 | 4期生 | 4기생 | 4th Gen. |
| 날짜 | 2019年2月11日 | 2019년 2월 11일 | Feb 11, 2019 |
| 인원 | 34名 | 34명 | 34 members |
| 정렬 기준 | かな 50음순 | かな 50음순 (원음 기준 유지) | Romaji A-Z |

> **판단**: 한국어에서도 정렬은 かな 순을 유지한다. 한글 가나다순으로 바꾸면 일본 공식 사이트와 순서가 달라져 대조 검색이 어려워진다. 사용자는 "공식 사이트에서 본 순서"를 기대한다.

### 8.4 SEO

```tsx
// 각 페이지 generateMetadata 에서
alternates: {
  canonical: `https://<도메인>/${locale}${path}`,
  languages: { ja: `…/ja${path}`, ko: `…/ko${path}`, en: `…/en${path}`,
               'x-default': `…/ja${path}` },
}
```

- `sitemap.xml` 자동 생성 (전 로케일 × 전 페이지)
- `robots.txt`: 크롤링 허용, `/api/` 만 차단
- OG 이미지: `@vercel/og`로 **그룹 컬러 그라데이션 + 텍스트만** 동적 생성. 인물 사진 사용 금지.

---

## 9. 품질 기준 (측정 가능한 것만)

### 9.1 성능 예산 — 초과 시 빌드 실패 처리

| 지표 | 기준 | 측정 |
|---|---|---|
| 초기 JS (gzip) | ≤ 165 KB | `next build` 출력 |
| LCP (모바일 4G) | ≤ 1.8s | Lighthouse CI |
| CLS | ≤ 0.03 | Lighthouse CI |
| INP | ≤ 200ms | Lighthouse CI |
| 배경 애니메이션 FPS | ≥ 55 (M1 MacBook, Chrome) | 수동 DevTools 계측, 결과를 PR에 첨부 |
| 전체 폰트 (현재 로케일) | ≤ 240 KB | — |

FPS 계측을 스킵하지 말 것. 이 프로젝트에서 배경은 부가 요소가 아니라 주 기능이다.

### 9.2 접근성 (WCAG 2.1 AA)

- 모든 팔레트 조합에서 본문 텍스트 대비 **4.5:1 이상** — CI에서 자동 검사 (`scripts/check-contrast.ts`가 groups.json의 ink/wash 조합을 전수 계산)
- 포커스 링: `outline: 2px solid var(--g-brand); outline-offset: 3px` — 배경이 옅으므로 반드시 보인다
- 키보드만으로 홈 → 그룹 → 멤버 → 외부 링크 도달 가능
- 스킵 링크 (첫 Tab)
- 배경 캔버스 `aria-hidden="true"`
- 탭 컴포넌트는 WAI-ARIA Tabs 패턴 준수 (`role="tablist"`, 좌우 화살표 이동)
- 터치 타깃 최소 44×44px

### 9.3 코드 품질

```
- TypeScript strict, noUncheckedIndexedAccess
- ESLint: @typescript-eslint/recommended-type-checked + eslint-plugin-jsx-a11y
- 컴포넌트 파일 200줄 초과 시 분할
- 'use client' 는 실제 필요한 곳에만 (ParticleCanvas, SearchBox, LocaleSwitcher, MotionToggle, GroupTabs)
- 데이터 접근은 반드시 src/lib/data.ts 의 함수 경유. 컴포넌트에서 JSON 직접 import 금지
```

---

## 10. 파일 트리 (최종 형태)

```
sakamichi-hub/
├─ data/
│  ├─ groups.json
│  ├─ members.json
│  ├─ link-report.json
│  └─ CHANGELOG.md
├─ messages/{ja,ko,en}.json
├─ scripts/
│  ├─ lib/{fetcher.ts,romaji.ts,hangul.ts,parse-html.ts}
│  ├─ fetch/{nogizaka.ts,sakurazaka.ts,hinatazaka.ts}
│  ├─ build-search-index.ts
│  ├─ check-links.ts
│  ├─ check-contrast.ts
│  └─ validate.ts
├─ src/
│  ├─ app/
│  │  ├─ [locale]/
│  │  │  ├─ layout.tsx           ← AmbientBackground, ThemeProvider, 폰트
│  │  │  ├─ page.tsx             ← 홈
│  │  │  ├─ g/[groupId]/page.tsx
│  │  │  ├─ g/[groupId]/gen/[genId]/page.tsx
│  │  │  ├─ g/[groupId]/archive/page.tsx
│  │  │  ├─ m/[memberId]/page.tsx
│  │  │  ├─ search/page.tsx
│  │  │  └─ about/page.tsx
│  │  ├─ opengraph-image.tsx
│  │  ├─ sitemap.ts
│  │  └─ globals.css             ← @property 선언, 토큰, keyframes
│  ├─ components/                ← §7 구조
│  ├─ design/
│  │  ├─ tokens.ts               ← 스페이싱/타입 스케일 (TS에서 참조용)
│  │  └─ slopes.ts               ← SlopeLine path 정의
│  ├─ i18n/{config.ts,request.ts}
│  └─ lib/
│     ├─ schema.ts               ← 제공된 sakamichi.schema.ts
│     ├─ data.ts                 ← 유일한 데이터 접근 계층
│     ├─ format.ts               ← 날짜/인원수 로케일 포맷
│     └─ search.ts
├─ public/search-index.json      ← 빌드 시 생성
├─ .github/workflows/
│  ├─ ci.yml                     ← lint, typecheck, validate, build
│  └─ link-check.yml             ← 주 1회 cron
├─ next.config.ts
├─ tailwind.config.ts
└─ README.md
```

---

## 11. 실행 순서 — Phase별 작업 카드

각 Phase는 **하나의 PR**로 만든다. DoD를 만족하지 못하면 다음 Phase로 넘어가지 않는다.

---

### ▸ Phase 0 — 골격

**작업**
1. `pnpm create next-app` (TS, App Router, Tailwind, ESLint, src dir)
2. `next-intl`, `zod`, `motion` 설치
3. `src/lib/schema.ts`에 제공된 스키마 배치
4. `tsconfig` strict 옵션 강화
5. `/ja` `/ko` `/en` 라우팅이 동작하는 빈 페이지

**DoD**
- [ ] `pnpm typecheck` `pnpm lint` `pnpm build` 전부 통과
- [ ] 3개 로케일 URL이 각각 다른 텍스트를 표시
- [ ] Vercel 프리뷰 배포 성공

---

### ▸ Phase 1 — 데이터 계약과 그룹 시드

**작업**
1. `data/groups.json` 작성 — 3그룹 전부. 팔레트는 §5.2 표 그대로, lineage/generations는 **공식 사이트에서 확인 후** 기입
2. `scripts/validate.ts` — zod 파싱 + `checkIntegrity()` 실행, 실패 시 `exit(1)`
3. `src/lib/data.ts` — `getGroups()`, `getGroup(id)`, `getGenerations(groupId)`
4. **공식 사이트 3곳의 멤버 목록 페이지를 실제로 fetch해서 DOM 구조를 확인**하고, 그 결과를 `scripts/fetch/NOTES.md`에 기록

**DoD**
- [ ] `pnpm data:validate` 통과
- [ ] groups.json의 모든 `provenance.sourceUrl`이 실제 공식 URL
- [ ] `NOTES.md`에 3사이트의 셀렉터/구조가 문서화됨
- [ ] 구조가 §3.3.1과 다르면 **작업 중단하고 보고** (임의 대체 금지)

---

### ▸ Phase 2 — 멤버 데이터 수집

**작업**
1. `scripts/lib/fetcher.ts` — 레이트리밋·UA·robots 확인 (§3.3.3 전부 구현)
2. 그룹별 fetch 스크립트 3종
3. `romaji.ts` — かな→헵번 변환. 예외 처리(ん+모음, 促音, 長音, は/へ 조사 아님) 필수
4. `hangul.ts` — 국립국어원 표기법 변환. **자동 변환 결과 전건에 `provenance.source='manual'`, `note:'auto-converted, needs human review'` 표기**
5. 졸업생: wikipedia_ja 보완
6. `scripts/check-links.ts`

**DoD**
- [ ] `members.json` 건수가 공식 사이트 현역 멤버 수와 정확히 일치 (그룹별로 명시적 비교 로그 출력)
- [ ] 모든 `officialCode`가 string 타입이며 0 패딩 보존
- [ ] `check-links` 실행 후 현역 멤버 블로그 링크 `ok` 비율 ≥ 98%
- [ ] `unverified` 상태로 남은 링크 목록을 PR 본문에 명시

---

### ▸ Phase 3 — 디자인 토큰과 배경 엔진

**작업**
1. `globals.css` — `@property` 선언, 베이스 토큰, `[data-group="…"]` 팔레트 블록
2. 폰트 로딩 (`next/font/google`, 로케일 조건부)
3. `AmbientBackground` 4레이어 전부 구현 (§6)
4. `MotionToggle` + `prefers-reduced-motion` 분기
5. 개발용 페이지 `/dev/bg`에 그룹 전환 버튼 4개 → **색·언덕·파티클 전환을 눈으로 검수**

**DoD**
- [ ] 4개 그룹 + 홈, 총 5개 상태로 전환 시 색이 끊기지 않고 보간됨
- [ ] SlopeLine morph가 튀지 않음 (path 커맨드 구조 일치 확인)
- [ ] 파티클 모티프 크로스페이드 동작
- [ ] DevTools Performance 30초 녹화에서 평균 55fps 이상 — **스크린샷을 PR에 첨부**
- [ ] `prefers-reduced-motion: reduce`에서 canvas가 DOM에 아예 없음
- [ ] 데스크톱/모바일 뷰포트 각각 검수

---

### ▸ Phase 4 — 페이지와 컴포넌트

**작업**
1. `GlyphAvatar` → `MemberCard` → `MemberGrid` 순서로 상향식 구현
2. 홈 (`GroupCard` 3장 + hover 프리뷰)
3. 그룹 페이지 (탭 3종, ARIA Tabs 패턴)
4. 기수 페이지, 아카이브 페이지
5. 멤버 상세 (`LinkGrid`가 화면 60%)
6. 검색 (인덱스 빌드 + 초성 검색)

**DoD**
- [ ] 홈 → 그룹 → 기수 → 멤버 → 외부 링크까지 **마우스만으로** 도달
- [ ] 같은 경로를 **키보드만으로** 도달
- [ ] 졸업생/dead 링크 표시가 §7.4대로 동작
- [ ] `renderableLinks()`를 거치지 않는 링크 렌더링 코드가 0건 (grep으로 확인)
- [ ] 모바일 375px에서 가로 스크롤 발생 0건

---

### ▸ Phase 5 — 3언어 완성

**작업**
1. `messages/*.json` 3종 완성 (§8.2 키 구조)
2. `Ruby` 컴포넌트, 로케일별 이름 표시 분기
3. 날짜/인원 포맷터
4. `LocaleSwitcher` — **현재 페이지를 유지한 채** 언어만 전환
5. hreflang, sitemap, OG 이미지

**DoD**
- [ ] 하드코딩 문자열 0건 (`grep -rn '[ぁ-ん一-龯가-힣]' src/components` 결과가 비어 있음)
- [ ] 언어 전환 시 같은 멤버 페이지에 머무름
- [ ] 3언어 각각 스크린샷 제출 (홈/그룹/멤버 = 9장)

---

### ▸ Phase 6 — 마감

**작업**
1. `/about` — 출처 표기, Wikipedia CC BY-SA 4.0 고지, 비공식 팬사이트 면책, 삭제 요청 연락처
2. `check-contrast.ts` CI 통합
3. Lighthouse CI 통합 (§9.1 기준값)
4. `link-check.yml` cron
5. `README.md` — 데이터 갱신 절차를 사람이 따라할 수 있게 서술
6. 404 페이지 (언덕선 활용)

**DoD**
- [ ] Lighthouse 4개 항목 전부 90 이상 (Performance/A11y/Best Practices/SEO)
- [ ] 대비 검사 전항목 통과
- [ ] `/about`에 §12의 4개 요소 전부 포함
- [ ] 프로덕션 배포 완료

---

## 12. 법적 고지 — `/about`에 반드시 포함할 4가지

1. **비공식 팬사이트 선언**
   "본 사이트는 팬이 운영하는 비공식·비영리 사이트입니다. 乃木坂46 / 櫻坂46 / 日向坂46 및 운영사(株式会社Seed & Flower, 株式会社Sony Music Labels)와 일체 관계가 없습니다."

2. **콘텐츠 정책**
   "본 사이트는 인물 사진, 로고, 음원, 블로그 본문을 일절 게재하지 않습니다. 공식 페이지로의 링크만 제공합니다."

3. **출처 표기**
   "멤버 정보는 각 그룹 공식 사이트 및 日本語版Wikipedia(CC BY-SA 4.0)를 출처로 합니다. 최종 갱신: YYYY-MM-DD"

4. **삭제 요청 창구**
   연락처 이메일 + "권리자로부터 요청이 있을 경우 신속히 대응합니다" 명시.

3언어 전부 작성한다. 이건 형식적 문구가 아니라 이 사이트가 존속할 수 있는 근거다.

---

## 13. 에이전트가 판단을 멈추고 보고해야 하는 상황

다음 상황에서는 **추측으로 진행하지 말고 작업을 중단하고 사람에게 보고**한다:

| 상황 | 왜 위험한가 |
|---|---|
| 공식 사이트 DOM 구조가 §3.3.1과 다름 | 잘못된 셀렉터로 쓰레기 데이터를 400건 만들게 된다 |
| robots.txt가 대상 경로를 Disallow | 법적/윤리적 문제 |
| 429/403 응답 반복 | 차단 상태. 우회 시도 금지 |
| 멤버 수가 예상 범위(그룹당 20~60)를 벗어남 | 파싱 실패 신호 |
| 한글 표기 자동 변환 결과가 애매함 | 인명 오표기는 되돌리기 어렵다 |
| 성능 예산 초과 | 설계 문제일 가능성. 예산을 늘려 넘기지 말 것 |
| 새 기수/새 그룹 발견 | 데이터 구조 확장 판단이 필요 |

보고 형식: 무엇을 하려 했는지 / 무엇이 예상과 달랐는지 / 선택지 2~3개 / 권고안.

---

## 14. 인수 체크리스트 (최종)

**데이터**
- [ ] 3그룹 × 전 기수 현역 멤버가 공식 사이트와 건수 일치
- [ ] 졸업생 수록 (欅坂46 시대 포함)
- [ ] 모든 링크에 `status !== 'unverified'`
- [ ] `isOfficial: false` 링크 0건
- [ ] 인물 사진 파일 0건 (`find public -name '*.jpg' -o -name '*.png'` 결과에 인물 없음)

**기능**
- [ ] 3언어 전 페이지 전환
- [ ] 그룹 전환 시 색·언덕·파티클 동시 변화
- [ ] 검색이 한자/かな/한글/로마자/초성 전부 매칭
- [ ] 모든 외부 링크 `rel="noopener noreferrer"`

**품질**
- [ ] Lighthouse 4항목 90+
- [ ] 대비 AA 전항목 통과
- [ ] reduced-motion 대응
- [ ] 배경 55fps+ (계측 증빙 제출)
- [ ] 모바일 375px ~ 데스크톱 1920px 레이아웃 무결

**운영**
- [ ] 주간 링크 체크 워크플로 동작 확인
- [ ] `/about` 4요소 3언어
- [ ] README에 데이터 갱신 절차 기술

---

## 부록 A — groups.json 시드 (구조 예시)

> 아래는 **구조 참고용**이다. `lineage`, `generations`, 날짜는 Phase 1에서 공식 사이트로 검증 후 확정한다.

```json
{
  "schemaVersion": "1.0.0",
  "generatedAt": "2026-08-16",
  "groups": [
    {
      "id": "nogizaka46",
      "order": 1,
      "name": { "ja": "乃木坂46", "ko": "노기자카46", "en": "Nogizaka46" },
      "shortName": { "ja": "乃木坂", "ko": "노기자카", "en": "Nogi" },
      "status": "active",
      "debutedOn": "2011-08-21",
      "lineage": [
        {
          "id": "nogizaka46",
          "name": { "ja": "乃木坂46", "ko": "노기자카46", "en": "Nogizaka46" },
          "from": "2011-08-21",
          "to": null,
          "color": "#8A6BC1",
          "logoUsageAllowed": false
        }
      ],
      "palette": {
        "brand": "#8A6BC1", "blobA": "#B79AE0", "blobB": "#D9C6F2",
        "blobC": "#EDE3FA", "wash": "#F3EDFB", "ink": "#3E3355"
      },
      "motif": "bubble",
      "official": {
        "site": "https://www.nogizaka46.com/",
        "blogIndex": "https://www.nogizaka46.com/s/n46/diary/MEMBER/list",
        "x": null, "instagram": null, "youtube": null, "tiktok": null
      },
      "blogUrlTemplate": "https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000&ct={code}",
      "generations": [
        {
          "id": "nogi-g1", "order": 1, "sortSuffix": 0,
          "label": { "ja": "1期生", "ko": "1기생", "en": "1st Generation" },
          "joinedOn": "2011-08-21",
          "joinedUnderLineageId": "nogizaka46",
          "note": null
        }
      ],
      "description": { "ja": "…", "ko": "…", "en": "…" },
      "provenance": {
        "source": "official",
        "sourceUrl": "https://www.nogizaka46.com/",
        "checkedAt": "2026-08-16",
        "note": null
      }
    }
  ]
}
```

**櫻坂46 lineage 작성 시 주의**

```json
"lineage": [
  { "id": "keyakizaka46",  "from": "2015-08-21", "to": "2020-10-12", "color": "#5FAE84", ... },
  { "id": "sakurazaka46",  "from": "2020-10-14", "to": null,          "color": "#E88AA6", ... }
]
```

`generations`에서 1期生/2期生은 `joinedUnderLineageId: "keyakizaka46"`, 3期生 이후는 `"sakurazaka46"`. 「新2期生」은 `order: 2, sortSuffix: 1`로 표현한다.

**日向坂46 lineage**

```json
"lineage": [
  { "id": "hiragana-keyaki", "from": "2015-11-30", "to": "2019-02-10", ... },
  { "id": "hinatazaka46",    "from": "2019-02-11", "to": null,          ... }
]
```

けやき坂46 시절 1期生/2期生 → `joinedUnderLineageId: "hiragana-keyaki"`, 3期生 이후 → `"hinatazaka46"`.

---

## 부록 B — 검증에 쓸 수 있는 참고 데이터베이스

교차 검증 **참고용**으로만 사용한다. 데이터를 여기서 복사하지 않는다. 공식 사이트 파싱 결과와 건수가 맞는지 확인하는 용도다.

- `n46db.com/saka/saka-chronology.php` — 坂道 각 기수 가입일 정리
- `kasumizaka46.com` (HINABASEPLUS) — 坂道 종합 DB
- `ja.wikipedia.org` 각 그룹 문서 — 졸업생 보완의 정식 출처 (CC BY-SA 4.0, 출처 표기 필수)

---

## 부록 C — Antigravity CLI 실행 프롬프트 템플릿

각 Phase 시작 시 아래 형태로 지시한다.

```
이 리포지토리에서 Phase N 을 수행한다.

작업지시서: ./docs/sakamichi-hub-work-order.md
데이터 스키마: ./src/lib/schema.ts

준수 사항:
- 지시서 §0의 최우선 규칙 5개를 절대 위반하지 않는다
- Phase N의 DoD 항목을 전부 만족할 때까지 완료 보고하지 않는다
- 데이터는 fetch 결과만 사용한다. 기억으로 채우지 않는다
- §13의 중단 조건에 해당하면 즉시 멈추고 보고한다
- 커밋은 Phase 단위 1개, 메시지는 `feat(phaseN): …`

완료 시 제출물:
1. 변경 파일 목록
2. DoD 체크리스트 (전항목 근거 포함)
3. 실행한 검증 명령어와 그 출력
4. 판단이 필요했던 지점과 선택 근거
```

---

*문서 끝. 이 지시서를 벗어나는 설계 변경이 필요하다고 판단되면, 변경하지 말고 근거와 함께 제안할 것.*
