# Sakamichi Box — 전면 정합성 감사 보고서 rev4

- 기준일: 2026-09-04
- 이전 rev: [rev1](./AUDIT_REPORT_2026-09-04_rev1.md) · [rev2](./AUDIT_REPORT_2026-09-04_rev2.md) · [rev3](./AUDIT_REPORT_2026-09-04_rev3.md)
- 본 rev의 목적: rev3에서 발견한 N1-N6 중 사용자 승인 5건(N1·N2·N3·N4·N6) 조치 결과. N5는 제품 결정 (a)병합 확정, 실행 보류.

---

## 요약 표

| 항목 | rev3 상태 | rev4 상태 | 근거 커밋 | Vercel |
|---|---|---|---|---|
| N1 daily-updates validate 게이트 | 미조치 | **해소** | `47e3529` | success |
| N2 updates/videos Zod 검증 | 미조치 | **해소** | `fc687c9` | success |
| N3 latest-updates.json 정규화 | 미조치 | **해소** | `fc687c9` | success |
| N4 about/credits metadata | 미조치 | **해소** | `4a8a2e1` | success |
| N5 KLP48↔AKB48 병합 | 미조치 | **보류 (제품 방향 (a) 확정)** | — | — |
| N6 /api/updates runtime | 미조치 | **해소** | `4a8a2e1` | success |

---

## 1. N1 · daily-updates 워크플로 validate 게이트 (커밋 `47e3529`)

### 조치
`.github/workflows/daily-updates.yml`의 fetch 3단계와 auto-commit 사이에 다음 스텝 삽입:
```yaml
      - name: Validate data before commit
        run: pnpm data:validate
```

### 재발 방지 효과
- Fetch가 스키마 위반 데이터를 생성해도 validate에서 워크플로 실패 → auto-commit 스킵 → main에 나쁜 데이터 push 안 됨 → Vercel 빌드 항상 안전.
- 이전 rev1 회귀(HTTP URL → 5회 연속 실패)와 동일한 패턴이 재발할 수 없음.
- 사용자에게 GitHub Actions 워크플로 실패 알림이 발송되지만, Vercel/main은 정상 상태 유지.

### 독립 재검증
```
$ grep -A2 "Validate data before commit" .github/workflows/daily-updates.yml
      - name: Validate data before commit
        run: pnpm data:validate
```

---

## 2. N2 · updates/videos schema Zod 전환 (커밋 `fc687c9`)

### 조치
- `src/lib/updates-schema.ts`: 순수 interface → `z.object({...})`. 필드 강화:
  - `id: Slug` (kebab-case 강제)
  - `title: z.string().min(1).max(200)` + `.refine(v => !/^https?:\/\//.test(v))` (bare URL 거부)
  - `publishedAt: z.string().datetime({ offset: true })` (ISO 8601 강제)
  - `url: HttpsUrl`, `type: z.literal('official_blog')`
- `src/lib/videos-schema.ts`: 동일 패턴, `platform`/`franchise` 등 enum 명시.
- `scripts/validate.ts`에 두 스키마 검증 블록 추가. `RecentUpdates`/`MemberVideos` 배열 safeParse 실패 시 exit 1.

### 독립 재검증
```
$ pnpm data:validate | tail -6
📊 Summary: 16 groups, 454 members.
✅ Updates schema passed: 55 entries.
✅ Videos schema passed: 34 entries.
✅ Discography schema passed: 256 singles across all groups.
⚠️ Duplicate member image (2): [KLP48↔AKB48 3건, N5 유보 항목]
```

---

## 3. N3 · latest-updates.json 데이터 정규화 (커밋 `fc687c9`)

### 조치 (fetch 스크립트 + 일회성 클린업)
- `scripts/fetch/updates.ts`에 `GROUP_PREFIX` 맵, `normalizeUpdate()`, `normalizeAndDedup()` 함수 추가. 최종 `combined` 배열이 `writeFileSync` 이전에 정규화 통과.
- **정규화 규칙**:
  - Title에서 HTML entities (&#x2F; 등) 디코딩 + trim.
  - Title이 bare URL인 항목 제거.
  - PublishedAt 비-ISO 패턴(`2026.9.4 13:49` 등)을 JST 가정 후 UTC ISO로 변환.
  - ID 재생성: `{groupPrefix}-{sha1(url+publishedAt).slice(0,12)}` (deterministic).
  - URL 중복 제거 (최신 publishedAt 유지).
- 일회성 스크립트 `scripts/normalize-updates.ts` (임시)로 현재 `data/latest-updates.json` 클린업 후 스크립트 자체는 커밋에서 제외.

### 실측 변화
- 60 → 55 엔트리 (5건 제거: URL-title 1건, URL 중복 4건).
- ISO 형식: 30/60 → 55/55.
- 중복 ID: 1 → 0.
- Non-slug ID: 15 → 0.
- URL-title: 5 → 0.

### 독립 재검증
```
$ node -e "const u=require('./data/latest-updates.json');
console.log('total=',u.length,'ISO=',u.filter(x=>/^\d{4}-\d{2}-\d{2}T/.test(x.publishedAt)).length,'dupIds=',(()=>{const s=new Set(),d=[];u.forEach(x=>{if(s.has(x.id))d.push(x.id);s.add(x.id);});return d.length;})());"
total= 55 ISO= 55 dupIds= 0
```

### Opus 검토 시 주의사항 (Sonnet 자체 보고 재확인)
- JST → UTC 변환 시 `-9h` 오프셋 가정. 현재 모든 fetch 소스 (nogizaka46, sakurazaka46, hinatazaka46, akb48 계열 ameblo)가 JST 발행이므로 정확. 향후 다른 tz 소스 추가 시 fetch 스크립트에서 tz 명시 처리 필요.
- 새 `id` 규칙(sha1 12자)이 기존 URL-embedded ID와 완전 다른 형태 → 링크 앵커 변경 (이 데이터를 소비하는 UI는 id를 표시하지 않고 title/url만 렌더하므로 사용자 영향 없음).

---

## 4. N4 · about/credits generateMetadata (커밋 `4a8a2e1`)

### 조치
- `src/app/[locale]/about/page.tsx`: 3언어 title/description + `alternates.canonical` + `languages` + `x-default` 세트 추가.
- `src/app/[locale]/credits/page.tsx`: 동일 패턴 (Wikipedia CC BY-SA 4.0 크레디트 명시).
- 홈 default 상속 → 페이지별 고유 title 색인으로 SEO 개선.

### 독립 재검증
```
$ grep "generateMetadata" src/app/\[locale\]/about/page.tsx src/app/\[locale\]/credits/page.tsx
src/app/[locale]/about/page.tsx:11:export async function generateMetadata(...)
src/app/[locale]/credits/page.tsx:10:export async function generateMetadata(...)
```

---

## 5. N6 · /api/updates runtime 명시 (커밋 `4a8a2e1`)

### 조치
`src/app/api/updates/route.ts` 상단에 `export const runtime = 'nodejs';` 추가. `revalidate = 900` 이전에 배치. 다른 inquiry API와 일관.

### 독립 재검증
```
$ head -5 src/app/api/updates/route.ts
import { NextResponse } from 'next/server';
import { getLatestUpdates } from '@/lib/data';

export const runtime = 'nodejs';
```

---

## 6. N5 · KLP48↔AKB48 병합 (보류)

### 사용자 결정
옵션 (a) — 병합: 3인물을 각 1레코드로 통합, `memberships[]`에 KLP48+AKB48 두 항목 `isConcurrent: true` 표시.

### 이번 사이클에서 실행하지 않은 이유
- 사용자가 첫 질문에서 "A+B+C 전부"를 선택 (N5 미포함). 두 번째 질문의 (a) 답변은 "다음 실행 시 방향 확정" 표시로 해석.
- 실행 시 요구되는 부수 작업:
  1. 대상 3레코드 삭제 (KLP48 primary) + 남는 AKB48 primary 레코드의 `memberships` 배열에 KLP48 항목 병합.
  2. `getMembers({ groupId: 'klp48' })`가 새로 구조에서 KLP48 3명을 반환하도록 함수 로직 조정 (concurrent membership 조회).
  3. `/{locale}/m/klp48-*` 3개 정적 라우트 사라짐 → 301 리다이렉트 middleware 규칙 추가 (SEO 회귀 방지).
  4. `search-index.json`, `coverage-report.json` 재생성.
- 작업 규모: 코드 변경 3-5파일 + 리다이렉트 + 검증. 별도 사이클로 계획 권장.

### 다음 실행 시 참고
- Opus 다음 감사 라운드에서 (a) 실행 커밋 계획 준비.
- 사용자 재승인 후 진행.

---

## 7. 최종 상태 스냅숏

```
git rev-parse HEAD        → 4a8a2e13eb2afafbac16391090426b00de2b9c00
git rev-parse origin/main → 4a8a2e13eb2afafbac16391090426b00de2b9c00
git log --oneline -6
  4a8a2e1 chore(seo): add metadata to about/credits + api/updates runtime
  fc687c9 feat(schema): zod-validate updates/videos + normalize latest-updates data
  47e3529 ci(workflow): validate data before auto-commit to prevent regression
  a688531 refactor(audit): drop dead schema/panel, use group.franchise, harden dev route and inquiry auth
  041f825 chore(audit): sync handover counts and use renderable link total
  372d3e5 fix(i18n): add missing search.match keys for en locale
```

### 로컬 검증 (Opus 독립 재실행)
- `pnpm typecheck` → 통과.
- `pnpm data:validate` → 통과. **Updates 55 entries, Videos 34 entries** (신규 스키마 반영). 16그룹·454멤버·59이벤트·256싱글. KLP48 3중복 경고 (N5 보류).
- `pnpm build` → 1,538/1,538 경로.

### 원격 상태 (gh CLI)
- Vercel Production `4a8a2e1` = **success** (Deployment has completed, 2026-09-04T14:47:59Z).
- CI ci.yml on `4a8a2e1` = **success** (1m21s).
- 이전 rev1 실패 커밋 4건 (bc2563d, 7d6df6d, 8ce24fe, 656839d) = failure (역사).

작업 트리 untracked: `.tmp/`, AUDIT_REPORT_2026-09-04_rev1/2/3/4.md.

---

## 8. 자동화 안정성 요약

이제 자동화가 다음 시점에서 각각 안전 게이트를 가짐:
1. **fetch 실행 시**: 스크립트가 정규화 적용 → 애초에 나쁜 데이터 생성 안 됨.
2. **auto-commit 이전**: `pnpm data:validate` 실행 → 스키마 위반 시 워크플로 실패, 커밋 스킵.
3. **push 이후**: Vercel + CI 워크플로 (수동 푸시 시)가 최종 안전망.

N1이 없던 시절: 1단계 실패 → 3단계에서만 실패 발견 → 사용자 알림 후 수동 복구 필요.
N1 이후: 1단계 실패 → 2단계에서 즉시 워크플로 실패 → 사용자 알림 유지되지만 main·Vercel은 항상 클린.

---

## 9. 남은 항목 & 다음 라운드 계획

- **N5 (KLP48 병합)**: 사용자 승인 대기. 실행 시 별도 감사 라운드 rev5로 진행.
- **N6-미조치급 (WORK_ORDER_2026-08-25 line 51/64 "1,536" 명시 부재)**: 역사 문서 수치 표기, 무해. 필요 시 rev5에서 함께.
- **관찰 지속**:
  - 다음 GitHub Actions daily-updates schedule 실행 (6h 주기) 시 새 정규화 스크립트 정상 동작 여부.
  - Auto-sync 커밋의 Vercel 빌드 지속 성공 여부.

---

## 참고 정책 준수 확인

- 모델 역할 분리 (feedback_model_role_split): Opus 감사·계획·재검토, Sonnet 3커밋 코드 조치.
- 감사 보고 파일화 (feedback_audit_report_delivery): 채팅 요약 대신 rev4 파일.
- 기술 정확성 (feedback_audit_technical_accuracy): 원격 상태를 gh CLI로 실제 확인 (assumption 아님). Sonnet의 route count 표현 (64 leaf) vs 실측 (1,538 generated) 차이 재확인 완료.
- 각 조치 커밋 단위 (rev2 방식): 3커밋 (N1 / N2+N3 / N4+N6) 완료.
