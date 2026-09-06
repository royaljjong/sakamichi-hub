# Sakamichi Box — 전면 정합성 감사 보고서

- 기준일: 2026-09-04
- 감사 범위: 현행 3문서(`PRODUCT_RMVP_PLAN.md`, `WORK_ORDER_RMVP_2026-08-25.md`, `CODEX_HANDOVER.md`) × 실제 코드(`src/`, `scripts/`, `supabase/`) × 데이터(`data/*.json`) × 사용자 시나리오(홈 → 계열 → 그룹 → 멤버 → 공식 SNS + 검색 + 문의)
- 감사자 역할: Opus (설계·검토). 코딩 수정은 이 보고서의 승인을 받아 Sonnet에 위임.
- 결과물 정책: 채팅 요약 대신 이 파일 (`AUDIT_REPORT_<date>_revN.md`) 에 기록 (feedback_audit_report_delivery 정책).

---

## 요약

- **P0 (즉시 수정, 프로덕션 사용자 영향)**: 1건 — 영문 검색 결과 매칭 배지 i18n 키 누락.
- **P1 (다음 실행에서 수정)**: 2건 — 인수인계 문서 수치 불일치, 멤버 페이지 링크 카운트 오도.
- **P2 (관찰·계획)**: 3건 — 루트 스키마 파일 stale, 미사용 RankingPanel, 프랜차이즈 이중 진실.
- **P3 (참고·후속)**: 3건 — dev 페이지 프로덕션 노출, lint 경고, Supabase Authorization 헤더 방어적 추가.

전반 판정: **rMVP 큰 줄기(다국어 발견·데이터 신뢰·문의 보안)는 문서 계약대로 구현되어 있음.** 남은 이슈는 개별 정합성 조정이며 큰 재설계는 불필요.

---

## P0 · 즉시 수정

### P0-1 · `en.json`에 `search.match.*` 키 3개 누락 — 영문 검색 결과 매칭 배지 실패

- 파일: `messages/en.json`
- 증상: `SearchResults.tsx:94` 에서 `t(\`match.${match.kind}\`, { term })` 호출이 `en` 로케일에서 키를 찾지 못해 next-intl 경고 또는 fallback 문자열이 렌더링됨. `ja.json`, `ko.json`은 `search.match.name/alias/group` 세 키를 정상 보유.
- 데이터 확인:
  - `ja.search.match = { name, alias, group }` ✓
  - `ko.search.match = { name, alias, group }` ✓
  - `en.search.match = undefined` ✗
- 영향: 영문 사용자가 이름·별칭·그룹명 중 어떤 근거로 매칭됐는지 확인 불가. rMVP `PRODUCT_RMVP_PLAN.md` §11 "검색 결과에는 사용자 질의가 어느 이름·별칭·그룹명과 일치했는지 설명 가능한 근거를 제공한다" 목표 위반.
- 수정 지시: `messages/en.json` 의 `search` 오브젝트에 다음 추가.

  ```json
  "match": {
    "name": "Name match: {term}",
    "alias": "Alias match: {term}",
    "group": "Group name match: {term}"
  }
  ```

- 검증: `pnpm build` 통과 후 `/en/search?q=Endo` 응답 HTML에 "Name match: Endo Sakura" 렌더링 확인.

---

## P1 · 다음 실행에서 수정

### P1-1 · `CODEX_HANDOVER.md` §2 YouTube/TikTok 수치가 실측과 크게 다름

- 파일: `CODEX_HANDOVER.md` (§2 "현재 데이터" 표)
- 문서 값 vs 실측 (2026-09-04 `data/members.json` 스캔):
  | 항목 | 문서 값 | 실측 |
  |---|---|---|
  | YouTube 링크 | 33명 (졸업생 포함) | **131명** |
  | TikTok 링크 | 19명 | **118명** |
  | 최신 영상 | 34건 | 34 ✓ |
  | 최신 블로그 | 60건 | 60 ✓ |
  | 그룹 | 16 | 16 ✓ |
  | 멤버 | 454명 | 454 ✓ |
  | 이벤트 | 59건 | 59 ✓ |
  | 디스코그래피 싱글 | 256곡 | 256 ✓ |
  | 랭킹 스냅숏 | 15 | 15 ✓ |

- 원인 추정: YouTube/TikTok 문서 수치는 초기 데이터셋 기준으로 보이며 이후 공식 프로필 재감사(2026-09-03 §12)와 링크 정규화에서 132·118로 확장됐음에도 표만 미갱신.
- 영향: 다음 작업자가 링크 커버리지를 실제보다 낮게 오인. `CODEX_HANDOVER.md`는 "다음 작업자가 여기부터 확인"하는 진입점 문서이므로 신뢰 저하 위험.
- 수정 지시: §2 표의 두 행을 실측 (YouTube 131, TikTok 118) 로 갱신하고, 근거 커맨드를 각주로 `node -e "…filter(m=>m.links.some(l=>l.type==='youtube'))…"` 형태로 남긴다. 다른 수치는 변경 금지.
- 참고: `data/coverage-report.json`에도 그룹별 링크 카운트가 있으므로 그쪽 값을 재사용해도 됨.

### P1-2 · 멤버 페이지 링크 카운트가 unverified 포함 값을 표시 (렌더링과 불일치)

- 파일: `src/app/[locale]/m/[memberId]/page.tsx:299`
- 현재: `{t('linksCount', { count: member.links.length })}`
- 문제: `LinkGrid` 는 `renderableLinks(links)` (unverified 제외) 필터 결과만 렌더링하지만, 헤딩에 표시되는 카운트는 필터 이전 전체 링크 수. `sakamichi.schema.ts` 주석 "unverified 는 여기서 전부 탈락한다. AI가 지어낸 URL이 사용자에게 노출되지 않는 마지막 방어선" 원칙과 표시 계약 불일치.
- 수정 지시: `member.links.length` → `renderableLinks(member.links).length` 로 교체. `renderableLinks` 는 이미 `import from '@/lib/schema'` 통해 사용 가능.
- 검증: 표시 카운트가 실제 렌더링된 카드 수와 일치하는지 임의의 멤버 페이지 정적 HTML로 확인.

---

## P2 · 관찰·계획

### P2-1 · 루트 `sakamichi.schema.ts` 파일이 `src/lib/schema.ts` 대비 stale (import되지 않는 dead file)

- 파일: `sakamichi.schema.ts` (프로젝트 루트, 482줄)
- 사용처: 어떤 소스 파일도 이 파일을 import하지 않음 (`src/lib/schema.ts` 만 활성).
- 하지만 파일 헤더가 "**이 파일이 이 프로젝트의 '계약서'다**" 라고 선언하고 있어, 저장소 초심자가 진짜 계약으로 오인할 위험.
- 실제 계약(`src/lib/schema.ts`) 과의 drift:
  - Group에 `rosterScope`, `logoUrl` 없음
  - Member에 `imageUrl`, `bloodType`, `height`, `hobbies`, `specialties` 없음
  - `MemberStatus`에 `trainee` 없음
  - `LineageEntry.logoUsageAllowed`가 literal(false) 로 강제 (실제는 boolean.default(false))
- 수정 지시(택1):
  1. 파일 삭제. (권장 — dead code)
  2. 파일 상단에 `⚠ 이 파일은 참고용 초기 스냅숏이며 실제 계약은 src/lib/schema.ts 입니다` 배너 삽입.
- 주의: `HANDOVER.md` §역사 참고에서 이 파일을 언급하는지 확인 후 문서도 동기화.

### P2-2 · `RankingPanel.tsx` 미사용 파일 잔존

- 파일: `src/components/home/RankingPanel.tsx` (21줄)
- `RankingPanel` 심볼이 어디에도 import되지 않음 (Grep 결과 자기 자신만 매치).
- `PRODUCT_RMVP_PLAN.md` §4.5, §11 "데이터가 전달되지 않는 랭킹 패널은 rMVP에서 제거한다" 정책과 일치하는 방향이나 파일 자체는 아직 남아 있음.
- 파일 내부: `locale` prop 선언 후 미사용, `verified.length === 0` 브랜치 항상 참(호출 부재).
- 수정 지시: 파일 삭제. 이후 `pnpm build` 재확인.

### P2-3 · `deriveFranchise` 하드코딩과 `Group.franchise` 스키마 필드의 이중 진실

- 파일: `src/lib/search.ts:29-38`
- 현재: `SAKAMICHI_GROUP_IDS = new Set(['nogizaka46','sakurazaka46','hinatazaka46','keyakizaka46'])` 하드코딩. `deriveFranchise` 는 이 세트만 확인.
- 스키마: `Group.franchise: FranchiseKind` (sakamichi | akb48g) 필드가 이미 존재하며 `data/groups.json`의 16개 그룹 전부에 정확한 값이 설정됨.
- 현재 상태: 실제 데이터와 하드코딩이 우연히 일치하나, 신규 그룹 추가나 아카이브 그룹 확장 시 drift 위험. 검색 인덱스 빌더가 `deriveFranchise` 를 통해 계산하므로 문서 정책과 어긋난 조용한 실패 가능성.
- 수정 지시: `scripts/build-search-index.ts` 를 groups.json도 로드하도록 확장하고, `item.franchise = group.franchise` 로 직접 대입. `deriveFranchise` 는 legacy fallback이나 삭제 대상으로 표시.

---

## P3 · 참고·후속

### P3-1 · `/[locale]/dev/bg` 배경 시각 데모가 프로덕션 빌드에 포함됨

- 파일: `src/app/[locale]/dev/bg/page.tsx`
- 정적 파라미터 생성 결과 `/ja/dev/bg`, `/ko/dev/bg`, `/en/dev/bg` 3개 경로가 생성됨. sitemap은 이 경로를 포함하지 않으므로 색인은 되지 않지만 직접 URL은 노출.
- 영향: 낮음. 팬 사용자가 발견해도 기능적 위험은 없음.
- 수정 지시(선택):
  1. `NODE_ENV === 'production'` 에서 `notFound()` 하도록 가드.
  2. `middleware.ts` 에서 `/dev/` 경로에 `X-Robots-Tag: noindex` 헤더 부착.

### P3-2 · `RankingPanel`의 `locale` prop 미사용 — TypeScript unused 경고 잠재

- P2-2 처리 시 함께 사라짐. 별도 조치 불필요.

### P3-3 · `callPrivateInquiryRpc` 요청 헤더에 `Authorization: Bearer` 부재 — 방어적 보완

- 파일: `src/lib/supabase/server.ts:15-23`
- 현재: `fetch(url + /rest/v1/rpc/…, { headers: { apikey: secretKey, 'content-type': 'application/json' } })`
- Supabase 신형 secret key 정책 하에서 `apikey` 만으로 service_role 인증이 통과하는 것으로 확인됨 (`WORK_ORDER_RMVP` §서버 경계·Firewall 실행 결과: create 201, read 1건, invalid 400).
- 하지만 legacy Supabase JWT-based 서비스 키 정책이나 앞으로의 key 형식 변화에서는 `Authorization: Bearer ${secretKey}` 헤더가 role 결정에 필요할 수 있음. `apikey` 만으로도 통과하는 것은 정책 우연성.
- 참고: `feedback_audit_technical_accuracy.md` (Supabase anon key ≠ JWT 서명키; 정책 확인 후 결정) — 이 항목은 정보성만 남기고 즉시 코드 변경은 지시하지 않음.
- 수정 지시(선택): 방어적으로 `Authorization: 'Bearer ' + secretKey` 를 헤더에 추가. 현재 통과 상태에서는 무해.

---

## 통과 확인된 계약 (positive findings)

큰 줄기가 문서 계약대로 유지되고 있음을 아래 항목으로 확인.

1. **문의 보안 3중 방어**
   - 브라우저: `/api/inquiries/{create,read}` 서버 API 만 호출 (`PrivateInquiryBoard.tsx:59,72`).
   - 서버: `PRIVATE_INQUIRY_ENABLED === 'true'` 게이트 + 입력 길이 재검증 (route.ts).
   - DB: `20260830085201_restrict_private_inquiry_rpcs_to_service_role.sql`에서 anon/authenticated 실행 권한 회수, `service_role` 만 grant. 테이블 직접 권한은 `20260825141350` 에서 이미 revoke.
   - 해시: SHA-256 (id) + bcrypt (password), 원문 저장 없음. `extensions.pgcrypto` 스키마 사용.
   - 한도: advisory lock, 전역 30건/분, ID당 50건 상한 (`20260826130102`).
2. **다국어 검색 정규화**
   - `normalizeQuery` 가 katakana→hiragana, 공백·하이픈·언더스코어·중점·bullet 통합 제거 (`src/lib/search.ts:59-68`). PRODUCT_RMVP §11 요구사항 충족.
   - 초성 검색 (`isChoseongQuery` /^[ㄱ-ㅎ]+$/) 지원.
   - `findSearchMatch` 로 name/alias/group 근거 반환 (i18n 키만 en 누락 — P0-1).
3. **HTTPS 강제 스키마**
   - 모든 URL 필드가 `HttpsUrl = z.string().url().startsWith('https://')` 로 검증. `portal.events[*].officialUrl` 위반 0건 확인.
4. **middleware 경로 분리**
   - `/api/*` 는 `NextResponse.next()` 로 next-intl matcher 우회 (route 404 회귀 방지).
   - `/` 는 default locale로 **rewrite** (redirect 아님). AdSense 크롤러가 root에서 ads 스크립트를 확인 가능.
5. **JSON-LD alternateName 단일화**
   - `buildMemberDiscoveryTerms(member, group)` 유틸이 metadata keywords와 Person JSON-LD `alternateName` 을 같은 소스에서 생성 (`identity.ts` + `[memberId]/page.tsx:41,147,156`).
6. **rosterScope 보수적 판정**
   - `GroupDataStatus.tsx` 에서 `rosterScope === 'complete' AND withLinks === total` 인 경우에만 `complete` 표기. 그 외는 `partial` 또는 `collecting`. `representative` 그룹 7개(JKT, BNK, CGM, MNL, TeamSH, TeamTP, KLP48)는 `collecting` 상태 유지.

---

## 실행 순서 제안 (사용자 승인 후)

1. **P0-1 만 먼저 Sonnet에 위임** — `en.json` 3키 추가 + `pnpm build` 회귀 확인. 5분 내 완료 가능.
2. **P1 두 건 묶어서 Sonnet에 위임** — 문서 수치 갱신(코드 무변경) + 멤버 페이지 링크 카운트 한 줄 교체.
3. **P2 세 건은 별도 커밋으로 묶어 Sonnet에 위임** — dead code 제거·스키마 파일 정리·이중 진실 통합.
4. **P3는 문서 등록만** — 즉시 조치는 하지 않고 이 파일에서 추적.

각 단계 완료 시 `WORK_ORDER_RMVP_2026-08-25.md` 뒤에 "AUDIT_REPORT_2026-09-04_rev1 대응 실행 단위" 섹션을 추가하고 `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm build` 결과를 기록한다.

---

## 감사 방법 요약

- 문서 계층: `README.md` → 3현행 문서 → 역사 문서 순서로 계약·수치·정책 인용문 추출.
- 데이터: `data/*.json` 을 Node에서 직접 스캔 (그룹·멤버·이벤트·링크타입·rosterScope·singles·videos·updates).
- 코드: `src/lib/schema.ts` + `src/lib/search.ts` + `src/lib/identity.ts` + `src/lib/supabase/{client,server}.ts` + API routes + `[locale]/{page,contact,search,g,m}/page.tsx` + `components/{home,group,member,contact,search}/…` 순으로 읽기.
- 마이그레이션: `supabase/migrations/*` 3파일 전부 확인.
- i18n: `messages/{ja,ko,en}.json` 키 diff.
- 시나리오: 홈 → 계열 → 그룹 → 멤버 → 공식 SNS + 검색(다국어) + 문의(등록/조회) 를 코드 경로로 추적.

외부 상태 (Vercel 배포, Supabase 원격 DB, GitHub Actions 실행, AdSense 관리 화면) 는 감사 범위에서 제외 — `CODEX_HANDOVER.md` 기록만 참고.
