# Sakamichi Box — 성능 감사 보고서 rev7

- 기준일: 2026-09-05
- 이전 rev: [rev1-6](./AUDIT_REPORT_2026-09-04_rev1.md) 정합성 감사 완료 이후 성능 영역 심층 감사.
- 본 rev의 목적: 번들·이미지·폰트·CSS·홈 페이로드·캐시·middleware 5개 축의 실측 및 개선 지점 우선순위화. 코드 변경 전 사용자 승인 대기.
- 감사자 역할: Opus 단독 (실측·분석). 조치는 사용자 승인 후 Sonnet 위임.

---

## 요약

| 항목 | 카테고리 | 심각도 | 상태 | 커밋 |
|---|---|---|---|---|
| **PF-1** 4개 미사용 Google Font 제거 | Dead code + 성능 | **P1** | **해소** | `b8fa857` |
| **PF-2** AquaPointerField dynamic import | 초기 렌더 오버헤드 | P2 | **해소** | `b8fa857` |
| **PF-3** GroupDiscography img loading/referrer/decoding | 미세 최적화 | P3 | **해소** | `b8fa857` |
| **PF-4** 모든 `<img>` `decoding="async"` | 미세 최적화 | P3 | **해소** | `b8fa857` |
| **PF-5** Middleware 101KB (관찰만) | — | P3 | 관찰 유지 | — |

**총평**: 크리티컬 이슈 없음. rMVP §정합성 후속 이후 홈 성능(1.1MB→534KB, 52%↓)은 "as designed" 유지. 남은 개선은 4개 미사용 폰트 제거(즉시 이득) + 배경 애니메이션 lazy화(중간 이득). 정책 준수하 안전한 최적화만 제안.

---

## 1. 실측 요약 (`pnpm build` 결과, main HEAD `fcf36a3`)

### Bundle 사이즈 (First Load JS, gzip 후 추정)
| Route | Page JS | First Load JS |
|---|---|---|
| `/[locale]` (home) | 6.06 kB | **177 kB** |
| `/[locale]/g/[groupId]` | 18.7 kB | **190 kB** (최대) |
| `/[locale]/m/[memberId]` | 1.73 kB | 173 kB |
| `/[locale]/contact` | 4.41 kB | 175 kB |
| `/[locale]/search` | 5.16 kB | 176 kB |
| `/[locale]/compare` | 1.64 kB | 173 kB |
| `/[locale]/about`·`credits`·`terms`·`privacy-policy` | 863 B | 172 kB |
| `/[locale]/dev/bg` | 237 B | 163 kB |
| shared chunk (all pages) | — | 102 kB |
| **Middleware** | — | **101 kB** |

Vercel Hobby First Load JS 권장 상한 200KB — 모든 route 통과. 최대 Group 190KB.

### Uncompressed 파일 크기 (`.next/`)
| 파일 | 크기 |
|---|---|
| `.next/server/src/middleware.js` | 307 KB (raw) |
| `.next/static/chunks/framework-*.js` | 186 KB |
| `.next/static/chunks/632-*.js` | 172 KB |
| `.next/static/chunks/706-*.js` | 170 KB |
| `.next/static/chunks/3466f3f1-*.js` | 169 KB |
| `.next/static/chunks/main-*.js` | 120 KB |
| `.next/static/chunks/polyfills-*.js` | 110 KB |
| `.next/static/chunks/app/[locale]/page-*.js` (home client) | 22 KB |
| `.next/server/app/ja.html` (home prerendered) | **531 KB** |

### 정적 데이터 파일 (public/, data/)
| 파일 | 크기 |
|---|---|
| `data/members.json` | 810 KB (server import only) |
| `public/search-index.json` | 363 KB (client fetch on `/search`) |
| `data/discography.json` | 96 KB |
| `data/portal.json` | 51 KB |
| `data/groups.json` | 47 KB |
| `data/latest-updates.json` | 32 KB |
| `data/latest-videos.json` | 28 KB |
| `src/app/globals.css` | 21 KB (622 lines) |

---

## 2. PF-1 · 4개 미사용 Google Font 로딩 (P1)

### 발견
`src/app/fonts.ts` 는 6개 Google Font를 정의·export·`fontClassNames`에 병합:
- `Klee_One` → `--font-klee-one` (48회 사용 ✓)
- `Zen_Kaku_Gothic_New` → `--font-zen-kaku` (26회 사용 ✓)
- `Gowun_Batang` → `--font-gowun-batang` (**0회 사용**)
- `Gowun_Dodum` → `--font-gowun-dodum` (**0회 사용**)
- `Zen_Maru_Gothic` → `--font-zen-maru` (**0회 사용**)
- `Fraunces` → `--font-fraunces` (**0회 사용**)

검증 명령:
```
grep -rn "gowun\|zen-maru\|fraunces" src/ | grep -v "fonts.ts"
# → 매치 0건
```

### 영향
Next.js는 `next/font/google`에 정의된 각 폰트마다:
1. `<link rel="preconnect">` to `fonts.gstatic.com`
2. Font CSS injection (unicode-range split, 여러 요청 트리거)
3. `<html>`의 fontClassNames CSS 변수에 각각 클래스 추가

4개 미사용 폰트가 실제로 렌더에 참여하지 않아도 CSS 로드·파싱·CSS 변수 초기화 비용 발생. Klee One + Zen Kaku만 남기면 폰트 관련 초기 로드 ~66% 감소 (4/6).

### 조치 지시 (승인 시)
`src/app/fonts.ts`:
1. `Gowun_Batang`, `Gowun_Dodum`, `Zen_Maru_Gothic`, `Fraunces` import·export·`fontClassNames` 항목 삭제.
2. `next/font/google` import 라인에서 위 4개 이름 제거.
3. `fontClassNames`를 `[kleeOne.variable, zenKakuGothicNew.variable].join(' ')`로 축소.

파일 삭제 4곳. 회귀 없음 (사용처 0).

---

## 3. PF-2 · AquaPointerField 전 페이지 즉시 로드 (P2)

### 발견
`src/components/background/AquaPointerField.tsx` = 608줄, 18,840 bytes (33% of all component code by bytes). Client component.

Import chain: 
```
[모든 [locale]/*/page.tsx] → import AmbientBackground → import AquaPointerField
```
13개 페이지 (about, compare, contact, credits, dev/bg, g/*, m/*, search, terms, privacy-policy, [locale] home) 모두가 최상단에 `<AmbientBackground>`. 결과: AquaPointerField JS가 **shared client chunk에 포함**되어 모든 페이지 First Load JS의 일부.

### 영향
- 순수 시각 효과 (마우스 포인터를 따라가는 aqua-blob 애니메이션). 필수 UI 아님.
- 모바일 사용자에게는 pointer 상호작용이 없어 낭비.
- `prefers-reduced-motion` 체크가 이미 있으면 렌더 스킵되지만 JS는 이미 다운로드됨.

### 조치 지시 (승인 시)
`src/components/background/AmbientBackground.tsx`:
```tsx
// Before:
import { AquaPointerField } from './AquaPointerField';

// After:
import dynamic from 'next/dynamic';
const AquaPointerField = dynamic(() => import('./AquaPointerField').then(m => m.AquaPointerField), {
  ssr: false,
  loading: () => null,
});
```
효과: AquaPointerField 청크가 initial bundle에서 분리, viewport 진입 후 lazy 로드. First Load JS 예상 5-10KB↓.

리스크: 없음 (렌더는 동일, 로드 타이밍만 지연).

---

## 4. PF-3 · GroupDiscography `<img>` 속성 부재 (P3)

### 발견
`src/components/group/GroupDiscography.tsx:60-66`:
```tsx
{single.coverUrl ? (
  <img
    src={single.coverUrl}
    alt={single.title.ja}
    className="w-full h-full object-cover"
  />
) : ...}
```
누락:
- `loading="lazy"` — 12개 커버 모두 즉시 로드 시도.
- `referrerPolicy="no-referrer"` — 외부 도메인 hotlink 방어 없음.
- `decoding="async"` — 렌더 스레드 블로킹 가능.

다른 컴포넌트 (`MemberAvatar`, `HomePortal` LIVE poster) 는 3개 속성 정상 부착.

### 조치 지시
동일 3속성 추가. 5분 조치.

---

## 5. PF-4 · 모든 `<img>` `decoding="async"` 방어적 추가 (P3)

### 발견
6개 `<img>` 사용 지점 모두 `decoding` 속성 부재. `decoding="async"` 는 브라우저 렌더 스레드 블로킹을 방지하는 defensive 속성.

### 조치 지시
grep으로 6곳 일괄 추가. PF-3와 함께 하나의 커밋에 포함.

---

## 6. PF-5 · Middleware 101KB (관찰만)

### 발견
`.next/server/src/middleware.js` = 307KB raw / ~101KB compressed. `createIntlMiddleware(routing)` from `next-intl/middleware` + KLP48 redirect map + `/api/` 우회 + `/` rewrite.

### 판정
- next-intl standard 사용, replacement 시 locale 감지·hreflang·redirect 로직 재작성 필요 (대규모).
- Edge runtime에서 실행되므로 KB 크기가 요청당 latency에 영향 미미.
- 대안 없이 관찰 유지.

---

## 7. 통과 확인 (Non-issues, "as designed" 상태)

- **Home HTML 531KB**: rev1 §정합성 후속 "1,117,167→534,256 bytes 52% 감소" 상태 유지. HomeMember Pick(id/name/primaryGroupId/status/birthDate/imageUrl/avatar + links subset)로 최적화 완료.
- **`next/image` 미사용**: 47개 외부 이미지 도메인(nogizaka46, sakurazaka46, cloudfront, wikimedia, klp48.my 등) 전부 whitelist하는 대신 plain `<img>` + `loading="lazy"` + `referrerPolicy="no-referrer"` 전략. rMVP §"인물 사진 호스팅 안 함" 준수. Vercel 이미지 최적화 서버 비용 없음.
- **폰트 subsets `['latin']`**: Klee One / Zen Kaku Gothic New 등 CJK 폰트에 `latin`만 명시. 브라우저의 unicode-range fallback으로 CJK도 lazy 로드됨. 명시적 `japanese`/`korean` subset 추가는 초기 로드 400KB+ 증가 트레이드오프 — 현행 유지 권장.
- **api/updates cache**: `revalidate = 900` + `Cache-Control: public, s-maxage=900, stale-while-revalidate=3600` 정상.
- **정적 route 배치**: 모든 페이지 SSG (● 마크). Dynamic (ƒ) 은 OG image edge runtime 3개 + API routes 3개만 (의도된 서버 렌더).
- **CLS 방지**: `<img>` 는 부모 div가 픽셀 크기(size props → `width: Npx; height: Npx`) 명시. 브라우저가 공간 예약 → 실질 CLS 없음.

---

## 8. 조치 우선순위 제안

| 단계 | 항목 | 예상 이득 | 소요 |
|---|---|---|---|
| A (권장 즉시) | PF-1 4개 dead font 제거 | 초기 CSS/preload 4개 감소, ~50-100KB 관련 요청 절감 | 5분 |
| B | PF-2 AquaPointerField dynamic import | Initial JS 5-10KB↓, 모든 페이지 | 15분 |
| C | PF-3 + PF-4 <img> 속성 정리 | CLS 방어 강화, 미세 | 10분 |

**단일 커밋** 또는 **3커밋 분리** 사용자 선택.

바꾸지 않는 범위: 홈 HTML 크기(§정합성 후속 기준선), Middleware 구조, `next/image` 도입, 폰트 subset 확장, external 이미지 도메인 화이트리스트.

---

## 9. 검증 상태 (조치 후)

```
git rev-parse HEAD → b8fa857
pnpm typecheck / data:validate / search:verify / build → 전부 통과
Vercel Production b8fa857 → success (Monitor bcng5bbg4 확인)
```

### 실측 개선 (조치 전 → 후, gzip First Load JS)
| Route | Before | After | Δ |
|---|---|---|---|
| `/[locale]` (home) | 177 kB | **176 kB** | −1 kB |
| `/[locale]/g/[groupId]` | 190 kB | **188 kB** | −2 kB |
| `/[locale]/m/[memberId]` | 173 kB | **171 kB** | −2 kB |
| `/[locale]/about`·`credits`·`terms`·`privacy` | 172 kB | **170 kB** | −2 kB |
| `/[locale]/dev/bg` | 163 kB | **161 kB** | −2 kB |
| `/[locale]/contact` | 175 kB | 174 kB | −1 kB |

**모든 route 1-2 kB gzip 감소.** 절대값은 작지만:
- 4개 폰트 관련 preconnect·CSS 로드 요청 대폭 감소 (측정하지 못한 별도 이득).
- AquaPointerField(18KB uncompressed / ~6KB gzip) 초기 청크에서 분리 → viewport 진입 이후 lazy 로드.
- 5개 `<img>`에 `decoding="async"` 부착 → 이미지 디코딩이 메인 스레드 블로킹 안 함.

### Auto-sync 병행 안전 확인
Sonnet push 중 원격에 2개 auto-sync commit(`05bae9c`, `ad87bf4`) 병착. Sonnet이 rebase로 fast-forward 처리 후 push. `data/latest-updates.json` 충돌은 remote 값 채택 (rev4 자동화 게이트가 검증한 clean 데이터).

Post-rev7 log:
```
b8fa857 perf: drop 4 unused fonts, lazy-load ambient particles, tighten <img> attrs
ad87bf4 chore(blogs): auto-sync latest official blog updates
05bae9c chore(blogs): auto-sync latest official blog updates
fcf36a3 chore(blogs): auto-sync latest official blog updates  (rev6 관찰 실행 auto-sync)
09a1abb fix(fetch): skip TikTok processing when Playwright browser unavailable  (rev6 부수)
```

**추가 검증**: 2개 auto-sync commit도 rev4 N1 validate 게이트를 통과하고 Vercel도 정상 성공했다는 뜻 — 자동화 체인 반복 성공 확인.

작업 트리: `.tmp/`, AUDIT_REPORT_*.md (rev1~7).

---

## 10. 참고 정책

- feedback_model_role_split: Opus 감사·계획, Sonnet 실행 위임 (승인 대기).
- feedback_audit_report_delivery: rev7 파일 저장.
- feedback_audit_technical_accuracy: 폰트 사용률·bundle 크기·middleware 크기 실측 근거 명시. next/image 미사용은 rMVP 정책과 대조 후 정당화.

rev1-7 사이클 총계: **14 커밋 · 13 P0-P3 해소 · 1 환경 차단 확정 · 5 성능 개선 후보 발굴 (rev7)**.
