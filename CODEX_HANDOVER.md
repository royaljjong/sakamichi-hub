# Sakamichi Box — Codex 인수인계

기준일: 2026-08-24  
작업 브랜치: `main` (codex/trust-data-phase2와 항시 정합)  
프로덕션: https://sakamichi-hub.vercel.app

## 1. 제품 범위

Sakamichi Box는 지역 탐색 서비스가 아니다. 첫 화면에서 `사카미치 / AKB48 그룹`을 나누고, `계열 → 그룹 → 현재 멤버·연습생·졸업자 → 공식 SNS`로 탐색하는 다국어 비공식 디렉터리다.

**홈 구성 순서** (2026-08-24 기준):
1. 계열 게이트 (사카미치 / AKB48)
2. 그룹 카드 (선택 계열 소속 그룹 타일)
3. 이벤트 슬라이더 (사카미치 · AKB48G 각각)
4. 생일 슬라이더 (오늘 / 곧 / 지난 3버킷 세로 라벨)
5. YouTube 채널 레일 (사카미치 · AKB48G 각각)
6. YouTube 최신 영상 레일 (실 데이터 33건)
7. TikTok 채널 레일 (사카미치 · AKB48G 각각)
   - *TikTok 영상 레일은 데이터 소스 부재로 제거됨*

상단에 sticky 미니 내비 바 (계열·그룹·라이브·생일·YouTube·TikTok 앵커).

그룹 페이지 구성:
- GroupHeader (이름·로고·공식 SNS 필)
- GroupInsights (이벤트·최신 소식·생일 패널·랭킹)
- **GroupDiscography** (2026-08-24 신규: 4-col 그리드, 최신 12 싱글)
- GroupView (탭: 현역/연습생/졸업/기수별)
- **CareerTimeline** — 멤버 프로필 페이지 프로필 헤더 아래에 신규 (2026-08-24)

## 2. 현재 데이터

| 카테고리 | 수치 |
|---|---|
| 그룹 | 16 (로고 100% · 팔레트 100%) |
| 멤버 | **454명** (사카미치 3사 185 + AKB48G 269) |
| 활동 멤버 사진 커버 | 235 실사진 + 100 그룹 로고 폴백 = 100% 시각 |
| 이벤트 (portal) | **56건** (지난 이벤트 제외) |
| YouTube 링크 | 33명 (졸업생 포함) |
| TikTok 링크 | 19명 |
| 최신 영상 | 33건 (YouTube만) |
| 최신 블로그 | 60건 (사카미치 30 + AKB48G 30) |
| 디스코그래피 싱글 | **256곡** (9그룹 커버) |
| 랭킹 스냅숏 | 15 (수동 시드, 2026-08-22 기준) |

## 3. 완료된 구현 (2026-08-24 기준)

### 데이터 파이프라인
- 사카미치/AKB48G 첫 단계 분리 · 그룹별 동적 색상·움직이는 배경
- Wikipedia jawiki 명단 확장 (+154명, 299→453)
- SKE48 로스터 완전화 (11→56, 공식 사이트)
- NGT48 완전화 (8→34, 공식 사이트 프로필+상세페이지)
- HKT48 사진 자동화 Playwright 워크플로 (매주 월요일 09:15 JST)
- Wikipedia 인포박스 상세 확장 (height 212, bloodType 198)
- 그룹 공식 로고 16개 (jawiki + 수동 override)
- Yoshida Akari (NMB48 졸업생) 큐레이션 추가

### 이벤트/미디어
- 8개 그룹 이벤트 스크래핑 (노기·사쿠·히나·AKB·HKT·STU · NMB/NGT는 접근 불가)
- YouTube 채널 33 + 최신 영상 33건 파이프라인 (RSS + fallback)
- TikTok 채널 19 (영상 데이터 소스 부재로 채널만)
- 디스코그래피 데이터 파이프라인 (enwiki singles table 파싱, 3가지 template 지원)
- 블로그 자동 갱신 6시간 주기 (사카미치 3그룹 + AKB48 Ameblo RSS)

### UI/UX
- 그룹별 동적 팔레트 (color-mix + 그라디언트 배경)
- 홈 미니 내비 바 (sticky, IntersectionObserver active section)
- 검색 UX 완결 (프랜차이즈·상태·그룹 필터, URL 파라미터 영구화)
- **`/compare` 페이지** — 2-3그룹 side-by-side 통계 비교 (2026-08-24 신규)
- 생일 3버킷 (오늘/곧/지난) 세로 라벨 · 오늘 생일자 pin
- 멤버 사진 없을 시 그룹 로고 fallback (브랜드 톤 배경 + 88% 크기)
- Career Timeline (memberships + lineage 기반 이력 시각화)
- **404 커스텀 페이지** (Sakamichi 브랜딩 + 그룹 chip)
- `/credits` (CC BY-SA 4.0 + Wikipedia + Wikimedia 명시)
- `/privacy-policy` · `/terms` · `/contact` (AdSense 전제조건)

### SEO/성능
- Event Schema.org (그룹 페이지 최대 20 + 홈 최대 30 upcoming)
- MusicRelease Schema.org (그룹당 최신 5 싱글)
- Custom OG images (그룹/멤버 페이지, @vercel/og edge runtime)
- Vercel Analytics + **Speed Insights** (RUM 자동 계측)
- Sitemap.xml 자동 생성 (locale × 페이지 조합)
- 3언어 hreflang · canonical

### 광고 인프라
- **Google AdSense Publisher ID: `ca-pub-8422791508684989`** 활성화됨
- `ads.txt` 서빙 (`google.com, pub-8422791508684989, DIRECT, ...`)
- AdSense 검증 스크립트 + `<meta google-adsense-account>` 삽입
- `<AdSlot slot="..." />` 컴포넌트 (Placeholder일 때 no-op, env var 지원)
- Middleware fix: `/` → `/ja` **rewrite** (redirect 아님) → 크롤러가 root에서 스크립트 확인 가능
- **승인 상태: 대기 중** (ads.txt 통과, 콘텐츠·정책 심사 중)

### 데이터 정합 이슈 처리
- 확정 오염 30건 imageUrl null 처리 (NMB48 11 + STU48 16 로고 · AKB48 3명 중복 사진)
- 원본 데이터 URL 정리 완료
- audit-report는 2026-08-22 재실행분 (453명 기준, 뿌리 이미지 오판 포함)

### 인프라
- GitHub Actions: `daily-updates.yml` 6h 주기 (blogs · videos · events)
- GitHub Actions: `scrape-akb-images.yml` 주 1회 (Playwright)
- 데스크톱 매크로: `C:\Users\royal\Desktop\sakamichi-refresh.bat` (사용자 수동 트리거)

## 4. 자동 업데이트 매크로

예약 실행은 `main` 브랜치에서 정상화됨. GitHub Actions 스케줄로 안정 운영 중.
`git-auto-commit-action`이 `data/*.json` 변경 시만 커밋.

## 5. AdSense 승인 대기 후속

승인 완료 후 사용자가 알려주면:
1. Publisher ID는 코드에 기 반영 (환경변수는 옵션)
2. **자동 광고 활성화 권장**: AdSense 대시보드에서 "자동 광고" 켜면 코드 변경 없이 즉시 광고 게재
3. 또는 슬롯 ID 알려주면 `<AdSlot slot="..." />` 수동 배치 (홈 hero 아래, 그룹 GroupInsights 전후, 멤버 LinkGrid 아래 권장)

## 6. 불가능/봉쇄 항목 (환경적 제약)

| 항목 | 원인 |
|---|---|
| TikTok 실 영상 데이터 | 봇 차단 (RSSHub 403 · Playwright 감지) |
| Nitter X 게시물 | 무료 인스턴스 4개 전부 다운 |
| NMB48 사이트 접근 | TCP 연결 불가 (지역 또는 정책 차단) |
| NGT48 이벤트 | Google Calendar iframe만 존재 |
| SKE48 극장 스케줄 | 팬클럽 로그인 벽 |
| AKB48 공식 사이트 (SPA) | Ubuntu runner IP 차단 |
| AKB48/NMB48 개인 사진 100명 | SPA + 봇 차단, 그룹 로고 폴백으로 UX 대응 완료 |

## 7. 다음 실행 순서 (권장)

### 즉시 가능
- AKB48/NMB48/HKT48/NGT48 개별 멤버 상세 정보 (혈액형·신장·취미) 확장 — Wikipedia 女性アイドル 인포박스는 hobbies/specialties 필드 부재라 개별 문서에서 별도 파싱 필요
- 커스텀 도메인 연결 (`.vercel.app` 서브도메인 대비 SEO 유리)
- Search Console 연결 및 sitemap 제출

### 유료/인프라 필요
- TikTok 실 영상: tikapi.io (~$99/월) 또는 self-hosted RSSHub + 프록시
- X API Basic ($100/월): 실시간 팔로워 카운트 → 랭킹 자동 갱신
- Instagram Graph API: 공식 계정 최신 게시물

### UI/제품 확장
- 멤버 페이지 discography 표시 (참여 싱글 트랙 목록)
- 그룹 vs 그룹 비교 UI에 discography 지표 추가
- Dark mode
- 통계 대시보드 (연도별 데뷔 그래프, 멤버 수 추이)

각 멤버는 공식 프로필 URL, 표시 이름, 사진 URL, 상태, SNS, 확인일을 한 묶음으로 검증한다. 검색 결과 이미지나 이름 추정으로 교체하지 않는다.
