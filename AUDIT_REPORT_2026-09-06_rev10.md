# Sakamichi Box — 심층 후속 감사 rev10

- 기준일: 2026-09-06
- 이전 rev: [rev1-9](./AUDIT_REPORT_2026-09-04_rev1.md) 완료 이후 미탐색 영역·시간 경과 신규 이슈 스캔.
- 본 rev의 목적: rev9 마감 후 24시간 경과 상태에서 문제·보완 필요 사항 8축 (저장소·의존성·테스트·접근성·React·i18n·데이터 드리프트·워크플로) 심층 재감사.
- 감사자 역할: Opus 단독 (분석). 조치는 사용자 승인 후 Sonnet 위임.

---

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **RV-1** postcss 4 CVEs (부분) | 보안 | **P1** | **부분 해소** (pnpm overrides) | `4b0c798` |
| **RV-1** next-intl 2 CVEs + sharp 1 CVE (전체) | 보안 (major migration) | P1 | 관찰 (major 마이그레이션 필요) | — |
| **RV-2** link-check PR 권한 실패 | 자동화 | **P1** | **해소** (git-auto-commit 전환) | `e98bfff` |
| **RV-6** link-check.ts 45분 timeout (신규 발견) | 자동화 성능 | **P1** | **해소** (병렬화 20 concurrent) | `dab4de6` |
| **RV-3** 유닛/통합 테스트 0개 | 회귀 방어 | P2 | 관찰 (범위 큼) | — |
| **RV-4** 4개 major 의존성 outdated | 미래 마이그레이션 | P2 | 관찰 (RV-1 next-intl과 연동) | — |
| RV-5 React.memo 0 사용 | 성능 (측정 필요) | P3 | 관찰 | — |

### 실전 검증 (workflow_dispatch `33978994285`)
- Duration: **3분 19초** (RV-6 병렬화 전 45분 timeout 대비 **13.5× 개선**).
- `Run Link Checks` ✓ + `Validate data before commit` ✓ (rev4 N1 패턴) + `Commit link report if changed` ✓
- Auto-commit `2aee9fb chore(links): weekly automated link health update` main에 landed.

### npm audit 개선
```
Before: 7 vulnerabilities (4 moderate postcss + 2 moderate next-intl + 1 high sharp)
After:  3 vulnerabilities (2 moderate next-intl + 1 high sharp)
Δ: -4 CVEs (postcss 전부 해소)
```

### Non-issues (신규 확인, 이슈 없음)

- **자동화 자기치유 검증**: 2회 최근 auto-sync (2m50s·3m5s) 모두 성공. rev6 fast-skip + rev4 N1 validate 게이트 실전 확인.
- **데이터 드리프트 0**: MA-1 (intra-dup URL) 0, MA-5 (redundant aliases) 0. rev5 정책이 auto-sync를 통해 유지됨.
- **latest-updates 정규화 유지**: 53 entries, 0 non-ISO, 0 URL-title, 0 dupe. rev4 N3 fetch 정규화 정상.
- **WCAG AA 색 대비**: 16 그룹 100% 통과 (최소 11.11:1, 최대 15.40:1) — WCAG AAA(7:1)도 여유 있게 통과.
- **접근성 자산**: 68 semantic landmarks, 37 ARIA 속성 (aria-label ×12, aria-hidden ×14, aria-selected ×3, aria-controls ×2 등), 빈 alt 0.
- **타입 안전성**: `as any` 0건, `@ts-ignore` 0건. 6개 `eslint-disable`은 정당한 사유 (console.error, next/next/no-img-element opt-out).
- **i18n 포맷팅**: `Intl.DateTimeFormat` 사용, locale 매핑 (`ko-KR`/`en-US`/`ja-JP`), `timeZone: 'Asia/Tokyo'` 명시.
- **console 사용**: src/ 전체 2건 (모두 `console.error`, 정당).
- **AUDIT 리포트 스테일**: 없음 (`pnpm data:validate` 경고 0).

---

## 1. RV-1 · 7 npm audit 취약점 (P1)

### 발견 (`pnpm audit --prod --audit-level=moderate`)

| # | Package | Vulnerable | Patched | 경로 |
|---|---|---|---|---|
| 1 | `sharp` | `<0.35.0` (high) | `>=0.35.0` | Next.js 이미지 최적화 transitive |
| 2 | `postcss` | `<=8.5.11` | `>=8.5.12` | `next → postcss` |
| 3 | `postcss` | `<=8.5.17` | `>=8.5.18` | 동일 |
| 4 | `postcss` | `<8.5.10` | `>=8.5.10` | 동일 |
| 5 | `postcss` | `<=8.5.22` | `>=8.5.23` | `.>@vercel/analytics>next>postcss`, `.>@vercel/speed-insights>next>postcss`, `.>next>postcss` (4 paths) |
| 6 | `next-intl` | `<4.9.1` | `>=4.9.1` | 직접 의존 (3.26.5) |
| 7 | `next-intl` | `<=4.9.1` | `>=4.9.2` | 동일 |

**Severity**: 4 moderate + 3 high = 총 7건.

### 판정
- **postcss 4건**: Direct dev-dep은 `8.5.26` (모두 패치 이상)이나 Next.js 15가 내부적으로 옛 postcss 사용. Next.js 15 → 16 업데이트 시 해소 가능.
- **sharp 1건**: 이미지 최적화 native binding. Next.js 자체가 sharp를 lazy-load하므로 실제 코드에서 미사용 (rev7 확인: `<img>` 직접 사용, `next/image` 없음). 영향 최소.
- **next-intl 2건**: Direct dep `3.26.5`, 패치는 `>=4.9.2`. **v3 → v4 major migration** 필요. next-intl v4는 API 변경 다수:
  - `next-intl/middleware` 시그니처 변경
  - `Link`, `useRouter` 등 client API 이관
  - message loading 방식 변경
  - request-scoped 세팅 방식 개편

### 조치 옵션

**옵션 A (권장): Next.js 16 + next-intl 4 병행 업데이트**
- 두 major 마이그레이션을 한 사이클에 진행 (충돌 최소화).
- 예상 소요: 2-4시간 (test 없어서 수동 회귀 필요).
- 리스크: 중간 (API 대량 변경, HomePortal·Middleware·i18n/routing.ts 리팩터).

**옵션 B: postcss만 강제 해결 (`pnpm overrides`)**
- `package.json`에 `pnpm.overrides` 추가하여 postcss 최신 강제.
- next-intl 2건은 남음.
- 소요: 5분. 리스크: Next.js 내부 호환성 이슈 가능성 (일부 후속 회귀).

**옵션 C: 관찰 유지**
- next-intl v3의 실제 CVE 심각도 확인 (GHSA 상세) 후 결정.
- 관측 브라우저 접근 없으므로 실제 위험도 판단 어려움.

### 사용자 결정 필요

nextjs+next-intl major migration은 큰 작업. rMVP §"바꾸지 않는 범위" 언급 없으므로 진행 가능하나, 승인 필요.

---

## 2. RV-2 · link-check.yml 3주 연속 실패 (P1)

### 발견
`.github/workflows/link-check.yml` 매주 월요일 00:00 UTC 실행.

| 실행일 | 결과 | 소요 |
|---|---|---|
| 2026-08-17 | failure | 19m2s |
| 2026-08-24 | failure | 23m9s |
| 2026-08-31 | failure | 37m31s |

### 정확한 실패 원인
Log에서 확인:
```
##[error]GitHub Actions is not permitted to create or approve pull requests.
```

- 링크 체커(`pnpm data:links`) 자체는 정상 완료 (777 링크 체크).
- 이후 `peter-evans/create-pull-request@v6` 액션이 PR 생성 시도 → GitHub 저장소 설정 `Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests`이 OFF → 실패.
- 흥미로운 부작용: `chore/link-report-update` 브랜치는 remote에 존재 (`git branch -r`에서 확인). 매주 브랜치는 갱신되나 PR은 생성 안 됨. 링크 데이터 자체는 상실 없이 브랜치에 보존됨.

### 조치 옵션

**옵션 A: 저장소 설정 변경 (권장, 사용자 수동)**
- GitHub UI: `Settings → Actions → General → Workflow permissions` 스크롤 후 "Allow GitHub Actions to create and approve pull requests" 토글 ON.
- 워크플로 다음 실행에서 정상 PR 생성.
- 완전 자동 조치 (외부 5분 작업).

**옵션 B: 워크플로를 PR 대신 직접 브랜치 커밋으로 변경**
- `create-pull-request` 대신 `git-auto-commit-action`으로 대체 (daily-updates.yml와 동일 패턴).
- 링크 리포트가 매주 자동 커밋 → CI + Vercel 트리거.
- 리스크: 자동 커밋으로 인한 노이즈 증가.

**옵션 C: PAT (Personal Access Token) 도입**
- Repository secret에 `PAT_TOKEN` 등록, 워크플로에 `token: ${{ secrets.PAT_TOKEN }}` 전달.
- 사용자가 GitHub Personal Access Token 발급 필요.

### 권장
**옵션 A**. 가장 단순, 안전, GitHub Actions 표준.

---

## 3. RV-3 · 유닛/통합 테스트 0개 (P2)

### 발견
- `.test.*`, `.spec.*` 파일 스캔: **0건**.
- `package.json`: `"test": "..."` 스크립트 없음.
- `playwright` devDep 설치되어 있지만 스크립트/설정 없음.
- 유일한 테스트: `supabase/tests/private_inquiries_rls.sql` (pgTAP, 12 assertions).

### 판정
- 코드 회귀 방지가 오로지 `pnpm typecheck` + `pnpm data:validate` + `pnpm search:verify` + `pnpm data:contrast`에 의존.
- 컴포넌트 로직·API route 응답·에러 경계·i18n 문자열 렌더링 회귀는 수동 브라우저 확인만.
- rMVP는 solo dev 상황 감안 시 테스트 부재 이해 가능. 코드 안정성은 데이터 검증 스크립트로 우회 확보.

### 조치 옵션

**옵션 A: 최소 스모크 테스트 도입 (Playwright)**
- `playwright.config.ts` + 3-5개 e2e 시나리오 (home, group, member, search, contact tab).
- CI에 `playwright test` 스텝 추가.
- 소요: 4-6시간. 유지 비용 있음.

**옵션 B: 컴포넌트 유닛 테스트 (Vitest)**
- 검색·filter·PrivateInquiryBoard 등 로직 컴포넌트만.
- 소요: 8-12시간.

**옵션 C: 관찰 유지 (권장)**
- 현재 검증 스택으로 rev1-9 자동화가 안정. 신규 위험 발견 시 targeted 테스트 추가.
- rMVP MVP 정신 준수.

---

## 4. RV-4 · 4개 major 의존성 outdated (P2)

### 발견 (`pnpm outdated`)

| Package | Current | Latest | 마이그레이션 난이도 |
|---|---|---|---|
| `next` | 15.5.23 | 16.3.4 | 중 (App Router 안정 후 상대적 안전) |
| `next-intl` | 3.26.5 | 4.14.2 | 상 (API 대량 변경, RV-1과 연동) |
| `tailwindcss` | 3.4.19 | 4.3.3 | 상 (Tailwind v4는 CSS-first 구성, 완전 재작업) |
| `eslint` | 9.39.5 | 10.10.0 | 중 (config 형태 이관) |
| `eslint-config-next` | 15.5.23 | 16.3.4 | 낮음 (next와 동시) |
| `motion` | 12.43.0 | 13.2.0 | 낮음 (Framer Motion, 사용처 확인 필요) |
| `@types/node` | 22.20.1 | 26.4.1 | 낮음 (types만) |
| `@supabase/supabase-js` | 2.112.4 | 2.115.0 | 낮음 (미사용 — server-side 는 REST fetch 사용) |

### 판정
- 현재 버전 모두 정상 동작 중.
- Tailwind 3 → 4는 특히 큰 작업 (globals.css 622줄 + 인라인 클래스 다수 리팩터 필요).
- Next 15 → 16은 상대적으로 안전 (App Router 성숙).

### 권장
- **Next 15 → 16 + next-intl 3 → 4** 병행 진행 (RV-1 해소 겸용).
- Tailwind, ESLint는 별도 사이클로 분리.
- 나머지 minor는 자유 업데이트.

---

## 5. RV-5 · React.memo 0 사용 (P3, 관찰)

### 발견
- `src/components/**/*.tsx` 스캔: `React.memo` / `memo(...)` 0건.
- useEffect 21건, useMemo 3건, useCallback 4건.

### 판정
- 없다고 반드시 문제 아님. Next.js RSC 아키텍처에서 client component만 hydration되며, 대부분 top-level 컴포넌트가 자연스럽게 memo될 필요 없음.
- 리렌더 관찰 후 필요 시 추가. 현재 성능 지표(rev7) 상 문제 없음.

### 조치
관찰 유지. 실제 병목 관찰 시 targeted memo 도입.

---

## 6. 데이터 드리프트 재검사 (S7) — 정상

24시간 경과, auto-sync 2회 후에도 rev5·rev4 정책 유지:

```
updates=53              (rev4 N3 정규화 후 안정 범위)
  non-ISO=0             (rev4 N2 Zod 검증 통과)
  URL-titles=0
  non-slug IDs=0
  duplicate IDs=0
members=451             (rev5 병합 이후 유지)
MA-1 intra-dup URLs=0
MA-5 redundant aliases=0
```

**자동화가 rev1-9 정책을 실전에서 유지하고 있음을 재확인.**

---

## 7. 조치 우선순위 제안

| 단계 | 항목 | 소요 | 리스크 |
|---|---|---|---|
| A (권장, 사용자 액션) | RV-2: GitHub repo setting 토글 ON | 5분 | 없음 (외부 설정) |
| B | RV-1 옵션 B: `pnpm overrides`로 postcss만 강제 (부분 해소) | 15분 | 낮음 (build 검증) |
| C (승인 필요) | RV-1/RV-4 옵션 A: next 15→16 + next-intl 3→4 병행 마이그레이션 | 2-4시간 | 중 (API 대량 변경, 회귀 위험) |
| D | RV-3 옵션 A: Playwright 최소 스모크 테스트 도입 | 4-6시간 | 낮음 (신규 추가) |
| E (관찰만) | RV-4 tailwind/eslint major, RV-5 React.memo | — | — |

### 바꾸지 않는 범위
- rev1-9 정합성·성능·보안 조치 결과 (16 groups, 451 members, 자동화 3중 방어, 보안 5중 계층).
- Middleware 로직·문의 API 계약·Supabase migration.

---

## 8. 검증 상태

```
git rev-parse HEAD → c926c28 (rev9 CSP Report-Only, 변경 없음)
Vercel Production → success (24시간 stable)
CI recent 5 runs → 전부 success
daily-updates.yml recent 2 runs → 전부 success (2m50s·3m5s)
link-check.yml recent 3 runs → 전부 failure (RV-2)
scrape-akb-images.yml recent 3 runs → 전부 success
```

---

## 9. 참고 정책

- feedback_model_role_split: Opus 감사·설계, Sonnet 조치 위임 (승인 대기).
- feedback_audit_report_delivery: rev10 파일 저장.
- feedback_audit_technical_accuracy: 취약점은 `pnpm audit` 실측 근거, workflow 실패는 log 원문 확인.

rev1-10 사이클: **총 19 조치 커밋 + 3 공식 종결 + 5 신규 개선 후보 (rev10)**.
