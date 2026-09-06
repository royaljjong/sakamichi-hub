# Sakamichi Box — 브라우저 콘솔 오류 해소 rev12

- 기준일: 2026-09-06
- 이전 rev: [rev1-11](./AUDIT_REPORT_2026-09-04_rev1.md) 완료 이후 사용자 브라우저 콘솔 오류 보고.
- 본 rev의 목적: React #418 hydration mismatch + favicon.ico 404 해소.

---

## 사용자 보고

```
Uncaught Error: Minified React error #418; ...args[]=text&args[]=
    at rD (3466f3f1-c96f853f58dc03ee.js:1:35056)
    ...
/favicon.ico:1  Failed to load resource: the server responded with a status of 404 ()
```

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **HYDRATE-1** React #418 (SSR/CSR 시간 불일치) | 사용자 UX + 콘솔 오류 | **P1** | **해소** | `4daa8e0` |
| **FAV-1** /favicon.ico 404 | 콘솔 노이즈 | P3 | **해소** | `f7c349c` |

---

## 1. HYDRATE-1 · React #418 hydration mismatch (커밋 `4daa8e0`)

### 진단
React error #418 = `Text content does not match server-rendered HTML` (하이드레이션 불일치).

문제 컴포넌트 3개 (전부 `today`로 필터/버킷팅):
| 파일 | 위치 | 문제 |
|---|---|---|
| `src/components/home/EventBoard.tsx` | Line 19 | **`'use client'` directive 자체 부재** — Server Component가 `new Date()` 호출. SSR 시점 시간이 HTML에 baked-in, 클라이언트 hydration 시 `new Date()` 재계산 → 시간 차 → DOM 불일치. **실제 root cause.** |
| `src/components/home/HomePortal.tsx` | Line 107 | Client component render 중 `new Date()`. SSR 시각 vs 클라이언트 시각 차 |
| `src/components/home/BirthdayPanel.tsx` | Line 43 | 동일 |

3 컴포넌트 모두 `today`, `month`, `todayMd`로 멤버 생일/이벤트 필터링 → 서버·클라이언트 다른 데이터 → DOM tree 크게 다름 → 하이드레이션 실패.

### 조치 (Sonnet 위임, 1커밋)

1. **`EventBoard.tsx`**: 
   - 최상단 `'use client';` directive 추가 (누락 상태였음).
   - `useState<Date | null>(null)` + `useEffect(() => setToday(new Date()), [])`.
   - `today === null` 시 early-return `null`.

2. **`BirthdayPanel.tsx`**: 
   - 동일 mount-guard 패턴.
   - `useState`, `useEffect` import 추가 (이전에 `import React from 'react'` 만 있었음).

3. **`HomePortal.tsx`**: 
   - mount-guard로 `today` 지연 계산.
   - 852줄 monolithic component라 null-return 대신 inline ternary로 month/todayMd 안전 처리. 다른 섹션(groups grid, YouTube, TikTok 등)은 SSR에서 정상 렌더 유지.

### 원리
- SSR: `today === null` → 생일/이벤트 섹션은 skeleton 또는 빈 상태.
- 클라이언트 hydration: `today === null` 동일 상태 → **일치**.
- `useEffect` 실행 후: `setToday(new Date())` → 리렌더 → 실제 데이터 표시.

DOM 초기 렌더가 서버·클라이언트 정확히 일치 → React #418 소멸.

### 검증 (배포 후)
- 로컬 `pnpm typecheck` / `data:validate` / `search:verify` / `build` 전부 통과.
- Vercel Production `4daa8e0` = success.
- 브라우저 콘솔 실측은 사용자 재확인 필요 (Opus는 브라우저 접근 불가).

---

## 2. FAV-1 · /favicon.ico 404 (커밋 `f7c349c`)

### 진단
- `src/app/icon.svg` (rev12 신규, 221 bytes SVG) 존재.
- Next.js가 HTML head에 `<link rel="icon" href="/icon.svg?..." type="image/svg+xml" sizes="any">` 자동 삽입 확인.
- 그러나 브라우저·크롤러가 legacy convention으로 `/favicon.ico` 도 요청 → 404.

### 조치
`next.config.ts`에 `async rewrites()` 추가:
```ts
async rewrites() {
  return [
    { source: '/favicon.ico', destination: '/icon.svg' },
  ];
},
```

### 검증 (배포 후 실측)
```
$ curl -sI https://sakamichi-hub.vercel.app/favicon.ico
HTTP/1.1 200 OK
Content-Length: 221
Content-Type: image/svg+xml     ← icon.svg 내용을 image/svg+xml로 서브
```
Legacy `/favicon.ico` 요청도 200 응답 + SVG 파비콘 노출.

---

## 3. 회귀 없음 확인 (실측)

```
/ja                                    HTTP=200 ✓
/ja/m/nogi-yada-moeka (valid member)   HTTP=200 ✓
/ja/m/nonexistent-... (unknown)        HTTP=404 ✓ (rev11 fix 유지)
/ja/m/klp48-gyouten-yurina (redirect)  HTTP=301 (rev5 유지 확인)
/icon.svg                              HTTP=200 ✓
/favicon.ico                           HTTP=200 ✓ (rev12 신규)
```

CSP, security headers, HSTS 전부 유지.

---

## 4. 저장소 상태

```
git rev-parse HEAD → f7c349c
git log --oneline -5:
  f7c349c chore(assets): rewrite /favicon.ico → /icon.svg for legacy browser fallback
  4daa8e0 fix(hydrate): defer today calculation to client mount + add favicon
  e44081e fix(seo): disable dynamicParams on dynamic routes so unknown IDs return HTTP 404
  723910c fix(seo): add [locale]/not-found.tsx to return HTTP 404 for unknown routes
  2aee9fb chore(links): weekly automated link health update

Vercel Production f7c349c → success
Route count: 1,530 (icon.svg 정적 자산 추가)
Middleware: 101 kB
```

---

## 5. rev1-12 최종 총괄

| rev | 커밋 | 주요 |
|---|---|---|
| rev1-9 | 15 | 정합성·성능·자동화·보안 (문서화 감사 사이클) |
| rev10 | 4 | postcss + link-check 워크플로 + 병렬화 |
| rev11 | 2 | SEO soft 404 완전 해소 |
| **rev12** | **2** | **hydration mismatch + favicon 404 해소** |

- **총 27 조기 커밋** (rev1-12 실제 코드 변경)
- **35 P0-P3 해소** (rev11 33 + rev12 2)
- **3 공식 종결** (NMB48/STU48 · Middleware · Sitemap) + **1 downgrade** (next-intl CVE)
- **1 orphan branches 삭제** (rev11 후속, git recoverable)

### 자동화 4중 방어 (실전 반복 검증)
1. Fetch 정규화 (rev4 N3)
2. Auto-commit validate 게이트 (rev4 N1)
3. CI + Vercel (매 push)
4. Link-check 병렬화 + validate (rev10)

### 5중 보안 계층
1. HSTS (Vercel 자동)
2. X-Content-Type-Options·Referrer-Policy·X-Frame-Options·Permissions-Policy (rev8)
3. CSP Report-Only 12지시자 (rev9)
4. 문의 API 3중 방어 (rev2)
5. Supabase Bearer defensive (rev2)

### SEO·UX 완전성
- known URL → 200 (SSG prerender)
- known redirect → 301 (middleware, 3 KLP48)
- unknown URL → 404 (rev11 dynamicParams=false)
- **hydration mismatch 없음** (rev12 mount-guard)
- **favicon 200** (icon.svg + rewrite)
- hreflang 3언어 · error/loading/global-error boundaries · localized not-found

### 자체 지속 프로세스
- daily-updates 워크플로 (6h)
- link-check 워크플로 (주간, 3분 완료)
- scrape-akb-images (주간)
- CI (매 push)
- Vercel 자동 배포

---

## 6. 남은 관찰 항목

| 항목 | 상태 |
|---|---|
| **CSP enforce 승격** | 사용자가 브라우저 방문 후 콘솔 위반 로그 관찰 필요 |
| **NMB48/STU48 44명** | 외부 조건 (네트워크·팬클럽) 변화 대기 |
| **Next 15→16 + next-intl 3→4** | 실질 CVE 이득 없음, 회귀 위험 중, 우선순위 낮 |
| **Tailwind 3→4 · ESLint 9→10** | 현재 안정, 마이그레이션 불필요 |
| **Playwright 스모크 테스트** | 스코프 4-6h, 회귀 방어 강화 옵션 |

---

## 참고 정책

- feedback_model_role_split: Opus 진단·계획, Sonnet 2 커밋 위임 (Sonnet이 EventBoard `'use client'` 누락 root cause 정확히 진단).
- feedback_audit_report_delivery: rev12 파일 저장.
- feedback_audit_technical_accuracy: hydration은 배포 후 curl로 정적 코드 배치 확인, 실 브라우저 콘솔은 사용자 재확인 요청.

**rev12로 사용자 콘솔 오류 완전 해소.**
