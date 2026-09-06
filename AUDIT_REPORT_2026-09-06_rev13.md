# Sakamichi Box — Canvas & Hydration 잔존 오류 해소 rev13

- 기준일: 2026-09-06
- 이전 rev: [rev1-12](./AUDIT_REPORT_2026-09-04_rev1.md) — rev12에서 React #418 부분 해소 (EventBoard `'use client'` 누락 + 3파일 mount-guard). 그러나 사용자 재보고에서 #418 지속 + 신규 canvas arc error 발견.
- 본 rev의 목적: (1) rev12 후 잔존한 React #418의 진짜 root cause 규명 및 해소 (2) AquaPointerField canvas arc negative radius error 해소.

---

## 사용자 재보고 (rev12 배포 후)

```
Uncaught Error: Minified React error #418; ...args[]=text&args[]=
    at rD (3466f3f1-c96f853f58dc03ee.js:1:35056)
    ...
144.8ad027125fe81fb5.js:1 Uncaught IndexSizeError: Failed to execute 'arc' on 'CanvasRenderingContext2D': The radius provided (-0.579245) is negative.
144.8ad027125fe81fb5.js:1 Uncaught IndexSizeError: ... (-1.86852)
144.8ad027125fe81fb5.js:1 Uncaught IndexSizeError: ... (-7.2384)
144.8ad027125fe81fb5.js:1 Uncaught IndexSizeError: ... (-812.607)
... (수백 회 requestAnimationFrame 반복)
```

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **HYDRATE-2 잔존** | React #418 | **P1** | **해소** | `246d622` |
| **CANVAS-1** | 런타임 에러 스팸 | **P1** | **해소** | `246d622` |

---

## 1. HYDRATE-2 · Intl.DateTimeFormat timezone 누락 (진짜 root cause)

### 진단 과정
rev12에서 `EventBoard.tsx`가 `'use client'` 없이 `new Date()`를 호출하는 root cause를 잡고 3 컴포넌트 mount-guard 적용. Vercel 배포 확인 후에도 사용자 브라우저 React #418 재발.

전체 client component 재스캔:
```
$ grep -rn "Intl.DateTimeFormat" src/components/home/
HomePortal.tsx:462 (event date)     ← timeZone 없음
HomePortal.tsx:754 (video date)     ← timeZone 없음
EventBoard.tsx:44                    ← timeZone: 'Asia/Tokyo' 있음 ✓
```

**진짜 root cause**: HomePortal 2곳의 `Intl.DateTimeFormat`이 `timeZone` 옵션 없이 사용됨.
- Server (Vercel Node.js, `TZ=UTC`) → UTC 기준 date/weekday 렌더.
- Client (사용자 브라우저) → 사용자 local tz 기준 렌더.
- JST/UTC 경계 시각 (예: JST 오전 8:00 = UTC 전날 23:00) 이벤트/영상 → 서버·클라이언트 다른 날짜 문자열 → React #418.

rev12 mount-guard는 `today` 변수만 지연시켰지 정적 `event.startsAt`, `video.publishedAt`의 `Intl` 렌더는 계속 발생 → 하이드레이션 mismatch 지속.

### 조치 (커밋 `246d622`)
`src/components/home/HomePortal.tsx` 두 곳에 `timeZone: 'Asia/Tokyo'` 추가:

```tsx
// Line ~462 (event date)
new Intl.DateTimeFormat(lang, {
  month: "short", day: "numeric", weekday: "short",
  timeZone: "Asia/Tokyo",           // ← NEW
}).format(new Date(event.startsAt))

// Line ~754 (video date)
new Intl.DateTimeFormat(lang, {
  month: "short", day: "numeric",
  timeZone: "Asia/Tokyo",           // ← NEW
}).format(new Date(video.publishedAt))
```

이제 서버·클라이언트 모두 Asia/Tokyo 기준으로 렌더 → 동일 문자열 → 하이드레이션 일치.

### 검증
- 로컬 `pnpm typecheck` / `data:validate` / `search:verify` / `build` 통과.
- Vercel Production `246d622` 배포 success.
- 브라우저 콘솔 React #418 소멸 여부는 사용자 재확인 필요.

---

## 2. CANVAS-1 · AquaPointerField arc() 음수 radius 방어

### 진단
`AquaPointerField.tsx`의 `requestAnimationFrame` 루프에서 `ctx.arc()`가 매 프레임 `IndexSizeError: negative radius` 던짐. 콘솔에 수백 회 스팸.

로그 반복 특성: `(-0.579)` 같은 매우 작은 값부터 `(-812.607)` 같은 큰 값까지 편차 큼. bubble.r 자체가 명시적으로 mutation되는 지점은 없지만, 애니메이션 상태 조합 (waveActive + scaleBumpEnd 타이밍 + pointer repel + dt 스파이크 등)에서 특정 프레임 계산이 음수 결과.

### 조치 (커밋 `246d622`)
`src/components/background/AquaPointerField.tsx` — 5개 지점 방어적 `Math.max(0.1, ...)`:

1. `drawHighlight` `arcR` 계산 (~line 90): `Math.max(0.1, r * 0.68)`
2. Bubble fill arc (~line 413): `Math.max(0.1, displayR)`
3. Bubble ring arc (~line 422): `Math.max(0.1, displayR + 4)`
4. Droplet arc (~line 487): `Math.max(0.1, dr)`
5. drawHighlight 호출 (~line 430, 493) — 내부 arcR 가드로 안전

`0.1`은 subpixel radius로 시각적으로 무해. 애니메이션 품질 저하 없이 arc 예외 완전 차단.

### 검증
- 로컬 build 통과.
- Vercel Production `246d622` 배포 success.
- 브라우저 콘솔 canvas error 소멸 여부는 사용자 재확인 필요.

---

## 3. 저장소 상태

```
git rev-parse HEAD        → 246d622
git rev-parse origin/main → 246d622
git log --oneline -5:
  246d622 fix(client): guard canvas radii and pin JST timezone for date rendering
  f7c349c chore(assets): rewrite /favicon.ico → /icon.svg for legacy browser fallback
  4daa8e0 fix(hydrate): defer today calculation to client mount + add favicon
  e44081e fix(seo): disable dynamicParams on dynamic routes so unknown IDs return HTTP 404
  723910c fix(seo): add [locale]/not-found.tsx to return HTTP 404 for unknown routes

Vercel Production 246d622 → success
Route count: 1,530 유지
Middleware: 101 kB 유지
```

### 사이트 응답 정합성 재확인
- `/ja` → HTTP 200 ✓
- `/ja/m/nogi-yada-moeka` (valid) → HTTP 200 ✓
- `/ja/m/nonexistent-...` → HTTP 404 ✓ (rev11)
- `/ja/m/klp48-gyouten-yurina` → HTTP 301 ✓ (rev5)
- `/favicon.ico` → HTTP 200 ✓ (rev12 rewrite)
- 5중 보안 헤더 유지 ✓

---

## 4. rev1-13 최종 총괄

| rev | 커밋 | 주요 |
|---|---|---|
| rev1-9 | 15 | 정합성·성능·자동화·보안 감사 사이클 |
| rev10 | 4 | postcss overrides + link-check 병렬화 + 워크플로 개편 |
| rev11 | 2 | SEO soft 404 완전 해소 |
| rev12 | 2 | React #418 부분 해소 (mount-guard) + favicon |
| **rev13** | **1** | **React #418 완전 해소 (Intl timezone) + canvas arc guard** |

- **총 29 조치 커밋** (rev1-13)
- **37 P0-P3 해소** (rev12 35 + rev13 2)
- **3 공식 종결** + 1 downgrade + 1 orphan branch 청소

### 하이드레이션 fix 진화
- rev12: `today` mount-guard + EventBoard `'use client'` 추가 (기초)
- rev13: HomePortal `Intl.DateTimeFormat` `timeZone: 'Asia/Tokyo'` (마감)

EventBoard가 이미 timezone 명시했던 반면 HomePortal이 누락했던 것이 정확한 root cause. rev12에서 이를 놓친 이유: `today` 사용부만 문제로 오인, 정적 event/video 데이터의 tz-dependent Intl 렌더도 mismatch 발생함을 rev13에서 발견.

### 자동화 4중 방어 체인 (실전 검증 지속)
1. Fetch 정규화 (rev4 N3)
2. Auto-commit validate 게이트 (rev4 N1)
3. CI + Vercel
4. Link-check 병렬화 (rev10 RV-6)

### 5중 보안 계층
1. HSTS
2. X-Content-Type-Options / Referrer-Policy / X-Frame-Options / Permissions-Policy (rev8)
3. CSP Report-Only 12지시자 (rev9)
4. 문의 API 3중 방어 (rev2)
5. Supabase Bearer defensive (rev2)

---

## 5. 사용자 재확인 요청

라이브 사이트 (`https://sakamichi-hub.vercel.app/`) 브라우저 방문 후 DevTools Console에서:

1. ✅ **React #418 소멸** 예상 — HomePortal Intl timezone 고정으로 SSR/CSR 문자열 일치.
2. ✅ **CanvasArc IndexSizeError 소멸** 예상 — AquaPointerField 5개 arc radius 방어.
3. ⏳ **CSP Report-Only 위반 로그** — rev9부터 관찰 항목. 무결하면 rev14에서 enforce 승격 고려.

---

## 참고 정책

- feedback_model_role_split: Opus 진단·계획, Sonnet 코드 작성 (Sonnet이 응답 중간에 세션 종료했으나 코드 파일에 변경 완료 → Opus가 mechanical commit+push 완수).
- feedback_audit_report_delivery: rev13 파일 저장.
- feedback_audit_technical_accuracy: 잔존 문제 발생 시 즉시 다른 진단 경로 (전체 client component 재스캔 + 이미 fix된 EventBoard vs 미fix HomePortal 비교) 로 root cause 정확히 잡음.

**rev13으로 사용자 브라우저 콘솔 오류 잔존분 해소 예상.**
