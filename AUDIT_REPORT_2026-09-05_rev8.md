# Sakamichi Box — 디버깅·오류·Vercel 연계 감사 보고서 rev8

- 기준일: 2026-09-05
- 이전 rev: [rev1-7](./AUDIT_REPORT_2026-09-04_rev1.md) 정합성·멤버 계정·성능 감사 완료.
- 본 rev의 목적: (1) App Router 오류·로딩 경계, (2) 예외 처리·로깅 패턴, (3) Vercel 배포·runtime·env·SDK 통합 감사.
- 감사자 역할: Opus 단독 (실측·분석). 조치는 사용자 승인 후 Sonnet 위임.

---

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **DV-1** `error.tsx`·`global-error.tsx`·`loading.tsx` | 사용자 경험 | **P1** | **해소** | `7f28054` |
| **DV-2** 보안 응답 헤더 4종 (CSP 제외) | 보안 심층 방어 | P2 | **해소** | `4aa539b` |
| **DV-3** `.env.example` `NEXT_PUBLIC_ADSENSE_CLIENT` | 문서 정합 | P3 | **해소** | `5e71488` |
| **DV-4** sitemap.xml 750KB | 색인 위생 | P3 | 관찰 유지 | — |

**전반 판정**: 크리티컬 이슈 없음. Vercel 배포·runtime·SDK 통합 전부 정상. 예외 처리·env 관리 clean. 남은 개선은 error boundary 3파일 추가(사용자 경험) + 보안 헤더 강화(defense in depth). rev1-7 축적 상태를 유지한 채 소폭 하드닝.

---

## 1. DV-1 · App Router 오류·로딩 경계 파일 부재 (P1)

### 발견
`src/app` 하위에서 다음 파일 스캔 결과:

| 파일 | 존재 여부 | 역할 |
|---|---|---|
| `not-found.tsx` (root) | ✓ 있음 | 404 페이지 (브랜드+3언어 대응) |
| `error.tsx` | ✗ 없음 | 페이지·라우트 세그먼트 오류 경계 |
| `global-error.tsx` | ✗ 없음 | 루트 레이아웃 오류 경계 (앱 전체 크래시 catch) |
| `loading.tsx` | ✗ 없음 | 스트리밍 로더 UI |
| Custom `ErrorBoundary` component | ✗ 없음 | React 클래스 오류 경계 |

### 영향
1. **`error.tsx` 부재**: 서버 컴포넌트나 클라이언트 컴포넌트가 예상치 못한 예외를 던지면 Next.js 기본 오류 UI(`Application error: a client-side exception has occurred`) 노출. 브랜드 감성·복구 안내 없음.
2. **`global-error.tsx` 부재**: `[locale]/layout.tsx` 자체가 크래시할 경우 (예: next-intl provider 실패, 폰트 로드 실패) 앱 전체가 흰 화면 또는 Next.js 기본 오류. rMVP §정합성 §문의 방어 안전 경계와 충돌.
3. **`loading.tsx` 부재**: 대형 정적 페이지(홈 531KB) 첫 요청 시 브라우저는 완전 렌더까지 대기. 스트리밍 로더 없어 사용자에겐 "무반응 → 갑자기 완성" 느낌.

### 조치 지시 (승인 시)
3파일 추가, 3언어 대응·기존 브랜드 톤 유지:
- `src/app/[locale]/error.tsx` — 라우트 세그먼트 오류. `reset()` 버튼 포함.
- `src/app/global-error.tsx` — 앱 크래시. `<html><body>` 포함 (레이아웃 없이 렌더).
- `src/app/[locale]/loading.tsx` — 스켈레톤 또는 최소 스피너.

각 파일 20-40줄, 기존 `not-found.tsx` 스타일 참조.

---

## 2. DV-2 · 보안 응답 헤더 누락 (P2)

### 발견
`curl -I https://sakamichi-hub.vercel.app/` 실측 응답 헤더:

**있는 헤더** (Vercel 기본 or 코드 명시):
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ✓ HSTS (Vercel 자동)
- `Cache-Control: public, max-age=0, must-revalidate` ✓
- `X-Nextjs-Prerender: 1`, `X-Vercel-Cache: PRERENDER` ✓
- `Server: Vercel` (정보성)

**누락 헤더** (defense in depth):
- ❌ `Content-Security-Policy` — XSS 방어. AdSense·Google Fonts·Vercel Analytics 도메인 허용 필요.
- ❌ `X-Frame-Options` (또는 CSP `frame-ancestors`) — clickjacking 방어.
- ❌ `Referrer-Policy` — 외부 링크 이동 시 referer 유출.
- ❌ `Permissions-Policy` — 브라우저 feature (카메라·마이크 등) 제한.
- ❌ `X-Content-Type-Options: nosniff` — MIME sniff 방어.

### 조치 지시 (승인 시)
`next.config.ts`에 `async headers()` 추가:
```ts
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // CSP는 인라인 스크립트 (AdSense, next/script) 허용을 위해 nonce 전략 필요, 별도 rev에서 검토
    ],
  }];
}
```
CSP는 별도 (nonce·hash 전략 필요, AdSense 도메인 화이트리스트 등 복잡).

### 리스크
- `X-Frame-Options: SAMEORIGIN`이 iframe 임베드를 막음. 사용자가 사이트를 iframe에 넣는 파트너십 계획이 없다면 안전.
- Permissions-Policy는 순수 제한만 하므로 회귀 없음.

---

## 3. DV-3 · `.env.example`에 `NEXT_PUBLIC_ADSENSE_CLIENT` 누락 (P3)

### 발견
`.env.example` 내용:
```
SUPABASE_URL=
SUPABASE_SECRET_KEY=
PRIVATE_INQUIRY_ENABLED=false
NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED=false
```

`src/app/[locale]/layout.tsx:13` 및 `src/components/ads/AdSlot.tsx:20`은 `process.env.NEXT_PUBLIC_ADSENSE_CLIENT`를 참조 (fallback: 하드코딩 `ca-pub-8422791508684989`).

### 판정
- 실제 프로덕션은 fallback 하드코딩으로 동작 정상.
- 문서 정합성만 gap. 새 개발자가 `.env.example`을 보고 AdSense 관련 옵션 존재를 인지 못할 수 있음.

### 조치 지시 (승인 시)
`.env.example`에 추가:
```
# Optional. AdSense publisher ID override (fallback: ca-pub-8422791508684989).
NEXT_PUBLIC_ADSENSE_CLIENT=
```

---

## 4. DV-4 · sitemap.xml 750KB 단일 파일 (P3, 관찰만)

### 발견
`curl -I https://sakamichi-hub.vercel.app/sitemap.xml`:
- Content-Length: **771,507 bytes** (~750KB).
- 총 URL: home + 16그룹×3언어 + 90 gen×3언어 + 2 archive×3언어 + 451멤버×3언어 + 7 static×3언어 = ~1,500+ entries × language alternates.

### 판정
- Google sitemap 상한 50MB / 50,000 URL. 현재 훨씬 미달.
- 단일 파일 제출도 정상 처리됨.
- 향후 확장 시 sitemap index로 분할 검토, 지금은 조치 불필요.

---

## 5. 통과 확인 (Non-issues)

### 예외 처리
- API routes (`/api/inquiries/create`, `/api/inquiries/read`, `/api/updates`): 전부 try/catch 및 표준 오류 JSON 응답 (`{error: 'invalid_request' | 'upstream_error' | 'unavailable'}`) + HTTP 400/502/503 코드.
- 실측: `POST /api/inquiries/create` 빈 body → HTTP 400 `{"error":"invalid_request"}` ✓
- 클라이언트 fetch: `SearchBox` `.catch(console.error)`, `PrivateInquiryBoard` try/catch → 사용자 알림.
- OG image edge routes: AbortController + 3s timeout + try/catch 침묵 (fallback 로고 없음).

### console 사용
- `src/` 전체 console 호출 2개 모두 정당한 `console.error` (SearchBox 인덱스 로드 실패, api/updates 예외).
- 디버그 leftover 0.

### Env 변수
- 코드 참조 6개: `NODE_ENV`(built-in), `NEXT_PUBLIC_ADSENSE_CLIENT`(fallback), `NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED`, `PRIVATE_INQUIRY_ENABLED`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
- 문서화된 Vercel Production 등록: 4개 (SUPABASE_URL·SECRET_KEY, PRIVATE_INQUIRY_ENABLED, NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED). DB 비밀번호 미등록 ✓.
- 하드코딩 secret 0건.
- `.env*` 파일 tracked 0건 (`.env.example`만 tracked).

### Vercel SDK & Runtime
- `@vercel/analytics` (^2.0.1) + `@vercel/speed-insights` (^2.0.0) 설치.
- `layout.tsx`에 `<Analytics />` + `<SpeedInsights />` 렌더.
- `privacy-policy` 페이지가 3언어로 두 SDK 언급 ✓.
- API routes 3개 전부 `runtime = 'nodejs'` 명시.
- OG image 3개 전부 `runtime = 'edge'` 명시.
- `api/updates`: `revalidate = 900` + `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600` 실측 일치.

### Vercel 배포 상태
- 프로젝트: `sakamichi-hub` under `royaljjongs-projects`.
- 최근 9 프로덕션 배포 전부 **Ready** (last 13h).
- 최신 프로덕션 배포 ID: `dpl_HNFYjXhAGQgqfEzwxCTRxihGdNAv` (커밋 `b8fa857`, rev7).
- Region: `iad1` (Washington DC, Vercel 기본).
- 평균 빌드 시간: 2 min.
- Aliases: `sakamichi-hub.vercel.app`, `sakamichi-hub-royaljjongs-projects.vercel.app`, `sakamichi-hub-git-main-royaljjongs-projects.vercel.app` 3개 활성.
- `vercel logs`: "No logs found" (Hobby 1h retention 정상 상태, 런타임 오류 없음 추정).

### 최근 7 커밋 Vercel 상태
```
b8fa857 (rev7 perf)                 → success
ad87bf4 (auto-sync)                 → success
05bae9c (auto-sync)                 → success
fcf36a3 (auto-sync, rev6 관찰)      → success
09a1abb (rev6 fix videos.ts)        → success
ff56dd9 (rev5 부수)                 → success
38e0608 (rev5 MA-3)                 → success
```
**7 연속 성공**. 이전 rev5 커밋 3개는 오래된 "pending" 상태로 남아 있으나 실제 배포는 이후 성공 커밋이 덮어씀. 무해.

### 라이브 사이트 응답
- 홈 `/` (rewrite → `/ja`): HTTP 200, Content-Length 629KB, X-Nextjs-Prerender:1, X-Vercel-Cache:PRERENDER.
- `/ja`: hreflang `Link` 헤더 3언어 + x-default ✓.
- `/api/updates`: HTTP 200, 13KB JSON, cache-control 정상.
- `/sitemap.xml`: HTTP 200, 750KB.
- `/robots.txt`: HTTP 200, 94 bytes.

---

## 6. 조치 우선순위 제안

| 단계 | 항목 | 예상 이득 | 소요 |
|---|---|---|---|
| A (권장 즉시) | DV-1 error/loading/global-error 3파일 | 사용자 경험 대폭 개선, 디버깅 편의 | 30분 |
| B | DV-2 보안 헤더 (CSP 제외) | 심층 방어, XSS·클릭재킹·referrer 유출 방어 | 15분 |
| C | DV-3 `.env.example` 보강 | 문서 정합 | 2분 |
| D | DV-4 sitemap index | 관찰만, 필요 시 후속 | — |

**바꾸지 않는 범위**: `@vercel/analytics` / `SpeedInsights` 설정, 문의 API 계약, HSTS(Vercel 자동), 캐시 정책(rev4·rev6 확정), middleware 로직, next-intl 라우팅.

---

## 7. 검증 상태 (조치 후)

```
git rev-parse HEAD → 5e71488
pnpm typecheck / data:validate / search:verify / build → 전부 통과 (각 커밋마다 재실행)
Vercel Production 5e71488 → Ready (Monitor bukm0t3s0 확인)
Route count 1,529 (error/loading은 route 추가 안 함)
Middleware 101 kB (변경 없음)
```

### 실측 검증 — 라이브 응답 헤더 (`curl -sI https://sakamichi-hub.vercel.app/ja`)
- `X-Content-Type-Options: nosniff` ✓
- `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `X-Frame-Options: SAMEORIGIN` ✓
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` ✓
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ✓ (Vercel 기본 유지)

4개 신규 헤더 프로덕션 전 페이지 매치 (`source: '/(.*)'` 규칙) 활성.

### Error 경계 파일 배치
- `src/app/[locale]/error.tsx` — Client component, 3언어 하드코딩, `reset()` + Link home, digest 표시.
- `src/app/global-error.tsx` — 루트 자체 `<html><body>`, 인라인 스타일, 3언어 병기.
- `src/app/[locale]/loading.tsx` — Server component, `role="status"` + `aria-live="polite"` 접근성 스피너.

각 파일 브랜드 톤(`#FBF8F3`/`#3A3630`/`#B27B4E`) 준수. 기존 `not-found.tsx` 패턴 상속.

---

## 8. 참고 정책 준수

- feedback_model_role_split: Opus 감사, Sonnet 위임 대기.
- feedback_audit_report_delivery: rev8 파일 저장.
- feedback_audit_technical_accuracy: 응답 헤더·CLI 결과·env 변수 실측 후 기술 판정.

rev1-8 사이클: **17 조치 커밋 · 14 P0-P3 해소 · 1 환경 차단 확정 · 4 신규 개선 후보 (rev8)**.
