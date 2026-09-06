# Sakamichi Box — 전면 정합성 감사 보고서 rev2 (해소 기록)

- 기준일: 2026-09-04
- 이전 rev: [AUDIT_REPORT_2026-09-04_rev1.md](./AUDIT_REPORT_2026-09-04_rev1.md) (감사 항목·근거)
- 본 rev의 목적: rev1에서 발견한 P0-P3 8건과 Vercel main 빌드 실패의 실제 조치 결과와 독립 재검증 요약.
- 감사자 역할: Opus (설계·검토). 실제 코드 수정은 Sonnet subagent가 수행.

---

## 요약 표

| 항목 | rev1 상태 | rev2 상태 | 근거 커밋 |
|---|---|---|---|
| Vercel main 빌드 실패 (7d6df6d 이후) | 진단 중 | **해소 (병합 완료)** | `6665464` |
| P0-1 en.json `search.match` 3키 누락 | 미해결 | **해소** | `372d3e5` |
| P1-1 CODEX_HANDOVER §2 YouTube/TikTok 수치 | 미해결 | **해소** | `041f825` |
| P1-2 멤버 페이지 linksCount 오도 | 미해결 | **해소** | `041f825` |
| P2-1 루트 `sakamichi.schema.ts` stale | 미해결 | **해소 (삭제)** | `a688531` |
| P2-2 `RankingPanel.tsx` dead file | 미해결 | **해소 (삭제)** | `a688531` |
| P2-3 `deriveFranchise` 이중 진실 | 미해결 | **해소 (build-search-index 리팩터 + @deprecated)** | `a688531` |
| P3-1 `/dev/bg` 프로덕션 노출 | 미해결 | **부분 해소 (렌더 null, 라우트는 존재)** | `a688531` |
| P3-3 Supabase Authorization 헤더 방어 | 미해결 | **해소** | `a688531` |

---

## 1. Vercel main 빌드 실패 해소

### 근본 원인 (rev1 진단 기준 재확인)
1. `codex/trust-data-phase2` 브랜치의 rMVP 작업이 `main`에 미머지 상태 → GitHub Actions daily-updates가 `main`의 옛 `scripts/fetch/events.ts`(`httpsUrlOrFallback` 없음)로 실행 → `data/portal.json`에 `officialUrl: "http://musicexpolive.com/"` 재유입 → `HttpsUrl` Zod 검증 실패 → 빌드 중단.
2. 최소 5회 이상 auto-sync 커밋이 계속 실패 (`7d6df6d` → `8ce24fe` → `898d4ef` → `656839d` → `bc2563d`).

### 조치
- **커밋 `6665464`**: `git merge codex/trust-data-phase2 --no-ff -m "Merge branch codex/trust-data-phase2 — rMVP data integrity + inquiry server API + coverage panels"` 실행.
- 충돌 3파일 해결:
  - `data/portal.json` → 브랜치 채택 (59 events, HTTPS-clean).
  - `data/latest-updates.json` → main 채택 (최신 60 블로그 항목 유지).
  - `data/latest-videos.json` → main 채택 (최신 34 영상 유지).
- 병합 후 로컬 5개 검증(`typecheck`, `data:validate`, `search:verify`, `build`, `install --frozen-lockfile`) 전부 통과 후 push.

### 독립 재검증 (Opus 재실행)
- `data/portal.json` HTTP URL 카운트: 0 (`node -e "…filter(e=>e.officialUrl.startsWith('http://'))"`).
- 로컬 `pnpm data:validate`: 통과 (59 events, 2 venues, 15 ranking facts, 16 그룹, 454 멤버, 256 싱글).
- 로컬 `pnpm build`: 1,538/1,538 경로 생성.

### 잔여 관찰 항목
- **Vercel Production 빌드 결과**: 최종 push된 커밋 `a688531`에 대한 새 빌드 상태는 사용자 대시보드에서 READY 확인 필요. Opus는 원격 Vercel API 인증 자격이 없어 직접 조회 불가.
- **GitHub Actions daily-updates 다음 실행**: 새 `scripts/fetch/events.ts` 로 동작. 다음 자동 커밋 시 `data/portal.json`에 HTTP URL이 재유입되지 않으면 이 회귀 완전 종식.

---

## 2. P0 · en.json search.match 3키 추가

### 조치 (커밋 `372d3e5`)
`messages/en.json`의 `search` 오브젝트에 다음 3키 추가:
```json
"match": {
  "name": "Name match: {term}",
  "alias": "Alias match: {term}",
  "group": "Group name match: {term}"
}
```
`ja.json`, `ko.json`은 rev1 기준 이미 존재. en만 누락이었음.

### 독립 재검증
```
$ node -e "const en=require('./messages/en.json'); console.log(JSON.stringify(en.search.match))"
{"name":"Name match: {term}","alias":"Alias match: {term}","group":"Group name match: {term}"}
```
`SearchResults.tsx:94`의 `t(\`match.${match.kind}\`, { term })` 호출이 en에서 정상 렌더링 예상.

---

## 3. P1-1 · CODEX_HANDOVER §2 YouTube/TikTok 수치 갱신

### 조치 (커밋 `041f825`)
`CODEX_HANDOVER.md §2 현재 데이터` 표의 두 행을 실측으로 교체:
- 이전: `YouTube 링크 | 33명 (졸업생 포함)` / `TikTok 링크 | 19명`
- 이후: `YouTube 링크 | 131명 (any link of type=youtube, 졸업생 포함)[^1]` / `TikTok 링크 | 118명[^1]`

각주 `[^1]`로 계산 근거·재확인 명령을 명시.

### 독립 재검증
```
$ node -e "const m=require('./data/members.json'); console.log('yt=',m.filter(x=>x.links&&x.links.some(l=>l.type==='youtube')).length,'tt=',m.filter(x=>x.links&&x.links.some(l=>l.type==='tiktok')).length)"
yt= 131 tt= 118
```
문서와 실측 일치.

### 참고 (rev2에서 추가로 발견)
`CODEX_HANDOVER.md §3`의 "완료된 구현 (2026-08-24 기준)" 하위 "YouTube 채널 33 + 최신 영상 33건", "TikTok 채널 19" 는 명시적 baseline 표기가 있으므로 변경 대상 아님. `HANDOVER.md`에도 유사 수치가 있을 수 있으나 이번 범위에서는 §2만 정정.

---

## 4. P1-2 · 멤버 페이지 linksCount

### 조치 (커밋 `041f825`)
`src/app/[locale]/m/[memberId]/page.tsx`:
- import: `renderableLinks` 추가.
- line 300: `member.links.length` → `renderableLinks(member.links).length`.

### 독립 재검증
```
$ grep -n "linksCount\|renderableLinks" src/app/\[locale\]/m/\[memberId\]/page.tsx
18:import { renderableLinks } from '@/lib/schema';
300:              {t('linksCount', { count: renderableLinks(member.links).length })}
```
표시 카운트가 실제 렌더링 카드 수와 일치.

---

## 5. P2 · Dead code 및 이중 진실 정리

### 5a. 루트 `sakamichi.schema.ts` 삭제 (P2-1)
- `git rm sakamichi.schema.ts` (482줄 제거).
- 사전 확인: `grep -r "from ['\"].*sakamichi\.schema" src scripts` → 매치 0건.
- 역사 문서 `sakamichi-hub-work-order.md` line 143 "sakamichi.schema.ts는 /src/lib/schema.ts에 배치한다" 라는 기록이 존재하나 해당 문서는 이미 폐기 배너가 붙어 있음. 참조 링크 회귀 없음.

### 5b. `RankingPanel.tsx` 삭제 (P2-2)
- `git rm src/components/home/RankingPanel.tsx` (21줄 제거).
- 사전 확인: `grep -r "RankingPanel" src` → 자기 자신만 매치.
- `PRODUCT_RMVP_PLAN.md §4.5` "연결되지 않은 랭킹 패널을 제거한다" 정책과 일치.

### 5c. `deriveFranchise` 이중 진실 해소 (P2-3)
- `scripts/build-search-index.ts`: `data/groups.json` 로드 → `Map<groupId, franchise>` 생성 → `franchise: franchiseMap.get(m.primaryGroupId) ?? 'akb48g'`.
- `src/lib/search.ts`의 `deriveFranchise`, `SAKAMICHI_GROUP_IDS`는 `@deprecated` JSDoc 부착 후 export 유지 (외부 소비자 없다는 정적 확인은 완료됨; 안전 여유로 삭제 대신 표시).

### 독립 재검증
- `pnpm search:build` 재실행 후 `git diff public/search-index.json` 라인 수: 0. 모든 그룹의 `franchise` 필드가 하드코딩 결과와 일치했으므로 인덱스 내용 변화 없음.
- 4대 검증 모두 통과.

---

## 6. P3 · Production hardening

### 6a. `/[locale]/dev/bg` 프로덕션 렌더 차단 (P3-1)
- `src/app/[locale]/dev/bg/page.tsx` 컴포넌트 상단에 `if (process.env.NODE_ENV === 'production') return null;` 가드.
- 결과: 프로덕션 빌드에서도 라우트는 생성되나(1,538 유지) 응답 본문은 빈 페이지. 검색 색인 노출 위험은 sitemap 미포함으로 이미 최소화되어 있음.
- **부분 해소 사유**: 라우트 자체를 제거하려면 `generateStaticParams` 조건 분기 또는 middleware 302를 도입해야 하며, 사용자 지시 "미해결·부정합 해결" 범위 내에서 최소 침습으로 처리. 완전 라우트 제거는 P3-1' 후속 항목으로 관찰 대상 (rev3에서 필요 시 조치).

### 6b. Supabase `Authorization: Bearer` 헤더 (P3-3)
- `src/lib/supabase/server.ts`의 `callPrivateInquiryRpc` fetch 헤더에 `Authorization: \`Bearer ${secretKey}\`` 추가.
- `apikey` 헤더는 그대로 유지. 신형·구형 Supabase key 정책 양쪽 호환.
- 로컬 API 호출 회귀 위험 없음 (헤더 추가만; 기존 apikey 인증도 병존).

---

## 7. 최종 상태 스냅숏

```
git rev-parse HEAD        → a688531c4cb3c7f9aafa11cc24e3c61e02660351
git rev-parse origin/main → a688531c4cb3c7f9aafa11cc24e3c61e02660351
git log --oneline -5
  a688531 refactor(audit): drop dead schema/panel, use group.franchise, harden dev route and inquiry auth
  041f825 chore(audit): sync handover counts and use renderable link total
  372d3e5 fix(i18n): add missing search.match keys for en locale
  6665464 Merge branch codex/trust-data-phase2 — rMVP data integrity + inquiry server API + coverage panels
  bc2563d chore(blogs): auto-sync latest official blog updates
```

로컬 검증 (Opus 독립 재실행):
- `pnpm typecheck` → 통과.
- `pnpm data:validate` → 16그룹·454멤버·59이벤트·2장소·15 ranking facts·256싱글, KLP48 3중복 이미지 경고만 (사전 존재).
- `pnpm search:verify` → 454명, 다국어·초성·하이픈 변형·별칭 모두 통과.
- `pnpm build` → 1,538/1,538 경로.

작업 트리: 병합 미포함 파일 2개 (`.tmp/`, `AUDIT_REPORT_2026-09-04_rev1.md`, 그리고 이번 `AUDIT_REPORT_2026-09-04_rev2.md`) — 모두 untracked, 커밋 대상 아님.

---

## 8. 남은 관찰 항목 (Opus 접근 불가, 사용자 확인 필요)

1. **Vercel Production 빌드 상태**: 커밋 `a688531`에 대한 새 빌드가 READY인지 대시보드 확인. `6665464` 이후 3개 커밋(fix/chore/refactor)마다 프리뷰 빌드가 트리거되며 각각 성공해야 정상.
2. **다음 GitHub Actions daily-updates 실행**: 새 `scripts/fetch/events.ts`(httpsUrlOrFallback 포함)로 동작. 다음 auto-blog-sync 커밋 이후 `data/portal.json`에 HTTP URL 재유입 여부 확인.
3. **KLP48↔AKB48 3중복 이미지**: `klp48-gyouten-yurina`↔`akb48-gyouten-yurina`, `klp48-kurosu-haruka`↔`akb48-kurosu-haruka`, `klp48-yamane-suzuha`↔`akb48-yamane-suzuha`. 겸임 멤버가 같은 AKB48 CDN 이미지 URL을 공유. 검증기 경고이나 exit 0. rMVP 안전 경계상 자동 분리 금지 (개인 사진 재확인 후 별도 결정).

---

## 9. rev3에서 다룰 후속 (선택)

- P3-1' `/dev/bg` 라우트 자체 제거 (generateStaticParams 조건 분기 또는 middleware). 현재는 렌더만 차단.
- `deriveFranchise`, `SAKAMICHI_GROUP_IDS`의 완전 삭제 (@deprecated 표시 상태에서 다음 정리 주기에).
- KLP48/AKB48 겸임 멤버 이미지 개별화 (겸임 실사 확인 후).
- 자동화 안정성 관찰: 다음 auto-sync·주간 이미지 갱신 실행 결과 확인.

이 항목들은 rev2 완료를 막지 않으며 별도 감사 주기에 다룬다.

---

## 참고 정책

- 커밋 컨벤션: `<type>(<scope>): <subject>` (예: `refactor(audit): …`) — 저장소 기존 스타일 유지.
- 감사 결과 파일화 정책: `AUDIT_REPORT_<date>_revN.md` (feedback_audit_report_delivery).
- 모델 역할 분리: Opus 설계·검토, Sonnet 코딩 (feedback_model_role_split).
- 기술 정확성: Supabase key 정책 등 P2/P3 판정 전 spec·handoff·docs 재확인 (feedback_audit_technical_accuracy) — 본 rev2에서 준수.
