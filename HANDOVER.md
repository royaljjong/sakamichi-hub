# 🌸 사카미치 허브 (Sakamichi Hub / 坂道シリーズ ポータル) 인수인계 및 기술 명세서

> **문서 버전:** 1.0.0  
> **최종 수정일:** 2026-08-16  
> **프로젝트 위치:** `C:\Users\royal\Desktop\programming\window\Sakamichi Box`  
> **GitHub 저장소:** [https://github.com/royaljjong/sakamichi-hub](https://github.com/royaljjong/sakamichi-hub)  
> **Vercel 프로덕션 URL:** [https://sakamichi-hub.vercel.app](https://sakamichi-hub.vercel.app)  

---

## 1. 📌 프로젝트 개요 및 배경

**사카미치 허브(Sakamichi Hub)**는 일본의 대표 3대 사카미치 그룹(**노기자카46, 사쿠라자카46, 히나타자카46**)의 모든 현역 및 졸업 멤버의 공식 블로그, SNS, 사진집, 미디어, 최신 갱신 피드를 한곳에서 탐색할 수 있는 **사카미치 시리즈 통합 공식 링크 & 아카이브 포털**입니다.

### 🌟 핵심 설계 원칙
1. **100% 검증된 공식 링크망**: 깨진 링크(404) 및 비공식 사칭 링크 0건 보장.
2. **사카미치 3사 고유 디자인 시스템**: 각 그룹의 공식 상징 컬러(노기자카 보라, 사쿠라자카 핑크, 히나타자카 하늘색)와 기수(Generation) 탭 완벽 반영.
3. **다국어(i18n) 3개 국어 지원**: 일본어(JA 기본), 한국어(KO), 영어(EN) 완전 현지화.
4. **WCAG 2.1 AA 접근성 및 다크 테마**: 심야 팬 활동을 고려한 눈이 편안한 글래스모피즘 UI.

---

## 2. 🗂️ 프로젝트 디렉터리 및 코드 구조

```
Sakamichi Box/
├── data/                               # 사카미치 데이터베이스 원천 파일
│   ├── groups.json                     # 3대 그룹 기본 정보 (노기/사쿠라/히나타 공식 링크 및 기수 정의)
│   ├── members.json                    # 130+명 전 멤버 상세 정보 (한자/가나/한글/로마자, 블로그, SNS)
│   ├── latest-updates.json             # 공식 블로그 실시간 최신 갱신 피드
│   ├── audit-report.json               # 데이터 정합성 검증 리포트
│   └── link-report.json                # 링크 200 OK 상태 검증 리포트
│
├── public/                             # 정적 에셋 및 파비콘
│   ├── images/
│   │   ├── groups/                     # 그룹별 공식 심볼/배너
│   │   └── members/                    # 멤버별 프로필 아바타
│   └── favicon.ico
│
├── scripts/                            # 데이터 크롤링, 검증 및 유틸리티
│   ├── fetch/
│   │   ├── nogizaka.ts                 # 노기자카46 공식 크롤러
│   │   ├── sakurazaka.ts               # 사쿠라자카46 공식 크롤러
│   │   ├── hinatazaka.ts               # 히나타자카46 공식 크롤러
│   │   └── all.ts                      # 전 그룹 통합 크롤러 진입점
│   ├── validate.ts                     # Zod 스키마 정합성 검사기
│   ├── check-links.ts                  # 링크 200 OK 헬스체크 스크립트
│   └── check-contrast.ts               # 컬러 명도 대비(AA) 검사기
│
├── src/
│   ├── app/
│   │   ├── [locale]/                   # next-intl 다국어 라우팅
│   │   │   ├── page.tsx                # 메인 홈 (3대 그룹 카드 + 최신 블로그 갱신 피드)
│   │   │   ├── layout.tsx              # 글로벌 레이아웃 (테마 프로바이더, 네비게이션, 푸터)
│   │   │   ├── about/page.tsx          # 서비스 소개 및 기획 의도
│   │   │   ├── search/page.tsx         # 통합 멤버/그룹 검색 페이지
│   │   │   ├── g/[groupId]/page.tsx    # 그룹 상세 (기수별 탭, 센터/캡틴 뱃지, 멤버 그리드)
│   │   │   └── m/[memberId]/page.tsx   # 멤버 상세 (공식 블로그, X, 인스타, 유튜브, SHOWROOM)
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── group/
│   │   │   ├── GroupCard.tsx           # 3대 그룹 메인 카드 (컬러바, 엠블럼, 기수 요약)
│   │   │   └── GroupHeader.tsx         # 그룹 상세 상단 커버 및 링크바
│   │   ├── member/
│   │   │   ├── MemberCard.tsx          # 멤버 카드 (이름, 기수, 담당 컬러, 펜라이트색)
│   │   │   └── MemberAvatar.tsx        # 담당 컬러 링 포함 아바타 컴포넌트
│   │   ├── generation/
│   │   │   └── GenerationTabs.tsx      # 🌟 기수별 필터 탭 (전체, 1기, 2기, 3기, 4기, 5기, 6기)
│   │   ├── home/
│   │   │   └── LatestUpdatesFeed.tsx   # 최신 공식 블로그 갱신 타임라인
│   │   ├── background/
│   │   │   └── StarfieldBackground.tsx # 은은한 배경 애니메이션
│   │   └── ui/
│   │       ├── Navigation.tsx          # 상단 네비게이션 & 언어 변경 드롭다운
│   │       └── Footer.tsx              # 하단 푸터
│   │
│   ├── design/
│   │   └── tokens.ts                   # 그룹별 컬러 토큰 (#7E2082, #F398B4, #7AC2DE)
│   ├── i18n/
│   │   ├── routing.ts                  # locales: ['ja', 'ko', 'en']
│   │   └── request.ts
│   └── lib/
│       ├── sakamichi.schema.ts         # Zod 기반 엄격한 타입 스키마
│       └── data.ts                     # 멤버/그룹 필터링 및 조회 헬퍼
│
├── messages/                           # 다국어 번역 사전
│   ├── ja.json
│   ├── ko.json
│   └── en.json
│
├── sakamichi-hub-work-order.md         # 프로젝트 원본 기획서 및 작업지시서
├── sakamichi.schema.ts                 # 루트 Zod 스키마 정의
├── package.json
└── tsconfig.json
```

---

## 3. 🌸 3대 사카미치 그룹 시스템 매핑

```
[1] 💜 乃木坂46 (Nogizaka46)
  ├─ 그룹 ID: nogizaka
  ├─ 메인 컬러: #7E2082 (보라) / 악센트: #9B309E
  ├─ 기수 분류: 3기생, 4기생, 5기생, 6기생(신오디션), 졸업생(OG 아카이브)
  └─ 공식 사이트: nogizaka46.com

[2] 🌸 櫻坂46 (Sakurazaka46)
  ├─ 그룹 ID: sakurazaka
  ├─ 메인 컬러: #F398B4 (사쿠라 핑크) / 악센트: #FFFFFF
  ├─ 기수 분류: 1기생(케야키자카 계승), 2기생, 3기생, 졸업생
  └─ 공식 사이트: sakurazaka46.com

[3] ☀️ 日向坂46 (Hinatazaka46)
  ├─ 그룹 ID: hinatazaka
  ├─ 메인 컬러: #7AC2DE (스카이블루) / 악센트: #8ED0E8
  ├─ 기수 분류: 1기생(히라가나 계승), 2기생, 3기생, 4기생, 졸업생
  └─ 공식 사이트: hinatazaka46.com
```

---

## 4. 💻 작업 및 실행 명령어 모음 (CLI Reference)

### 1) 프로젝트 의존성 설치
```powershell
cd "C:\Users\royal\Desktop\programming\window\Sakamichi Box"
pnpm install
```

### 2) 데이터 검증 및 크롤링 스크립트
```powershell
# Zod 데이터 스키마 정합성 검사
pnpm data:validate

# 공식 블로그 및 멤버 데이터 최신화 크롤링
pnpm data:fetch

# 공식 링크 200 OK 헬스체크
pnpm data:links

# 컬러 접근성 대비 검사
pnpm data:contrast
```

### 3) 로컬 개발 서버 실행
```powershell
pnpm dev
# 브라우저에서 http://localhost:3000 접속
```

### 4) 프로덕션 빌드 검증
```powershell
pnpm build
```

### 5) Git 커밋 & Vercel 프로덕션 배포
```powershell
git add .
git commit -m "feat: update sakamichi data"
git push origin main
npx vercel --prod --yes
```

---

## 5. 🔍 상태 점검 및 유지보수 가이드

| 항목 | 확인 방법 / 대상 파일 |
|:---|:---|
| **새로운 멤버(예: 6기생) 추가** | `data/members.json` 에 멤버 객체 추가 후 `pnpm data:validate` 실행 |
| **졸업 멤버 상태 변경** | `data/members.json` 의 해당 멤버 `status`를 `"graduated"` 로 변경 및 졸업일 기입 |
| **블로그 최신 글 수동 갱신** | `pnpm data:fetch` 실행 시 `data/latest-updates.json` 자동 갱신 |
| **기수 탭 추가/수정** | `src/components/generation/GenerationTabs.tsx` 및 `data/groups.json` 수정 |
| **다국어 번역 수정** | `messages/ja.json`, `messages/ko.json`, `messages/en.json` 수정 |

---

## 6. 🌐 라이브 확인 링크 모음

- **메인 홈페이지 (일본어):** [https://sakamichi-hub.vercel.app/ja](https://sakamichi-hub.vercel.app/ja)
- **메인 홈페이지 (한국어):** [https://sakamichi-hub.vercel.app/ko](https://sakamichi-hub.vercel.app/ko)
- **메인 홈페이지 (영어):** [https://sakamichi-hub.vercel.app/en](https://sakamichi-hub.vercel.app/en)
- **노기자카46 그룹 페이지:** [https://sakamichi-hub.vercel.app/ko/g/nogizaka](https://sakamichi-hub.vercel.app/ko/g/nogizaka)
- **사쿠라자카46 그룹 페이지:** [https://sakamichi-hub.vercel.app/ko/g/sakurazaka](https://sakamichi-hub.vercel.app/ko/g/sakurazaka)
- **히나타자카46 그룹 페이지:** [https://sakamichi-hub.vercel.app/ko/g/hinatazaka](https://sakamichi-hub.vercel.app/ko/g/hinatazaka)
