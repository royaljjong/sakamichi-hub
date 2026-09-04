# Sakamichi Box · 기획 검토 및 로드맵

> **역사 스냅숏**: 이 문서는 2026-08-23의 커밋 `5a84302`를 대상으로 한 당시 진단입니다. 현재 상태·우선순위·완료 여부는 `PRODUCT_RMVP_PLAN.md`, `WORK_ORDER_RMVP_2026-08-25.md`, `CODEX_HANDOVER.md`를 우선합니다. 아래의 453명·56이벤트 및 미착수 표시는 현행 수치나 실행 지시가 아닙니다.

**작성일**: 2026-08-23  
**작성자**: Claude Opus 4.7 (기획·검토)  
**대상 커밋**: `5a84302` (main + codex/trust-data-phase2 정합)

---

## 1. 현재 상태 종합

### 1.1 데이터 완성도

| 카테고리 | 값 | 상태 |
|---|---|---|
| 멤버 | 453 (16그룹) | ✅ Wikipedia + 공식 스크래핑으로 확장 완료 |
| 사진 (Active) | 235 (70%) + 100 그룹 로고 폴백 | ✅ 시각적 완결 |
| 그룹 로고 | 16/16 (100%) | ✅ 완결 |
| 이벤트 | 56 (2개 그룹 미커버) | ⚠️ NMB48/NGT48 불가 |
| 최신 블로그 | 60 (사카미치 30 + AKB 30) | ✅ 6시간 주기 자동 |
| YouTube 영상 | 33 | ⚠️ 채널 33개 대비 낮음 |
| TikTok 영상 | 0 | ❌ 봇 차단 |
| 랭킹 | 15 (수동 시드) | ⚠️ 자동 갱신 없음 |
| Instagram 링크 | 150 (실 게시물 X) | ⚠️ 링크만 |
| X 링크 | 133 (실 게시물 X) | ⚠️ Nitter 다운 |

### 1.2 인프라

| 항목 | 상태 |
|---|---|
| GitHub Actions (blog+videos+events) | ✅ 6시간 주기, 최근 5회 success |
| GitHub Actions (Playwright HKT48 이미지) | ✅ 주 1회 (월요일 09:15 JST) |
| Vercel Production 자동 배포 | ✅ main push 즉시 |
| 데스크톱 갱신 매크로 | ✅ `C:\Users\royal\Desktop\sakamichi-refresh.bat` |
| typecheck / data:validate | ✅ 통과 |

### 1.3 UI/UX 현황

| 페이지 | 완성도 |
|---|---|
| 홈 | 15+ 섹션 (hero·gates·tiles·events×2·birthdays×2·yt×4·tt×4) — **길이 우려** |
| 그룹 상세 | 탭 (현역/졸업/기수별) + 이벤트 + 최신 소식 + 생일 + 랭킹 |
| 멤버 상세 | 프로필 + 링크 그리드 + 동기 멤버 |
| 검색 | 필터(프랜차이즈·상태·그룹) + URL 영구화 |
| About | 저작권·비공식 선언 (3언어) |

---

## 2. Gap 분석

### 2.1 봉쇄된 항목 (환경적 제약, 이번 세션 불가)

| 항목 | 원인 |
|---|---|
| TikTok 실 영상 데이터 | 봇 차단 (RSSHub 403, Playwright 렌더링 회피됨) |
| Nitter X 게시물 | 무료 인스턴스 4개 전부 다운/차단 |
| AKB48 공식 사이트 접근 | 지역·데이터센터 IP 차단 (로컬·CI 모두) |
| NMB48 사이트 (모든 도메인) | 서버 TCP 연결 불가 |
| NGT48 스케줄 | Google Calendar iframe 렌더링 (server HTML 없음) |
| SKE48 스케줄 | Fan-club 로그인 벽 |
| AKB48/NMB48 100명 개인 사진 | SPA + 봇 차단, 그룹 로고 폴백으로 시각 해결 |

### 2.2 미착수 항목 (진행 가능)

| 항목 | 예상 노력 | 예상 효과 |
|---|---|---|
| Wikipedia 멤버 상세 필드 (혈액형·신장·취미·데뷔일) | 중 | 프로필 페이지 풍성함 |
| Instagram 공식 API/스크래핑 | 상 (허가 필요) | 실시간 게시물 rail |
| 디스코그래피 (싱글·앨범) 데이터 | 상 | 새 콘텐츠 타입 |
| 랭킹 자동 갱신 (X follower API) | 상 (유료) | 실시간 인기 지표 |
| 멤버 타임라인 (경력 milestone) | 중 | 스토리텔링 |
| 그룹 비교 페이지 (side-by-side) | 중 | 탐색 UX |
| 통계 대시보드 (연도별 멤버수 등) | 소 | 분석적 매력 |

### 2.3 UX 리스크

| 이슈 | 심각도 |
|---|---|
| 홈 페이지 15+ 섹션 · 스크롤 매우 김 | 중 (섹션 앵커 필요) |
| 모바일 UX 종합 검증 없음 | 중 (Lighthouse Mobile 미실행) |
| 사이트 전체 성능 감사 없음 | 중 (LCP·CLS·INP 미측정) |
| Dark mode 부재 | 소 (선호 사용자 소수) |
| Wikipedia CC BY-SA 4.0 명시 attribution 부족 | **높음 (법적)** |
| 검색 오타 관대함 부족 (fuzzy match 없음) | 소 |

### 2.4 문서·운영 gap

| 항목 | 상태 |
|---|---|
| HANDOVER.md | ✅ 부분 갱신 (299→453 반영) |
| CODEX_HANDOVER.md | ⚠️ 2026-08-21 시점, 대량 진행 후 stale |
| README.md | ✅ 배너 있음 |
| 컴포넌트 테스트 | ❌ 0% |
| E2E 테스트 | ❌ 0% |
| Sitemap 검색엔진 등록 | ❌ Search Console 미연결 |
| Google Analytics | ⚠️ Vercel Analytics만 |
| OG 이미지 커스텀 | ❌ 그룹 색만 |

---

## 3. 우선순위별 로드맵

### 🔴 P0 · 즉시 (다음 세션)

> 이 로드맵의 홈 미니 내비, 인수인계 갱신, 상세 데이터, 구조화 데이터, OG 이미지, 404, 디스코그래피, 타임라인, 그룹 비교는 후속 실행에서 완료됐습니다. 최신 완료 근거는 `CODEX_HANDOVER.md` §3·§7을 따릅니다.

1. ~~**Wikipedia CC BY-SA 4.0 attribution 페이지**~~ — `/[locale]/credits`와 Terms/About 연결로 구현 완료 확인 (2026-08-25)
2. **홈 페이지 미니 네비 바** — 15+ 섹션 앵커 링크. sticky top or side rail
3. **CODEX_HANDOVER 갱신** — 이번 세션 결과 반영 (453명, 56이벤트, 그룹 로고 등)

### 🟡 P1 · 단기 (한두 세션 이내)

4. **Lighthouse 감사 및 성능 픽스** — Vercel Speed Insights 활용
5. **멤버 페이지 Wikipedia 상세 데이터 확장** — 혈액형/신장/취미 자동 수집
6. **Event Schema.org 마크업** — 검색엔진 rich snippet
7. **OG 이미지 커스텀 생성** — 각 멤버·그룹 페이지에 맞는 이미지
8. **404·에러 페이지 개선** — 커스텀 404 with 인기 링크 제안

### 🟢 P2 · 중기 (여러 세션)

9. **디스코그래피 데이터 파이프라인** — 각 그룹 싱글·앨범 JSON + 페이지
10. **멤버 타임라인 컴포넌트** — 가입·졸업·주요 이벤트 시각화
11. **그룹 비교 페이지** — 2-3 그룹 side-by-side (멤버수·데뷔일·팔로워)
12. **Instagram 공식 rail** — Meta Graph API 신청 후 진행
13. **랭킹 시스템 자동화** — X API Basic ($100/월) 또는 대안

### 🔵 P3 · 장기 (여유 시 진행)

14. **Dark mode**
15. **Search 오타 관대성 (Fuse.js)** 
16. **컴포넌트 테스트 도입** (Vitest + Testing Library)
17. **E2E (Playwright test)**
18. **통계 대시보드** (연도별 멤버 수, 데뷔 그래프 등)
19. **랜덤 멤버 버튼 (discovery)**

### ⛔ 봉쇄 (대안 필요)

- TikTok 영상 — 유료 API 또는 self-hosted Nitter/RSSHub with 프록시
- NMB48 이벤트 — VPN·프록시 인프라
- NGT48 이벤트 — 서드파티 API 또는 Google Calendar 임베드
- AKB48/NMB48 100명 사진 — 사용자 로컬 실행 or 유료 접근

---

## 4. 최종 결과 요약 (오늘 세션 성과)

### 4.1 커밋 히스토리 (오늘)
```
5a84302  Merge codex: restore HKT48/STU48 events scraper
9e1f44d  fix(events): restore HKT48/STU48/NMB48/NGT48 scraper
97ae349  feat(events): HKT48 + STU48 schedule scraping (+27)
85f86ec  feat: AKB48 theater schedule scraping (+16) + TikTok framework
02c2a75  feat: desktop refresh macro + sakura/hina event scraping
36c42f4  chore: doc drift + audit refresh + group-account UX badge
0048225  Merge codex: group logo avatar fallback
```

### 4.2 데이터 증가 (세션 초기 대비)

| 항목 | 세션 시작 | 세션 종료 | Δ |
|---|---|---|---|
| 멤버 | 299 | **453** | +154 |
| 활동 멤버 사진 | 148 | 235 + 100 로고 폴백 | +100% 시각 커버 |
| 그룹 로고 | 0 | 16 | +16 |
| 이벤트 | 3 | **56** | +53 (18x) |
| YouTube 링크 | 9 | 33 | +24 |
| TikTok 링크 | 0 | 19 | +19 |
| 최신 영상 | 0 | 33 | +33 |
| 랭킹 | 0 | 15 | +15 |
| Vercel 프로덕션 배포 | — | 6+ 회 | 안정 |

### 4.3 인프라 신설

- ✅ `daily-updates.yml` (6시간 주기, blog+videos+events)
- ✅ `scrape-akb-images.yml` (주 1회, Playwright)
- ✅ 데스크톱 매크로 `sakamichi-refresh.bat`
- ✅ Wikipedia jawiki API 통합 (pageimages·extlinks·wikitext)
- ✅ Ameblo RSS 통합
- ✅ TikTok fetch framework (데이터 확보 대기)

### 4.4 코드베이스 규모

- 신규 스크립트: 8+ (fetch/videos, fetch/akb-images, expand-\*, patch-\*, seed-\*, health-check, etc)
- 신규 컴포넌트: FilterChipBar, YouTube/TikTok 홈 섹션, 생일 버킷 라벨
- 신규 스키마: MemberVideo, updates-schema, Group.logoUrl
- i18n 키 신규: 40+

---

## 5. 권고

**다음 세션 최우선 3가지**:
1. AdSense 승인 후 CMP·정책 센터·모바일 광고 배치 점검 (관리 화면 확인 필요)
2. 홈 페이지 미니 네비 바 (UX)
3. Lighthouse 감사 + 성능 픽스 (품질)

**중장기 방향 결정 필요**:
- Instagram/X 실시간 데이터: 유료 API 예산 확보 여부?
- TikTok 데이터: self-hosted 인프라 구축 vs 포기?
- 디스코그래피 등 새 콘텐츠 타입 확장 여부?

---

*문서 끝. 후속 세션에서 P0·P1 항목 우선 검토 권장.*
