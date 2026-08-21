# 🌸 사카미치 & 48그룹 통합 포털 (Sakamichi Hub) 시스템 인수인계서

> **문서 버전:** 2.0.0  
> **최종 수정일:** 2026-08-16  
> **프로젝트 루트:** `D:\drive\programming\window\Sakamichi Box`  
> **GitHub 저장소:** [https://github.com/royaljjong/sakamichi-hub](https://github.com/royaljjong/sakamichi-hub)  
> **Vercel 라이브:** [https://sakamichi-hub.vercel.app](https://sakamichi-hub.vercel.app)  

> ⚠️ **현행 계약**: 이 문서는 2026-08-16 시점 서술 기록입니다. 실행 계약은 [`AUDIT_AND_REBUILD_PLAN.md`](./AUDIT_AND_REBUILD_PLAN.md) + [`CODEX_HANDOVER.md`](./CODEX_HANDOVER.md)를 우선합니다.

---

## 1. 📌 프로젝트 개요 및 아키텍처

**사카미치 허브(Sakamichi Hub)**는 일본 3대 사카미치 그룹(**노기자카46, 사쿠라자카46, 히나타자카46**)과 **AKB48 그룹(국내 6개 그룹 및 해외 7개 자매그룹)**의 현역 멤버, 연구생, 졸업생(OG) 정보와 공식 SNS, 블로그 최신 갱신 피드를 통합 제공하는 Next.js 기반 다국어 웹 애플리케이션입니다.

### 🛠️ 기술 스택
* **Framework:** Next.js 15.5.23 (App Router, SSG 기반 1,056개 정적 페이지 사전 생성)
* **Language:** TypeScript 5.x
* **Styling:** Tailwind CSS v4, Vanilla CSS 토큰 시스템 (`src/app/globals.css`, OKLCH 컬러 팔레트)
* **Internationalization:** `next-intl` (3개 국어: `ja` 기본, `ko`, `en`)
* **Validation:** `zod` 3.x (스키마 무결성 검증)
* **Package Manager:** `pnpm` 10.x
* **Deployment:** Vercel (Edge Middleware + Static Exports)

---

## 2. 🗂️ 프로젝트 디렉터리 및 핵심 파일 구성

```
Sakamichi Box/
├── data/                               # 애플리케이션 원천 데이터 (JSON)
│   ├── groups.json                     # 16개 그룹 메타데이터 (아이디, 색상, 기수 정의, 공식 링크)
│   ├── members.json                    # 299명 전체 멤버 데이터셋 (프로필, 사진, SNS 링크, 기수)
│   └── latest-updates.json             # 공식 블로그 최신 피드 (사카미치 30개 + 48G 30개 = 60개)
│
├── scripts/                            # 데이터 수집, 파싱, 검증 파이프라인
│   ├── fetch/
│   │   ├── all.ts                      # 통합 데이터 수집 진입점 (pnpm data:fetch)
│   │   ├── nogizaka.ts                 # 노기자카46 공식 API 파서 + SNS 딕셔너리 매핑
│   │   ├── sakurazaka.ts               # 사쿠라자카46 크롤러 (목록 파서 + 상세 페이지 폴백)
│   │   ├── hinatazaka.ts               # 히나타자카46 크롤러 (공식 검색 목록 파서)
│   │   ├── graduates.ts                # 사쿠라자카/히나타자카 졸업생 아카이브 데이터
│   │   ├── akb48g.ts                   # AKB48 및 13개 자매그룹 데이터셋 & 이미지 매핑
│   │   ├── updates.ts                  # 최신 블로그 크롤러 (사카미치 30 + AKB48G 30)
│   │   └── official-48-images.json     # 48그룹 웹사이트 스크래핑 이미지 캐시
│   ├── lib/
│   │   ├── romaji.ts                   # 가나 -> 헵번식 로마자 변환 유틸
│   │   ├── hangul.ts                   # 가나 -> 한글 외래어 표기법 변환 유틸
│   │   ├── avatar.ts                   # 멤버 성씨 기반 아바타 글리프 생성기
│   │   └── fetcher.ts                  # HTTP 요청 래퍼 (타임아웃, 재시도)
│   └── validate.ts                     # Zod 스키마 및 그룹-기수 외래키 정합성 검사기
│
├── src/
│   ├── app/
│   │   ├── [locale]/                   # 다국어 라우트
│   │   │   ├── layout.tsx              # 글로벌 레이아웃 (테마, 폰트, 헤더, 푸터)
│   │   │   ├── page.tsx                # 메인 홈 (사카미치 카드 + 48G 카드 + 상하단 30/30 피드)
│   │   │   ├── about/page.tsx          # 사이트 소개 페이지
│   │   │   ├── search/page.tsx         # 통합 검색 페이지 (이름, 한글, 가나, 롬자 검색)
│   │   │   ├── g/[groupId]/            # 그룹 상세 페이지
│   │   │   │   ├── page.tsx            # 그룹 메인 (현역/졸업/기수별 탭 뷰)
│   │   │   │   ├── gen/[genId]/page.tsx# 개별 기수 아카이브 페이지
│   │   │   │   └── archive/page.tsx    # 그룹별 전체 졸업생 아카이브
│   │   │   └── m/[memberId]/page.tsx   # 멤버 개별 프로필 및 공식 SNS 링크 페이지
│   │   └── api/updates/route.ts        # 최신 블로그 갱신 JSON API 엔드포인트
│   │
│   ├── components/
│   │   ├── group/
│   │   │   ├── GroupView.tsx           # 그룹 뷰 컨테이너
│   │   │   ├── GroupTabs.tsx           # 탭 바 ([현역 멤버] / [졸업 멤버] / [기수별])
│   │   │   ├── GroupCard.tsx           # 홈 화면 그룹 카드
│   │   │   └── GroupHeader.tsx         # 그룹 상세 상단 헤더
│   │   ├── member/
│   │   │   ├── MemberCard.tsx          # 멤버 카드 컴포넌트
│   │   │   ├── MemberGrid.tsx          # 반응형 멤버 그리드
│   │   │   ├── MemberAvatar.tsx        # 사진 로딩 + 실패 시 GlyphAvatar 폴백
│   │   │   └── GlyphAvatar.tsx         # 성씨 한자 + 컬러 쉬프트 기반 아바타
│   │   ├── home/
│   │   │   └── LatestUpdatesFeed.tsx   # 드래그/스와이프 지원 가로 스크롤 블로그 피드
│   │   └── ui/
│   │       ├── Navigation.tsx          # 상단 글로벌 네비게이션
│   │       └── Footer.tsx              # 하단 푸터
│   │
│   ├── lib/
│   │   ├── schema.ts                   # Zod 데이터 모델 정의 및 타입 추론
│   │   └── data.ts                     # 데이터 로더 헬퍼 (getMembers, getGroup, searchMembers 등)
│   └── i18n/                           # next-intl 설정 (routing.ts, request.ts)
│
├── messages/                           # UI 다국어 번역 딕셔너리 (ja.json, ko.json, en.json)
└── HANDOVER.md                         # 본 인수인계 문서
```

---

## 3. 📊 데이터 파이프라인 및 소스 구조

### 3.1 그룹 구성 (`data/groups.json`) — 총 16개 그룹
1. **사카미치 3개 그룹:**
   * `nogizaka46` (노기자카46 - 보라색 계열 `#7E2082`)
   * `sakurazaka46` (사쿠라자카46 - 벚꽃 핑크 계열 `#F398B4`)
   * `hinatazaka46` (히나타자카46 - 하늘색 계열 `#7AC2DE`)
2. **AKB48 국내 6개 그룹:**
   * `akb48` (AKB48), `ske48` (SKE48), `nmb48` (NMB48), `hkt48` (HKT48), `ngt48` (NGT48), `stu48` (STU48)
3. **AKB48 해외 7개 자매그룹:**
   * `jkt48` (자카르타), `bnk48` (방콕), `cgm48` (치앙마이), `mnl48` (마닐라), `akb48-team-sh` (상하이), `akb48-team-tp` (타이베이), `klp48` (쿠알라룸푸르)

### 3.2 멤버 데이터셋 (`data/members.json`) — 총 299명
* **乃木坂46 (96명):** 현역 34명 + 졸업생 62명 (1기~6기생)
  * 수집 경로: 노기자카46 공식 API (`fetchNogizaka`) + `NOGI_SNS_MAP` 사전 매핑
* **櫻坂46 (50명):** 현역 32명 + 졸업생 18명 (1기~4기생)
  * 수집 경로: 사쿠라자카46 공식 사이트 크롤링 (`fetchSakurazaka`) + `graduates.ts`
* **日向坂46 (39명):** 현역 27명 + 졸업생 12명 (1기~5기생)
  * 수집 경로: 히나타자카46 공식 사이트 크롤링 (`fetchHinatazaka`) + `graduates.ts`
* **AKB48 및 자매그룹 (114명):**
  * AKB48 (33명), SKE48 (14명), NMB48 (15명), HKT48 (13명), NGT48 (11명), STU48 (17명), 해외 그룹 (11명)
  * 수집 경로: `scripts/fetch/akb48g.ts`

---

## 4. 🧩 주요 기능별 세부 구현 및 로직

### 4.1 크롤링 및 이미지 파싱 로직
* **노기자카46 (`scripts/fetch/nogizaka.ts`):**
  * 공식 JSONP API(`https://www.nogizaka46.com/s/n46/api/list/member`)를 정규식으로 JSON 파싱하여 현역 및 역대 졸업 멤버를 추출.
  * 멤버 한자명을 키로 `NOGI_SNS_MAP`에서 검증된 개인 SNS(X, Instagram, YouTube, 개인 공식 사이트)를 주입.
* **사쿠라자카46 (`scripts/fetch/sakurazaka.ts`):**
  * `https://sakurazaka46.com/s/s46/search/artist`의 HTML 카드 파싱.
  * **코이케 미나미(小池美波) 등 썸네일 누락 예외 대응**: 목록에 `<img>`가 없는 경우 개별 아티스트 상세 페이지(`https://sakurazaka46.com/s/s46/artist/{code}`)를 2차 크롤링하여 원본 HD 프로필 이미지(`1000_1000_102400.jpg`)를 가져오도록 폴백 작성.
* **사쿠라/히나타 졸업생 (`scripts/fetch/graduates.ts`):**
  * 히라테 유리나, 나가하마 네루, 스가이 유우카, 와타나베 리사, 코바야시 유이, 사이토 쿄코, 카게야마 유카, 카토 시호, 히가시무라 메이 등 공식 아카이브 이미지 URL과 소속사/개인 SNS를 직접 데이터화.

### 4.2 아바타 렌더링 및 이미지 로딩 안정화 (`MemberAvatar.tsx`)
* `<img referrerPolicy="no-referrer" loading="lazy" onError={...} />` 적용.
* 외부 CDN(사카미치 공식 서버 등)에서 이미지를 불러오다 네트워크 지연이나 에러 발생 시 `onError` 이벤트 핸들러가 작동하여 `GlyphAvatar` 컴포넌트로 자동 전환.
* `GlyphAvatar`는 멤버 성씨의 첫 글자(한자)와 고유 색상 쉬프트를 조합하여 깨진 엑박 아이콘 없이 일관된 UI를 유지함.

### 4.3 홈 화면 최신 블로그 갱신 피드 (`LatestUpdatesFeed.tsx`)
* **사카미치 피드 (30명)**와 **AKB48G 피드 (30명)**가 상하 2단으로 분리 구성.
* 마우스 좌우 드래그 및 터치 스와이프를 지원하도록 커스텀 포인터 이벤트 핸들러(`handlePointerDown`, `handlePointerMove`, `handlePointerUp`)가 내장됨.
* 각 카드 클릭 시 해당 멤버의 상세 페이지(`/m/[memberId]`) 또는 공식 원문 블로그로 이동.

### 4.4 그룹 상세 화면 탭 전환 (`GroupTabs.tsx`, `GroupView.tsx`)
* 탭 상태: `current`(현역 멤버), `graduated`(졸업 멤버), `byGen`(기수별 아카이브).
* 사용자가 그룹 상세 페이지 진입 시 기본값은 `current`로 렌더링됨.
* 기수 구분이 단일한 자매그룹의 경우 `byGen` 탭이 자동으로 비활성화되어 `current`와 `graduated` 2개 탭으로 단순화됨.

---

## 5. 🛠️ 명령어 및 개발 가이드

```bash
# 1. 의존성 설치
pnpm install

# 2. 데이터 크롤링 및 전체 멤버 데이터셋 갱신
pnpm data:fetch

# 3. 공식 블로그 최신 갱신 60개 피드 수집
pnpm exec tsx scripts/fetch/updates.ts

# 4. 데이터 스키마 및 관계 정합성 검증
pnpm data:validate

# 5. 로컬 개발 서버 실행 (http://localhost:3000)
pnpm dev

# 6. 타입 검사 및 프로덕션 빌드 (1,056개 정적 페이지 빌드)
pnpm typecheck
pnpm build

# 7. Vercel 프로덕션 배포
npx vercel --prod --yes
```

---

## 6. ⚠️ 작업 시 유의사항 및 향후 과제 (To-Do)

1. **사카미치 3사 크롤러 유지보수:**
   * 노기자카46의 6기생, 사쿠라자카46의 4기생, 히나타자카46의 5기생 등 신규 기수가 추가될 때 각 공식 사이트의 DOM 구조 변경 여부를 점검해야 합니다.
2. **48그룹 졸업생 사진 에셋:**
   * 현재 48그룹의 졸업생 중 일부는 외부 구형 CDN의 403 차단 방지를 위해 `GlyphAvatar`로 안전하게 폴백되어 있습니다. 향후 라이선스 검증된 고화질 오픈 아카이브나 소속사 고정 에셋으로 확장이 가능합니다.
3. **블로그 피드 정기 자동화:**
   * 현재 `scripts/fetch/updates.ts`는 수동 또는 배포 시 실행됩니다. GitHub Actions Workflow(크론 30분 주기)를 연결하여 자동 커밋 & 배포 트리거를 연동할 수 있습니다.
