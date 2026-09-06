# Sakamichi Box — 전면 정합성 감사 보고서 rev3

- 기준일: 2026-09-04
- 이전 rev: [rev1](./AUDIT_REPORT_2026-09-04_rev1.md) (초기 8건 감사) → [rev2](./AUDIT_REPORT_2026-09-04_rev2.md) (rev1 전건 해소 + Vercel 빌드 복구)
- 본 rev의 목적: 10,000-scale 심층 감사 (L1-L9) + rev2 남은 관찰 항목(Vercel, GitHub Actions, KLP48) 결과. 신규 발견 이슈 6건과 조치 우선순위.
- 감사자 역할: Opus (설계·검토). 코드 수정은 Sonnet 위임.

---

## 요약

| 신규 항목 | 카테고리 | 심각도 | 상태 |
|---|---|---|---|
| N1 daily-updates 워크플로에 validate 게이트 부재 | 자동화 안정성 | **P1** | 미조치 |
| N2 updates/videos schema Zod 검증 부재 | 데이터 계약 | **P1** | 미조치 |
| N3 latest-updates.json 중복 ID + 30건 비-ISO 날짜 + URL-title | 데이터 품질 | **P1** | 미조치 |
| N4 about/credits 페이지 generateMetadata 부재 | SEO | P2 | 미조치 |
| N5 KLP48↔AKB48 3명 동일 인물 이중 레코드 | 데이터 모델링 | P2 | 미조치 (제품 결정 필요) |
| N6 /api/updates runtime 미선언 | 코드 일관성 | P3 | 미조치 |

관찰 항목 결과:
- **Vercel Production 빌드 HEAD `a688531`**: **SUCCESS** (state=success, "Deployment has completed"). rev2에서 남긴 관찰 항목 해소.
- **직전 4개 auto-sync 커밋** (bc2563d/7d6df6d/8ce24fe/656839d): 모두 Vercel `failure` 확인. rev2 병합이 정확히 회귀를 종식.
- **CI 워크플로 (ci.yml)**: 2026-08-24 이후 38개 auto-sync 푸시 중 0회 실행. `git-auto-commit-action`이 `GITHUB_TOKEN` 사용 → GitHub의 재귀 트리거 방지 정책으로 CI 스킵됨. Vercel만 회귀 감지 가능한 구조.
- **KLP48↔AKB48**: 3명 (行天優莉奈, 黒須遥香, 山根涼羽) 확실한 동일 인물 이중 등록.

전반 판정: rev2 이후 코드·문서는 안정 상태. 다만 **자동화 계층에 근본 재발 방지가 아직 없음** — 다음 데이터 이슈가 발생하면 여전히 Vercel까지 통과해 실패 알림. N1·N2·N3가 이 재발 방지의 핵심.

---

## L1 · 데이터 cross-ref 스캔 결과

`groups × members × portal.events × portal.rankings × portal.brandAssets × discography × updates × videos` 상호 참조 및 ID uniqueness 스캔.

- **총 이슈**: 1건 → **N3에 흡수** (아래 §N3).
- **깨끗한 부분**: 그룹/멤버/이벤트/venue/singles/videos 모두 ID 중복 없음, primaryGroupId/generationId dangling 없음, ranking.subjectId 참조 유효, 각 그룹 최소 1명 primary member 보유.

## L2 · 서브스키마 vs 실제 데이터 대조

- `portal-schema.ts` (Zod) → `data/portal.json` 검증 통과.
- `discography-schema.ts` (Zod) → `data/discography.json` 검증 통과 (256 singles, 9 groups covered — 예상대로 대표 수록 7 overseas groups 제외).
- **`updates-schema.ts`**: **Zod 아님, 순수 TypeScript interface**. `data/latest-updates.json`는 runtime 검증되지 않음. **→ N2·N3의 근본 원인**.
- **`videos-schema.ts`**: 동일. 현재 데이터는 클린 (ISO 34/34, URL-title 0) 하지만 안전망 없음. **→ N2에 포함**.

## L3 · i18n 완전 diff

- 3언어 (`ja`/`ko`/`en`) 키 개수 동일 (196개), missing 0, placeholder mismatch 0.
- 3-way identical 11건: `link.instagram/tiktok/youtube/note/weibo`, `home.navYoutube/navTiktok`, `credits.wikipediaHeading/wikimediaHeading`, `timeline.sectionKicker`, `discography.kicker` — 모두 고유명사·브랜드·section kicker 이므로 정상.
- **판정: 이슈 없음** (rev2 P0-1 수정 후 완전 정합).

## L4 · 페이지·API·middleware 정합성

- 모든 `[locale]/**/page.tsx`가 `setRequestLocale`·`generateStaticParams`·`generateMetadata` 3종을 대부분 보유.
- **예외 (`generateMetadata` 부재)**: `about/page.tsx`, `credits/page.tsx` **→ N4**.
- `dev/bg/page.tsx`는 `'use client'`라 3종 모두 없음 — rev2에서 프로덕션 렌더 null 가드 완료.
- API routes: `inquiries/{create,read}/route.ts`는 `export const runtime = 'nodejs'` 명시, `api/updates/route.ts`는 미선언 **→ N6**.

## L5 · SEO 자산 정합성

- `sitemap.ts`: home + 16 groups × 3 locales + gen pages + archive pages (saku/hina) + 454 members × 3 locales + 7 static paths (search/about/credits/compare/privacy-policy/terms/contact) × 3 locales. `dev/bg` 제외 확인.
- `robots.ts`: `disallow: ['/api/']` 정상.
- canonical & hreflang: 모든 페이지 (about/credits 제외) `alternates.canonical` + `alternates.languages` + `'x-default'` 3언어 세트 보유.
- JSON-LD: WebSite/MusicGroup/Event/MusicRelease/Person 5종 스키마 정상 배치. `JsonLd.tsx` 공통 컴포넌트 사용.
- OG image: 3 경로 (home/group/member) 모두 존재.
- **판정: 이슈 없음** (N4가 SEO에도 걸리지만 §N4에서 통합).

## L6 · 보안 표면 & 환경 노출

- 서버 전용 env: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PRIVATE_INQUIRY_ENABLED`. 클라이언트 전용: `NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT`.
- Supabase URL/키 하드코딩 없음.
- `.env.example`만 tracked, 실 `.env*` 파일 없음. `.gitignore`가 `.env*.local` 보호.
- `.vercelignore`: `.next`, `.tmp`, `node_modules`, `.git`, `supabase/.temp` 제외 확인.
- `AdSense pub-8422791508684989`는 `ads.txt`에 공개된 값이므로 코드 fallback 하드코딩 무해.
- 문의 API: rev2에서 `Authorization: Bearer` 방어 헤더 추가 완료.
- **판정: 이슈 없음**.

## L7 · 빌드 config & 워크플로

- `next.config.ts`: 최소·명확 (`reactStrictMode`, `outputFileTracingRoot`, `withNextIntl`).
- `tsconfig`: `strict: true`, `noUncheckedIndexedAccess: true` — 엄격 모드.
- `package.json scripts`: 모든 tsx 참조 스크립트 실제 존재 (validate/fetch/events/links/contrast/coverage/profiles/search:build/search:verify).
- **`.github/workflows/daily-updates.yml`**: fetch → git-auto-commit → push 순. **validate 스텝 없음** **→ N1**.
- `.github/workflows/ci.yml`: push 시 validate + typecheck + build 실행. 다만 `git-auto-commit-action`의 `GITHUB_TOKEN` 푸시는 CI 트리거 안 함 (GitHub 재귀 방지 정책).
- `link-check.yml`, `scrape-akb-images.yml`, `ci.yml` 유효.

## L8 · 문서 계층 & 폐기 배너

- 15개 `.md` 파일 헤더 확인. 현행 3문서 (PRODUCT_RMVP_PLAN/WORK_ORDER_RMVP_2026-08-25/CODEX_HANDOVER) 명확.
- `sakamichi.schema.ts` 언급: AUDIT rev1·rev2 (조치 근거로 필수), `sakamichi-hub-work-order.md` (폐기 문서·역사 맥락 유지). 잔존 참조 무해.
- `1,536` vs `1,538`:
  - 현행: README, CODEX_HANDOVER 모두 1,538.
  - 역사 (HANDOVER.md): "당시 검증 기준 1,536개 정적 페이지" 명시적 표기.
  - `WORK_ORDER_2026-08-25_ADS_DOC_SYNC.md` line 51/64: 1,536 명시적 "당시" 표기 없음. 다만 문서 자체가 2026-08-25 dated 이므로 문맥상 그 시점 결과. 경미 (P3 미만, 미조치 권장).
- **판정: 이슈 없음** (rev2 정합화 완료 상태 확인).

## L9 · 접근성 & AdSense

- `Navigation.tsx`: 아이콘 버튼 (compare/search) `aria-label` 부여.
- `PrivateInquiryBoard.tsx`: rev1에서 확인한 대로 `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, 방향키·Home·End 지원.
- `ads.txt`: `google.com, pub-8422791508684989, DIRECT, f08c47fec0942fa0` 정상.
- `AdSense` script: `layout.tsx`에서 `<Script async strategy="afterInteractive">` + `<meta name="google-adsense-account">` 양쪽 로드.
- `AdSlot.tsx`: 정의됐으나 어디에도 사용되지 않음. rMVP 정책 "수동 슬롯은 슬롯 ID와 배치 목적이 확정될 때만 추가" 준수 상태 (자동 광고만 활성).
- **판정: 이슈 없음**.

---

## 신규 이슈 상세

### N1 · daily-updates.yml에 pnpm data:validate 게이트 부재 (P1)

**현상**: `.github/workflows/daily-updates.yml`는 fetch 스크립트 3종(updates/events/videos) 실행 후 `stefanzweifel/git-auto-commit-action@v5`로 즉시 커밋·푸시. `pnpm data:validate` 검증이 없음.

**영향**:
- rev1 발견의 원인이 정확히 이것. 옛 `events.ts`(httpsUrlOrFallback 없음)가 HTTP URL을 `portal.json`에 삽입 → 워크플로는 성공 → 커밋 푸시 → Vercel 빌드 실패.
- 자동 커밋은 `GITHUB_TOKEN` 사용 → CI 워크플로 트리거 안 됨 → 유일한 안전망 Vercel만 catch.
- Vercel은 관찰만 하고 자동 롤백 안 함 → alias는 마지막 성공 빌드에 stuck.

**수정 지시**:
`.github/workflows/daily-updates.yml`의 "Commit and Push" 스텝 직전에 다음 추가:
```yaml
      - name: Validate data before commit
        run: pnpm data:validate
```
- validate가 실패하면 워크플로가 실패 → auto-commit 스킵 → 나쁜 데이터 push 방지.
- 사용자에게 GitHub Actions 실패 알림이 발송되지만 Vercel 빌드는 안전 상태 유지.

**바꾸지 않는 범위**: 다른 워크플로 (ci.yml, link-check.yml, scrape-akb-images.yml), fetch 스크립트 내부 로직.

### N2 · updates/videos schema Zod 검증 부재 (P1)

**현상**:
- `src/lib/updates-schema.ts`: `export interface RecentUpdate { … }` — 순수 TypeScript interface, 컴파일러만 확인.
- `src/lib/videos-schema.ts`: 동일 패턴.
- `scripts/validate.ts`가 이 두 파일에 대한 Zod 검증을 실행하지 않음 (portal/discography만).

**영향**:
- 데이터 계약 위반이 조용히 통과. N3의 30건 비-ISO 날짜, URL-title, 중복 ID 모두 이 때문.
- 컴포넌트가 `new Date(item.publishedAt)` 등을 호출할 때 Safari 등에서 Invalid Date.

**수정 지시**:
1. `updates-schema.ts` → Zod 스키마로 전환:
   - `id: Slug`, `groupId: Slug`, `memberId: Slug.optional()`, `title: z.string().min(1).max(200)` (URL-title 방어), `publishedAt: z.string().datetime({ offset: true })` (ISO 강제), `url: HttpsUrl`, `type: z.literal('official_blog')` 등.
2. `videos-schema.ts` → 동일 패턴.
3. `scripts/validate.ts`에 `RecentUpdates.array().parse(latestUpdatesData)` 추가.
4. `src/lib/data.ts`의 `latestUpdatesData as RecentUpdate[]` 캐스팅 유지 가능 (validate가 이미 스키마 확인).

**바꾸지 않는 범위**: 컴포넌트 렌더링 로직, fetch 스크립트 (다만 N3 조치에서 fetch도 손봄).

### N3 · latest-updates.json 데이터 품질 문제 (P1)

**발견**:
- **중복 ID 1건**: `hina-httpsyoutubemgFUzc4ToMsiH2DMjrofZoJbVv2e` (2 entries).
- **비-ISO publishedAt 30/60건**: `"2026.9.4 13:49"`, `"2026.09.04 19:02"` 등. Safari에서 Invalid Date.
- **URL을 title로 담은 항목 5건**: `title = "https:&#x2F;&#x2F;youtu.be/mgFUz_c4ToM…"`. 렌더 시 URL이 그대로 노출.
- **HTML entities 남은 title 6건**.
- **URL-embedded ID 15건**: `hina-httpsyoutubemgFUzc4ToM…`, `hina-sofficialdiarydetail70877ima0000cdmember…`.

**원인**: `scripts/fetch/updates.ts`의 slug 생성기가 정상 title이 없을 때 URL fragment를 그대로 slugify. 또한 dedup·정규화 없음.

**수정 지시** (N2와 동반):
1. `scripts/fetch/updates.ts`에서:
   - Title이 URL 패턴이거나 HTML entities만 있으면 해당 entry 스킵.
   - Slug 생성: URL 대신 title의 hash 8자리 사용 (예: `hina-${shortHash(title+publishedAt)}`).
   - `publishedAt` 반드시 ISO 8601 offset 형태로 정규화 (`new Date(raw).toISOString()`).
   - Dedup: 동일 URL이면 최신 publishedAt만 유지.
2. 위 수정 후 `pnpm exec tsx scripts/fetch/updates.ts` 재실행 → clean `latest-updates.json` 재생성.
3. N2의 Zod validate가 이후 회귀를 방지.

**바꾸지 않는 범위**: 이벤트/비디오 fetch, `getLatestUpdates()` 소비자 API 시그니처.

### N4 · about/credits generateMetadata 부재 (P2)

**현상**: `src/app/[locale]/{about,credits}/page.tsx` 두 파일이 `generateMetadata` 없음. `[locale]/layout.tsx`의 default title/description을 상속 → 홈과 동일 title로 색인됨.

**수정 지시**:
- `about`: title `About | 坂道・48グループ リンクハブ` (ja/ko/en 각각), description 각 언어로.
- `credits`: title `Credits (CC BY-SA 4.0) | …`.
- `alternates.canonical` + `languages` + `'x-default'` 세트 포함.
- 다른 static 페이지 (`terms`, `privacy-policy`, `contact`, `search`) 형태 참조.

### N5 · KLP48↔AKB48 3명 이중 등록 (P2 — 제품 결정 필요)

**발견 (Obs2)**: 3쌍의 동일 인물이 별도 member 레코드로 등록:
| 인물 | KLP48 레코드 | AKB48 레코드 |
|---|---|---|
| 行天優莉奈 | `klp48-gyouten-yurina` (joined 2014-04-03) | `akb48-gyouten-yurina` (joined 2020-01-01) |
| 黒須遥香 | `klp48-kurosu-haruka` (2016-12-08) | `akb48-kurosu-haruka` (2020-01-01) |
| 山根涼羽 | `klp48-yamane-suzuha` (2016-12-08) | `akb48-yamane-suzuha` (2020-01-01) |

- 양쪽 다 `imageUrl` 동일 (AKB48 CDN), `status: active`, `isConcurrent: false`, `leftOn: null`.
- 검증기가 duplicate image 경고 3건 발생 (exit 0).

**영향**:
- 검색 시 같은 사람이 2건 노출.
- 멤버 카운트 3명 부풀림 (실제 454 → 451).
- SEO: 같은 인물의 2 URL 색인.
- rMVP `id 규칙 {group prefix}-{romaji-family}-{romaji-given}` 자체는 그룹별 URL을 허용하나, `memberships[]`의 concurrent 표시가 빠짐.

**옵션**:
- (a) 병합: 각 인물 1 레코드로 통합, `memberships` 배열에 KLP48+AKB48 두 항목 (`isConcurrent: true`). 정통 스키마 접근. URL 리다이렉트 6→3 필요.
- (b) cross-ref 필드 추가: 스키마 확장 `crossReferenceMemberId`. 카운트는 유지되지만 UI에서 배지 표기.
- (c) 현행 유지 + 검증기 경고 유지. 대표 수록 정책상 KLP48 3명은 "간판 멤버" 표시로 존치.

**Opus 의견**: (a)가 데이터 정합상 정답이나 URL 회귀 (3개 KLP48 URL 삭제 → 301 필요) 필요. rMVP §12 "안전 경계 — 동일 인물임이 확인되지 않은 사진과 SNS는 추가하지 않는다"는 반대 방향 (여기선 이미 확인됨). 사용자 제품 결정 필요.

### N6 · /api/updates runtime 미선언 (P3)

- 파일: `src/app/api/updates/route.ts`.
- `inquiries/create`, `inquiries/read`는 `export const runtime = 'nodejs'` 명시. `api/updates`는 미명시 → 기본값(nodejs) 사용.
- 기능적 무해. 일관성만 개선.

**수정 지시**: 상단에 `export const runtime = 'nodejs';` 추가 (revalidate 900은 유지).

---

## 조치 우선순위 제안 (사용자 승인 대기)

**단계 A — 재발 방지 최우선 (권장 즉시)**:
- N1 (daily-updates에 validate 게이트) — 5분 조치, 재발 100% 차단.

**단계 B — 데이터 계약 강화 (권장 다음)**:
- N2 (updates/videos Zod 스키마) — 30분 조치, 검증기 확장.
- N3 (latest-updates.json 클린 + fetch 스크립트 강화) — 1시간 조치, 데이터 재생성 포함.

**단계 C — SEO·일관성 소소한 개선**:
- N4 (about/credits metadata) — 15분.
- N6 (api runtime) — 2분.

**단계 D — 제품 결정 필요**:
- N5 (KLP48 이중 등록) — 옵션 (a)/(b)/(c) 중 선택 필요, 실행은 (a) 선택 시 커밋 규모 큼.

**단계 E — 감사 종료**:
- rev4 파일에 각 조치 결과 기록.

---

## 검증 상태 (rev3 시점)

```
git rev-parse HEAD        → a688531c4cb3c7f9aafa11cc24e3c61e02660351
git rev-parse origin/main → a688531c4cb3c7f9aafa11cc24e3c61e02660351

pnpm typecheck       → 통과
pnpm data:validate   → 통과 (KLP48 3중복 이미지 경고 유지, exit 0)
pnpm search:verify   → 통과 (454명)
pnpm build           → 통과 (1,538/1,538)

Vercel Production a688531 → SUCCESS
GitHub Actions ci.yml (a688531) → success 1m33s
```

작업 트리 untracked: `.tmp/`, `AUDIT_REPORT_2026-09-04_rev1.md`, `AUDIT_REPORT_2026-09-04_rev2.md`, `AUDIT_REPORT_2026-09-04_rev3.md`.

---

## 참고 정책

- 모델 역할 분리 (feedback_model_role_split): Opus 감사·계획, Sonnet 코드 조치.
- 감사 보고 파일화 (feedback_audit_report_delivery): 채팅 요약 대신 rev 파일.
- 기술 정확성 (feedback_audit_technical_accuracy): P2/P3 판정 전 spec·handoff·docs 재확인 — rev3에서 준수.
- 각 조치 커밋 단위는 rev2와 동일하게 (P1 → P2 → P3) 세분화 예정. 각 커밋 후 5개 pnpm 검증 통과 확인.
