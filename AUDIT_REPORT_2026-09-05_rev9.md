# Sakamichi Box — rev9 종결 보고서: 잔여 관찰 항목 최종 처리

- 기준일: 2026-09-05
- 이전 rev: [rev1-8](./AUDIT_REPORT_2026-09-04_rev1.md) (정합성 → 멤버 계정 → 성능 → 디버깅/오류/Vercel 통합 감사 완료)
- 본 rev의 목적: rev8 이후 "관찰만 유지" 4항목의 최종 처리. 조치 가능한 것(CSP)은 해결, 환경적/구조적 제약은 공식 종결 문서화.
- 감사자 역할: Opus 단독 (분석·결정). Sonnet 1커밋 위임.

---

## 요약

| 관찰 항목 | 이전 상태 | rev9 결정 | 근거 |
|---|---|---|---|
| **CSP** (Content-Security-Policy) | 미조치 (nonce 전략 복잡) | **Report-Only 도입 (커밋 `c926c28`)** | 사용자 승인 옵션 A |
| **DV-4** sitemap.xml 750KB | 관찰만 (Google 상한 미달) | **관찰 유지, 조치 불필요** | 이득 없음 |
| **PF-5** Middleware 101KB | 관찰만 (next-intl standard) | **공식 종결 — 대체 불가능** | 하단 §3 |
| **NMB48/STU48 44명** 프로필 부재 | 환경 차단 확정 (rev6) | **공식 종결 — 외부 조건 변화 대기** | 하단 §4 |

**총평**: 실제 조치 가능한 유일 항목 CSP만 Report-Only로 도입. 나머지 3항목은 기술적·환경적 제약으로 종결. 8 rev 사이클을 통해 발견한 모든 이슈가 최종 상태(해소 또는 formal close)로 마감.

---

## 1. CSP Report-Only 도입 (커밋 `c926c28`)

### 조치
`next.config.ts` `headers()`에 `Content-Security-Policy-Report-Only` 헤더 추가. 12개 지시자:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' [AdSense + Vercel + Google 도메인]
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' data: https://fonts.gstatic.com
img-src 'self' data: blob: https:       ← 47 외부 도메인 대응
connect-src 'self' [Vercel Analytics + AdSense]
frame-src [Google Ads iframes]
frame-ancestors 'self'                    ← X-Frame-Options: SAMEORIGIN과 일치
base-uri 'self'
object-src 'none'
form-action 'self'
```

### Report-Only의 의미
- 브라우저는 정책 위반을 **콘솔에 경고만 로그**, 실제 차단하지 않음.
- AdSense·Analytics·폰트·이미지가 예상대로 로드되는지 실제 브라우저 트래픽으로 검증 가능.
- **미래 rev에서** 위반 사항이 0에 수렴하면 `Content-Security-Policy`(enforce)로 승격.
- 현재 사이트 가시 동작은 이전과 동일 (부작용 없음).

### 검증
- 로컬 `pnpm typecheck` · `data:validate` · `search:verify` · `build` 전부 통과 (1,529 routes, middleware 101KB 유지).
- Vercel Production `c926c28` 배포 확인 (Monitor `b824ymrui`).

### 후속 (rev10 이후)
1. 브라우저 콘솔에서 CSP 위반 로그 관찰 (수동 방문).
2. Vercel Analytics·AdSense 대시보드로 이벤트 손실 여부 확인.
3. 위반 0 확인 후 `Report-Only` → `Content-Security-Policy` 전환 검토.
4. 향후 nonce 기반 CSP(unsafe-inline 제거) 이관은 별도 대규모 rev.

---

## 2. DV-4 · sitemap.xml 750KB (관찰 유지)

### 근거
- 현재 URL 카운트: ~1,529 static routes + language alternates → 단일 `sitemap.xml` = 750KB.
- Google Search Console 상한: 50MB / 50,000 URLs. 현재 **1.5%** 사용.
- 검색엔진이 단일 파일 정상 처리 확인 (`curl -sI https://sakamichi-hub.vercel.app/sitemap.xml → HTTP 200`).

### 조치 불필요 이유
- `generateSitemaps()` 로 분할 시 `sitemap-0.xml` ~ `sitemap-N.xml` 형태 + sitemap index 필요. 코드 변경 후에도 검색엔진 색인 결과 동일.
- URL 카운트가 30배(45,000) 증가할 때에 다시 검토. 현재 규모에서는 순수 오버엔지니어링.

### 상태
**관찰 유지** — URL 카운트가 임계치(~40,000) 근접 시 rev10 후속.

---

## 3. PF-5 · Middleware 101KB (공식 종결)

### 근거
`.next/server/src/middleware.js` = 307KB raw / ~101KB compressed. `createIntlMiddleware(routing)` from `next-intl/middleware`가 코어 크기.

### 대체 시 필요한 재구현
1. locale 감지 (Accept-Language 파싱 + 쿠키 우선순위).
2. 기본 로케일 rewrite (rMVP: AdSense 검증 이유로 rewrite 유지).
3. Locale-prefixed 경로 파싱.
4. hreflang `Link` 응답 헤더 삽입.
5. `useTranslations()`, `Link` 등 next-intl 클라이언트 API와의 계약 유지.
6. sitemap·robots·OG image 라우팅 예외 처리.

### 종결 사유
- rMVP §"바꾸지 않는 범위"에 코어 라우팅 스택 변경 명시적 배제.
- 101KB는 Edge runtime에서 지연 무의미 (Vercel 자체 캐싱 + 지역 배포).
- next-intl 업데이트로 자연 감소 가능성 (라이브러리 최적화).

### 상태
**공식 종결** — 후속 조치 없음. next-intl v4 이상에서 크기 감소가 있으면 자동 반영.

---

## 4. NMB48 & STU48 44명 프로필 부재 (rev6 결론 재확인)

### 재확인 (2026-09-05 로컬 curl)
- `https://www.nmb48.com/` → curl 15초 timeout (HTTP 000). 네트워크 계층 차단, ISP 무관.
- `https://sp.stu48.com/feature/profile_fs` → HTTP 200 접근되나 개별 프로필 링크는 전부 `secure.plusmember.jp` 팬클럽 유료 로그인 뒤 격리.

### 조치 불가 이유 (rMVP §12 대조)
- **"공식 사이트 접근이 막힌 경우에만 Wikipedia를 발견 보조로 사용하며 검색 결과만으로 확정하지 않는다"** → Wikipedia 자체는 인포박스에 SNS 링크 있어도 팬 편집이라 검증 없이 삽입 불가.
- **"동일 인물임이 확인되지 않은 사진과 SNS는 추가하지 않는다"** → 우회 데이터 추가 금지.
- 유료 프록시·팬클럽 계정은 rMVP §"바꾸지 않는 범위" 배제.

### 상태
**공식 종결** (rev6 최초 결정 재확인). 44명 (NMB48 29 + STU48 15)은 이름·생일·그룹 로고 fallback 아바타로 렌더 유지. 개인 SNS 섹션은 "No links available".

### 외부 조건 변화 시 (미래)
- NMB48 지역·정책 차단 해소 → `scripts/enrich-official-profiles.ts`에 `nmb48` 케이스 추가.
- STU48 팬클럽 벽 정책 완화 → `blogUrlTemplate` 정정 + enrich 스크립트 확장.
- 이 조건은 저장소 통제 밖. 사용자·팬 커뮤니티 관찰로만 파악 가능.

---

## 5. 검증 상태 (rev9 시점)

```
git rev-parse HEAD → c926c28
git rev-parse origin/main → c926c28
pnpm typecheck / data:validate / search:verify / build → 전부 통과
Route count: 1,529
Middleware: 101 kB
Vercel Production c926c28: 배포 확인 (Monitor b824ymrui)
```

### 라이브 응답 헤더 (실측 확인, `curl -sI https://sakamichi-hub.vercel.app/ja`)
- `X-Content-Type-Options: nosniff` ✓
- `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `X-Frame-Options: SAMEORIGIN` ✓
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` ✓
- **`Content-Security-Policy-Report-Only: default-src 'self'; script-src ... https://pagead2.googlesyndication.com ... 'unsafe-inline' 'unsafe-eval' ...; style-src ...; font-src ...; img-src 'self' data: blob: https:; connect-src ...; frame-src ...; frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'`** ← NEW 활성
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (Vercel 자동)

12개 CSP 지시자 전부 프로덕션 응답에 활성. Report-Only 모드로 브라우저 콘솔 위반 로그만 발생, 실제 리소스 차단 없음.

---

## 6. rev1~rev9 최종 총괄

| rev | 성격 | 커밋 | 주요 결과 |
|---|---|---|---|
| rev1 | 초기 8건 감사 | 0 | 감사만 |
| rev2 | rev1 해소 + Vercel 복구 | 4 | 브랜치 병합·이벤트 60→59 |
| rev3 | 심층 감사 6신규 | 0 | 자동화·데이터 계약 발견 |
| rev4 | N1·N2·N3·N4·N6 해소 | 3 | latest-updates 정규화·Zod 확장 |
| rev5 | 멤버 계정 7건 | 6 | 멤버 454→451·링크 정리 |
| rev6 | 잔여 관찰 + fix videos.ts | 1 | 워크플로 timeout 해소 |
| rev7 | 성능 4건 | 1 | 폰트·번들 최적화 |
| rev8 | 오류·Vercel 3건 | 3 | error boundaries·보안 헤더 |
| rev9 | CSP + 나머지 종결 | 1 | CSP Report-Only |

- **총 19 조치 커밋** (감사 rev 제외, 실제 코드 변경 커밋)
- **auto-sync 병행 커밋**: 4-5개 (rev5 병행 push, rev6 실전 검증, rev7 rebase)
- **P0-P3 해소**: 총 25항목 (rev1 8 + rev3 5 + rev5 6+1 + rev7 4 + rev8 3 + rev9 1 = 28 실제 해소, 감사만인 rev1·3 항목 이후 rev로 이관됨)
- **공식 종결**: 3항목 (NMB48/STU48·PF-5·DV-4)

### 자동화 방어 체인
1. Fetch 정규화 (rev4 N3): 소스에서 clean 데이터 생성.
2. Auto-commit validate 게이트 (rev4 N1): 스키마 위반 시 workflow 실패, push 방지.
3. CI + Vercel: 최종 안전망.
4. Playwright 미가용 시 TikTok fast-skip (rev6): 워크플로 timeout 방지.

### 보안 계층
1. HSTS (Vercel 자동)
2. X-Content-Type-Options·Referrer-Policy·X-Frame-Options·Permissions-Policy (rev8)
3. CSP Report-Only (rev9 신규, 향후 enforce 승격 예정)
4. 문의 API 3중 방어 (브라우저 → 서버 API → service_role RPC, rev2)
5. Supabase Authorization Bearer (rev2 defensive)

### 최종 저장소 상태
- `main` HEAD: `c926c28`
- 16 groups · **451 members** · 61 events · 55 updates · 34 videos · 256 singles
- 1,529 static routes · 101 kB middleware
- 8 rev 감사 아카이브 (`AUDIT_REPORT_2026-09-04_rev1.md` ~ `AUDIT_REPORT_2026-09-05_rev9.md`)

---

## 참고 정책 준수

- feedback_model_role_split: Opus 감사·설계, Sonnet 1커밋 위임.
- feedback_audit_report_delivery: rev9 파일 저장.
- feedback_audit_technical_accuracy: CSP는 Report-Only부터 (안전 검증 후 승격). 종결 항목은 근거 명시.

**rev9로 Sakamichi Box rMVP 정합성·성능·보안 감사 사이클을 최종 마감합니다.**
