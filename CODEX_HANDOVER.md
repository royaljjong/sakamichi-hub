# Sakamichi Box — Codex 인수인계

기준일: 2026-08-31
확인 브랜치: `codex/trust-data-phase2`
프로덕션: https://sakamichi-hub.vercel.app

## 0. 현재 상태 — 다음 작업자는 여기부터 확인

### 완료된 로컬 구현·검증

- 2026-09-03 전체 정합성 복구: 이벤트 HTTP URL이 스키마와 Vercel 빌드를 깨뜨리던 문제를 수집기 경계와 현재 데이터에서 해결했다. 현재 검증값은 16그룹·454멤버·59이벤트·2장소·15 ranking facts·256싱글이다.
- 검색은 가나·초성·공백/하이픈 변형을 검증하고 결과 카드에 이름·별명·그룹명 일치 근거를 표시한다. 그룹 커버리지는 명시적 `rosterScope`와 클릭 가능한 공식 링크를 기준으로 보수적으로 판정한다.
- 2026-09-03 검증: `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm data:contrast`, `pnpm data:coverage`, `pnpm build` 통과. 1,538/1,538 경로.
- Vercel 프로덕션 배포 `dpl_8MJ991bx7a1mjfa8apn6VjddfBAx`는 `READY`이며 `https://sakamichi-hub.vercel.app`에 alias 됐다. 인증 curl HTML 응답은 확인했으나 로컬 브라우저 자동화가 무응답이라 시각·콘솔 검증은 남아 있다.

- 다국어 검색 줄기: 한자·가나·한글·로마자·별칭·성/이름 일부·3언어 그룹명 검색 검증 통과.
- 홈 성능: 클라이언트에 전달하는 멤버 데이터를 실제 사용 필드로 축소했다. 생성 `/ko` HTML은 운영 기준 1,117,167바이트에서 로컬 빌드 534,256바이트로 약 52.2% 감소했다.
- LIVE/TikTok 시각 상태: LIVE 포스터 누락·로드 실패는 72px 그룹 로고 영역으로 전환되고 로고 자체 실패 시 그룹 워드마크를 표시한다. TikTok 멤버 원형 이미지는 그룹 로고 fallback을 사용한다.
- 문의 최종 UX: 회원가입·로그인·자동 문의번호가 아닌 `사용자가 정하는 임시 아이디 + 비밀번호` 방식이다. 동일 조합의 자기 문의 목록만 최대 50건 조회한다.
- 문의 탭 접근성: 등록/조회 탭은 ARIA 선택·패널 관계와 좌우 방향키·Home·End 이동을 지원하며, `ko`·`ja`·`en` 로컬 브라우저 검증을 통과했다.
- 문의 DB 보완: 테이블과 RPC의 직접 공개 권한을 회수하고 service-role 전용 RPC, SHA-256 ID 해시, bcrypt 비밀번호 해시, 입력 제한, transaction advisory lock, ID당 50건 상한을 migration으로 적용했다.
- 검증: `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm build` 통과. 서버 API 포함 1,538개 경로, 홈 First Load JS 177KB, 문의 175KB.
- 문서 정합성: `README.md` 빌드 수치는 1,538개 경로, 역사 참고 `HANDOVER.md`의 현재 이벤트 수는 44개로 최신 검증값과 동기화했다.
- 문서 권위·보안 계약 정합화: `PRODUCT_RMVP_PLAN.md`의 문의 권한을 공개 역할 직접 실행 금지·Vercel 서버 API·service-role 전용 RPC로 통일했다. 역사 `HANDOVER.md`의 1,536페이지는 당시 검증값으로 구분했고, 폐기 `sakamichi-hub-work-order.md`의 탈출 링크를 현행 제품 기획·작업지시·운영 인수인계 순서로 정렬했다.
- 무료 운영 경계: Vercel Hobby를 유지하고 유료 Firewall 확장은 하지 않는다. 새 영속 저장이 실제로 필요할 때만 두 번째 조직의 기존 `sakamichi-box` Supabase 프로젝트를 사용하며, 이번 실행에서는 DB·프로젝트·운영 데이터를 변경하지 않았다.
- 스크린샷 UI 보완: 홈 그룹 카드는 grid cell 전체를 채우며, LIVE fallback 로고는 72px 식별 영역으로 확대됐다. 원격 로고 실패 시 깨진 이미지 대신 그룹 워드마크를 표시한다. 데스크톱 카드 폭·LIVE 식별 영역과 세 언어 390px 모바일 overflow 검증을 통과했다.
- 데이터 신뢰 자동화: `pnpm data:coverage`가 `data/coverage-report.json`을 만들고, `pnpm data:links`는 기본 report-only로 777개 링크를 OK 642·redirected 33·dead 67·unverified 35로 분류했다. 링크 검사 전후 `members.json` 해시는 동일했다.

### 외부 연결 완료 범위와 안전 게이트

- 두 번째 조직 `seceond Organization`에 전용 `sakamichi-box` 프로젝트(ref `pdfxiubzwaudqebbgyrg`)를 서울 `ap-northeast-2`로 생성하고 저장소를 연결했다. 기존 Kurashi·smarttube 프로젝트는 변경하지 않았다.
- 세 inquiry migration을 실DB에 적용했고 로컬·원격 이력이 일치한다. 마지막 migration은 `anon`·`authenticated`의 RPC 실행 권한을 회수하고 `service_role`만 허용한다.
- 브라우저는 Supabase를 직접 호출하지 않고 `/api/inquiries/create`, `/api/inquiries/read`만 호출한다. Node 서버 API는 server-only secret으로 RPC를 실행한다.
- pgTAP 12개, publishable 직접 RPC 401, 운영 API create 201·read 1건·잘못된 비밀번호 빈 결과를 확인했다. 테스트 문의는 제거했고 현재 문의는 0건이다. Performance advisor는 깨끗하며 Security advisor INFO 1건은 공개 policy가 없는 의도된 서버 전용 RLS 상태다.
- Vercel Production에는 server-only SUPABASE_URL·SUPABASE_SECRET_KEY와 PRIVATE_INQUIRY_ENABLED=true, NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED=true가 등록됐다. DB 비밀번호는 등록하지 않았다.
- 운영 문의는 활성화됐다. 브라우저는 Vercel API만 호출하고 create/read 합산 IP당 30회/60초 초과 시 429를 반환한다.

### 운영 모니터링 순서

1. Production log 규칙 2개는 publish·트래픽 확인을 마쳤다.
2. Preview 공용 IP 규칙(두 exact POST 경로 합산 30회/60초)은 publish 및 429 검증을 마쳤다.
3. Preview+Production rate-limit publish 및 Production 429·정상 복귀 검증을 마쳤다.
4. 활성화 배포와 smoke·테스트 행 삭제까지 완료했다. 이후 실제 문의와 Firewall 429·5xx·Advisor를 정기 관찰한다.

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
- GroupInsights (이벤트·최신 소식·생일 패널, 연결되지 않은 랭킹 UI는 제거)
- **GroupDiscography** (2026-08-24 신규: 4-col 그리드, 최신 12 싱글)
- GroupView (탭: 현역/연습생/졸업/기수별)
- **CareerTimeline** — 멤버 프로필 페이지 프로필 헤더 아래에 신규 (2026-08-24)

## 2. 현재 데이터

| 카테고리 | 수치 |
|---|---|
| 그룹 | 16 (로고 100% · 팔레트 100%) |
| 멤버 | **454명** (사카미치 3사 185 + AKB48G 269) |
| 활동 멤버 사진 커버 | 235 실사진 + 100 그룹 로고 폴백 = 100% 시각 |
| 이벤트 (portal) | **59건** (2026-09-03 `data:validate` 기준) |
| YouTube 링크 | 131명 (any link of type=youtube, 졸업생 포함)[^1] |
| TikTok 링크 | 118명[^1] |
| 최신 영상 | 34건 (YouTube만) |
| 최신 블로그 | 60건 (사카미치 30 + AKB48G 30) |
| 디스코그래피 싱글 | **256곡** (9그룹 커버) |
| 랭킹 스냅숏 | 15 (화면 미노출의 보존 데이터, 자동 갱신 전 사용 금지) |

[^1]: 계산 근거: `data/members.json`에서 `links[].type === 'youtube' | 'tiktok'`인 링크 엔트리를 가진 멤버 수. 개인 채널만 세는 것이 아니라 그룹 공식 채널 링크 포함 모든 항목. 재확인 명령: `node -e "const m=require('./data/members.json'); console.log(m.filter(x=>x.links&&x.links.some(l=>l.type==='youtube')).length)"` (tiktok 동일 패턴). 감사 기준 2026-09-04.

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
- **승인 상태: 승인 완료·광고 게재 중** (2026-08-25 사용자 확인)

### 데이터 정합 이슈 처리
- 확정 오염 30건 imageUrl null 처리 (NMB48 11 + STU48 16 로고 · AKB48 3명 중복 사진)
- 원본 데이터 URL 정리 완료
- audit-report는 2026-08-25에 454명 기준으로 재생성. 실행 환경에서 외부 이미지 348건이 status 0이므로 URL 경고를 이미지 오염 판정에 사용하지 않는다.
- 2026-09-03 공식 프로필 재감사에서 AKB48·SKE48·HKT48·NGT48의 현재 명단과 상세 페이지를 이름 정확 일치로 병합했다. 생일 44건·사진 18건을 포함해 152명 필드를 보강했고, 정리 후 재실행 변경 0건을 확인했다.
- 전체 현황과 공식 명단 불일치 목록은 `data/profile-audit-report.json`이 기준이다. Instagram 등 개인 SNS는 공식 상세 페이지에 링크가 없으면 누락이 아니라 미확인/미개설로 취급한다.
- 보강 데이터는 Vercel 프로덕션 배포 `dpl_6hsWpH5fyg7vWwtqNoBNyQGV5vuc`에서 1,538/1,538 경로 빌드 후 `READY`로 반영됐다.
- rMVP·데이터 정합성·문의 보안·운영 문서의 기준 커밋은 `8c5fef7`(`feat: complete rMVP data integrity refresh`)이다. 이후 인수인계 결과 기록은 별도 문서 마감 커밋으로 이어진다.
- 인수인계 마감 커밋은 `bdb6185`이며 원격 `codex/trust-data-phase2`에 푸시됐다. 최종 프로덕션 배포는 `dpl_6ZBjQGYLUkycoTgv9Fk9gN6zXL2C`이고 1,538/1,538 경로 생성 후 `READY` 상태다.

### 인프라
- GitHub Actions: `daily-updates.yml` 6h 주기 (blogs · videos · events)
- GitHub Actions: `scrape-akb-images.yml` 주 1회 (Playwright)
- 데스크톱 매크로: `C:\Users\royal\OneDrive\Desktop\Sakamichi Box 업데이트.bat` (사용자 수동 트리거, `--check` 지원). 공식 프로필 → 검색 인덱스 → 피드 → 전체 데이터 검증 순서로 실행한다.

## 4. 자동 업데이트 매크로

예약 실행은 `main` 브랜치에서 정상화됨. GitHub Actions 스케줄로 안정 운영 중.
`git-auto-commit-action`이 `data/*.json` 변경 시만 커밋.

## 5. AdSense 승인 후 운영

1. Publisher ID와 `ads.txt`는 운영 값으로 반영되어 있다.
2. 자동 광고가 실제 게재 중이므로 배치 변경 전 콘텐츠 가림, 누적 레이아웃 이동(CLS), 모바일 오클릭 위험을 확인한다.
3. 수동 슬롯은 슬롯 ID와 배치 목적이 확정될 때만 `<AdSlot slot="..." />`로 추가한다.
4. AdSense 관리 화면의 유럽 규정 동의 메시지/CMP, 광고 차단 복구 메시지, 정책 센터 경고를 정기 확인한다. 저장소만으로 해당 대시보드 상태를 완료로 단정하지 않는다.

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
| NMB48 프로필 재감사 | 현재 환경에서 공식 사이트 TCP 연결 시간 초과 |
| STU48 프로필 재감사 | 확인한 공식 프로필 목록 경로가 404이며 현재 목록 URL 미확정 |

## 7. 다음 실행 순서 (권장)

### 문의 활성화 완료 후 운영

- 전용 Supabase 프로젝트, service-role 전용 서버 API, Vercel server-only 변수 연결은 완료됐다.
- Production 문의가 활성화됐고 Preview·Production 공유 IP rate-limit 검증도 완료됐다. 실제 문의 원문과 비밀번호는 문서·로그에 남기지 않는다.
- 기존 Kurashi·smarttube 프로젝트에는 사용자 명시 승인 없이 상태 변경을 하지 않는다.

### rMVP 1차 완료 (2026-08-25)

- 제품 줄기와 가지: `PRODUCT_RMVP_PLAN.md`
- 한자·가나·한글·초성·로마자·별명·성/이름 일부·3언어 그룹명 통합 검색
- 멤버 본문·메타데이터·Person JSON-LD의 대체 이름을 단일 유틸리티로 통일
- 그룹 페이지 데이터 커버리지와 `complete / partial / collecting`, 마지막 확인일 표시
- 해외 소수 수록 그룹에 대표 멤버만 수록한다는 안내 추가
- 데이터가 연결되지 않던 그룹 랭킹과 수동 스냅숏 기반 비교 페이지 TOP 3 제거
- 홈 이벤트·생일·YouTube·TikTok 레일을 선택 계열 중심으로 축약
- Panel/Card/Tile 표면 토큰과 모바일 배경 효과 강도 정리

### 다음 작업자의 문서 읽기 순서

1. 제품 목적·정책·비범위는 `PRODUCT_RMVP_PLAN.md`를 우선한다.
2. 변경 설계·실행 결과·검증 이력은 `WORK_ORDER_RMVP_2026-08-25.md`를 확인한다.
3. 현재 운영 상태·안전 게이트·다음 실행 순서는 이 `CODEX_HANDOVER.md`를 따른다.
4. `AUDIT_AND_REBUILD_PLAN.md`, `HANDOVER.md`, `PLAN_REPORT_2026-08-23_rev1.md`, `sakamichi-hub-work-order.md`는 역사 참고이며 현행 실행 계약으로 사용하지 않는다.

### 다음 무료 로컬 실행

1. `pnpm data:profiles`로 공식 프로필 변경을 먼저 미리보고, 근거와 명단 불일치를 확인한 뒤에만 `pnpm data:profiles:write`를 실행한다.
2. NMB48·STU48은 공식 현재 명단 페이지의 접근 가능한 URL이 확인된 뒤 수집기를 확장한다. 현재 활동 멤버 기준 NMB48 사진 34·프로필 36, STU48 사진 29·프로필 27이 남아 있다.
3. `pnpm data:links`의 dead 항목은 404·410을 개별 출처와 대조한 뒤에만 데이터 상태를 바꾼다. unverified 항목은 네트워크·봇 차단 가능성이므로 삭제 근거로 사용하지 않는다.
4. 데이터 변경 후 `pnpm data:validate`, `pnpm search:build`, `pnpm search:verify`, `pnpm data:coverage`, `pnpm build`를 다시 실행하고 보고서 수치를 동기화한다.
5. 홈 카드·LIVE fallback 변경은 배포 전 데스크톱과 390px 세 언어 뷰포트에서 재검증한다.

### 무료 운영 관찰

- Vercel Hobby와 현재 단일 Firewall rate-limit 규칙을 유지한다. 문의 API 429·5xx, 실제 문의량, Supabase Advisor를 관찰하되 정상 상태에서는 schema나 규칙을 늘리지 않는다.
- GitHub Actions의 6시간 데이터 갱신과 주간 이미지 갱신은 최근 실행 상태를 읽기 전용 확인한다. 이번 로컬 실행에서는 sandbox 네트워크 차단으로 원격 run 상태를 확인하지 못했다.
- 실제 AdSense auto-ad가 주입된 모바일 기기에서 내비게이션·검색·카드 클릭 영역 충돌을 관찰한다. headless 통과를 실광고 통과로 간주하지 않는다.

### 승인 필요 — 자동 진행 금지

- Vercel 배포·환경 변수·Firewall 변경, Supabase schema·운영 데이터 변경, AdSense/CMP 관리 화면, Search Console, 커스텀 도메인, workflow dispatch.
- 유료 Vercel 요금제와 유료 Firewall 확장은 제품 경계에서 제외한다. 새 저장이 실제로 필요하면 두 번째 조직의 기존 `sakamichi-box` 프로젝트를 우선 검토하고 다른 Supabase 프로젝트는 변경하지 않는다.
- TikTok/X/Instagram 유료 API 또는 별도 프록시 인프라는 명시 승인과 비용 결정 전 도입하지 않는다.

### 선택적 후속 제품 가지 — rMVP 비차단

- 멤버별 검증된 discography 참여 트랙, 그룹 비교 지표, 통계 대시보드, 의미 기반 토큰 정리 후 dark mode.

각 멤버는 공식 프로필 URL, 표시 이름, 사진 URL, 상태, SNS, 확인일을 한 묶음으로 검증한다. 검색 결과 이미지나 이름 추정으로 교체하지 않는다.
