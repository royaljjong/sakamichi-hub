# Sakamichi Box — 후속 발견 해소 rev11

- 기준일: 2026-09-06
- 이전 rev: [rev1-10](./AUDIT_REPORT_2026-09-04_rev1.md) 정합성·성능·자동화·보안 감사 완료.
- 본 rev의 목적: rev10 이후 프로덕션 실측 sanity 검사에서 발견된 SEO soft 404 이슈 해소 + next-intl CVE 재평가.

---

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **NEW-1** Soft 404 (unknown member/group/gen → HTTP 200) | SEO | **P1** | **해소** (2커밋) | `723910c` + `e44081e` |
| **NEW-2** Orphan branches (codex/trust-data-phase2 + chore/link-report-update) | 위생 | P3 | 사용자 미승인, 관찰 유지 | — |
| **RV-1 next-intl CVE (v3)** | 보안 (재평가) | **P3 downgrade** (P1→P3) | 관찰, exploit 근거 없음 | — |

### rev10 조치 회귀 확인 (24시간 후)
- Vercel 배포 이후 자동화 자동 sync 2회 실행 (`4da6ca5`, `e5afeaf`) 모두 성공.
- RV-2 link-check.yml git-auto-commit 첫 실전 auto-commit (`2aee9fb`) 정상.
- RV-1 postcss overrides 유지 (audit `7 → 3` 상태 유지).
- RV-6 병렬화 3분 19초 성능 유지.

---

## 1. NEW-1 · Soft 404 SEO 이슈 (2커밋 해소)

### 발견
프로덕션 sanity 검사 (`curl`) 결과:
```
/ja/m/nonexistent-xyz     → HTTP 200  ← 잘못 (404 예상)
/ja/g/nonexistent-xyz     → HTTP 200  ← 잘못
/ja/g/nogizaka46/gen/nonexistent → HTTP 200  ← 잘못
```

### 근본 원인
1. `src/app/not-found.tsx`가 루트 레벨에 자체 `<html>` 포함 → nested `[locale]` route에서 `notFound()` 호출 시 layout 컨텍스트 없이 렌더.
2. Next.js가 unknown params를 **prerender**로 처리 → `X-Nextjs-Prerender: 1` 응답 헤더 + HTTP 200 상태.
3. Body는 not-found 렌더링되지만 상태 코드가 200 → Google Search Console **soft 404** 플래그 대상.

### 조치 1 (커밋 `723910c`)
`src/app/[locale]/not-found.tsx` 신규 파일. `'use client'` + `useLocale()` from `next-intl` + 3언어 하드코딩 (ja/ko/en) copy. `<html>`/`<body>` 없이 [locale]/layout.tsx 안에서 렌더.

**결과**: Body는 정확히 렌더링됐으나 HTTP 여전히 200 (Next.js prerender 지속).

### 조치 2 (커밋 `e44081e`)
4개 dynamic route 파일에 `export const dynamicParams = false;` 추가:
- `src/app/[locale]/m/[memberId]/page.tsx`
- `src/app/[locale]/g/[groupId]/page.tsx`
- `src/app/[locale]/g/[groupId]/gen/[genId]/page.tsx`
- `src/app/[locale]/g/[groupId]/archive/page.tsx`

효과: generateStaticParams가 반환한 param만 렌더, 그 외 param → Next.js가 즉시 404 응답 (prerender 안 함) + [locale]/not-found.tsx를 body로 사용.

### 실측 검증 (배포 후)
```
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/m/nonexistent-xyz'   → HTTP 404 ✓
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/g/nonexistent-xyz'   → HTTP 404 ✓
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/g/nogizaka46/gen/nonexistent' → HTTP 404 ✓
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/g/nogizaka46/archive'       → HTTP 404 ✓ (nogi는 archive 없음, 올바름)

회귀 없음:
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/m/nogi-yada-moeka'    → HTTP 200 ✓
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/g/nogizaka46'         → HTTP 200 ✓
$ curl -sI 'https://sakamichi-hub.vercel.app/ja/m/klp48-gyouten-yurina' → HTTP 301 ✓ (rev5 redirect)
```

### SEO 영향
- Google Search Console `soft 404` 플래그 예방.
- 검색엔진 크롤러가 unknown URL을 valid로 오분류하지 않음.
- 스팸 공격자가 무작위 member/group URL로 SEO 오염 시도 시 즉시 404 응답 (색인 안 됨).

---

## 2. RV-1 next-intl CVE 재평가 · P1 → P3 downgrade

### GHSA-4c35-wcg5-mm9h 상세 (WebFetch)
- **Severity**: Moderate (CVSS 4.2)
- **Vulnerable**: `next-intl <=4.9.1`
- **Patched**: `4.9.2`
- **Type**: Prototype pollution via `setNestedProperty`
- **Exploit vector**: 
  1. 공격자가 악성 JSON translation catalog에 `"__proto__"` top-level 키 삽입
  2. Next.js 플러그인이 `experimental.messages.precompile: true` 옵션과 함께 처리
  3. `setNestedProperty`가 `Object.prototype` 오염 허용

### 프로젝트 노출 평가
```
$ cat src/i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  ...
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- **`experimental.messages.precompile` 설정 없음** (표준 `getRequestConfig` 사용).
- Translation JSON (`messages/{ja,ko,en}.json`)은 저장소 owner 관리.
- 공격자가 exploit하려면:
  1. `messages/` 폴더에 `__proto__` 키 포함 JSON 커밋 (저장소 write 권한 필요)
  2. AND `precompile: true` 옵션 활성화

**실질 exploitability**: **0** (전제 조건 미충족).

### 결정
next-intl v3 → v4 major migration은:
- API 대량 변경 (Link, useRouter, middleware 시그니처)
- 회귀 위험 중~높음
- 실질 보안 이득 0

→ **P1에서 P3로 downgrade**. 다른 이유(RV-4 major deps outdated)로 v4 마이그레이션 시 자연 해소. 별도 우선순위 아님.

---

## 3. NEW-2 · Orphan Branches (미조치)

### 발견
```
$ git branch -r
  origin/HEAD -> origin/main
  origin/chore/link-report-update    ← 폐기 (RV-2 workflow 개편 이전 잔존)
  origin/codex/trust-data-phase2     ← 폐기 (rev2에서 main에 병합 완료 2026-09-04)
  origin/main
```

### 판정
- `codex/trust-data-phase2`: rev2 커밋 `6665464`로 main 병합 완료. Git 히스토리에는 이미 반영, 브랜치 자체는 tag처럼 남아 있음.
- `chore/link-report-update`: 옛 link-check.yml (peter-evans/create-pull-request v6)이 매주 생성. RV-2 조치로 워크플로 변경 후 더 이상 갱신 안 됨.

### 상태
사용자가 승인 미선택. **삭제는 파괴적 액션**이므로 명시 승인 필요. 삭제 명령: `git push --delete origin <branch>`. 향후 사이클에서 다룸.

---

## 4. 검증 상태 (rev11 시점)

```
git rev-parse HEAD        → e44081e (dynamicParams=false 커밋)
git rev-parse origin/main → e44081e
Vercel Production e44081e → success
로컬 pnpm typecheck/data:validate/search:verify/build → 전부 통과 (1,529 routes 유지)
```

### 라이브 sanity 최종
- 200/301/404 응답 코드 모두 올바르게 반환.
- CSP Report-Only 헤더 유지.
- Security headers 5종 유지.
- Middleware KLP48 redirect 유지.

---

## 5. rev1-11 최종 총괄

| rev | 성격 | 커밋 |
|---|---|---|
| rev1 | 초기 감사 (8건 P0-P3) | 0 |
| rev2 | rev1 해소 + Vercel 복구 | 4 |
| rev3 | 심층 감사 (6 신규) | 0 |
| rev4 | rev3 5건 해소 | 3 |
| rev5 | 멤버 계정 (7건) | 6 |
| rev6 | videos.ts fast-skip + 관찰 종결 | 1 |
| rev7 | 성능 (4건) | 1 |
| rev8 | 오류 boundary + 보안 헤더 (3건) | 3 |
| rev9 | CSP Report-Only + 잔여 종결 | 1 |
| rev10 | postcss + link-check 워크플로 + 병렬화 (RV-1/2/6) | 4 |
| rev11 | SEO soft 404 (2커밋) + CVE 재평가 | 2 |

- **총 25 조치 커밋** (rev1-11 실제 코드 변경)
- **33 P0-P3 해소** (rev1 8 + rev3 5 + rev5 7 + rev7 4 + rev8 3 + rev9 1 + rev10 4 + rev11 1)
- **3 공식 종결** (NMB48/STU48 · PF-5 middleware · DV-4 sitemap) + **1 downgrade** (RV-1 next-intl P1→P3)

### 자동화 4중 방어 체인 (실전 반복 검증)
1. Fetch 정규화 (rev4 N3)
2. Auto-commit validate 게이트 (rev4 N1)
3. CI + Vercel (Preview → Production 자동 배포)
4. Link-check 병렬화 + validate (rev10 RV-6)

### 5중 보안 계층
1. HSTS (Vercel 자동)
2. X-Content-Type-Options / Referrer-Policy / X-Frame-Options / Permissions-Policy (rev8)
3. CSP Report-Only 12지시자 (rev9)
4. 문의 API 3중 방어 (rev2)
5. Supabase Bearer defensive (rev2)

### SEO 완전성 (rev11 신규)
- 알려진 URL: 200 (SSG prerender)
- 알려진 리다이렉트: 301 (middleware)
- **알려진 없는 URL: 404** (rev11 dynamicParams=false)
- hreflang: 3언어 alternate Link 헤더
- CSP + security headers 전 페이지

### 관찰만 유지 (외부 조건 대기)
- NMB48/STU48 44명 프로필 부재 (네트워크·팬클럽 벽)
- Middleware 101KB (next-intl core)
- Sitemap 750KB (Google 상한 50MB 미달)
- CSP enforce 승격 (Report-Only 위반 관찰 후 결정)
- Orphan branches (파괴적 액션, 사용자 승인 대기)
- next-intl v3 CVE (exploit 근거 없음, major migration 시 자연 해소)
- 유닛 테스트 부재 (RV-3, 대규모 스코프)
- React.memo 미사용 (성능 측정 이슈 없음)

---

## 참고 정책 준수

- feedback_model_role_split: Opus 감사·설계, Sonnet 2커밋 위임.
- feedback_audit_report_delivery: rev11 파일 저장.
- feedback_audit_technical_accuracy: curl 실측·CVE 원문 확인 후 판정.

**rev11로 Sakamichi Box SEO 정합성 감사 완전 마감.**
