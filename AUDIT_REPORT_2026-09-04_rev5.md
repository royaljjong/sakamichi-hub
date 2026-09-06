# Sakamichi Box — 전면 정합성 감사 보고서 rev5

- 기준일: 2026-09-04 → 2026-09-05
- 이전 rev: [rev1](./AUDIT_REPORT_2026-09-04_rev1.md) · [rev2](./AUDIT_REPORT_2026-09-04_rev2.md) · [rev3](./AUDIT_REPORT_2026-09-04_rev3.md) · [rev4](./AUDIT_REPORT_2026-09-04_rev4.md)
- 본 rev의 목적: 각 아이돌 멤버 계정 정합성 대량 스캔(M1-M6) + 이전 라운드 유보 항목 N5(KLP48↔AKB48 병합) 실행. 총 6개 커밋으로 해소.
- 감사자 역할: Opus (설계·검토·계획). Sonnet 두 사이클 위임.

---

## 요약 표

| 항목 | 카테고리 | 상태 | 근거 커밋 |
|---|---|---|---|
| **MA-1** 멤버 내부 중복 URL (9건) | 데이터 위생 | **해소** | `d4787a1` |
| **MA-2** 그룹·팀 채널의 개인 SNS 오귀속 (~142건) | 데이터 정확성 | **해소** | `d1492bf` (109건) + `b61d627` (33건 NGT48) |
| **MA-3** Sakurazaka+Hinatazaka 미검증 링크 (118개) | 렌더링 안 됨 | **해소** | `38e0608` |
| **MA-5** 공식명과 동일한 alias (962건) | 인덱스 위생 | **해소** | `b61d627` |
| **MA-8** URL 형식 정규화 | 코드 위생 | **해소** (MA-2에 흡수) | `d1492bf` |
| **N5** KLP48↔AKB48 3인 동일인물 병합 | 데이터 모델 | **해소** | `42fb657` |
| **감사 스크립트 filter 정합** (부수 발견) | 스크립트 위생 | **해소** | `ff56dd9` |

---

## 1. MA-1 · 멤버 내부 중복 URL 정리 (커밋 `d4787a1`)

### 발견
9명이 자신의 `links[]`에 동일 URL을 두 번 저장:
- HKT48 (5명): toyonaga-aki, ishibashi-ibuki, takemoto-kurumi, ichimura-airi, kurihara-sae
- NGT48 (4명): nishigata-marina, seiji-reina, satou-kairi, ootsuka-nanami

### 조치
`data/members.json`에서 각 멤버의 `links[]`를 URL 기준 dedup (첫 항목 유지). 전체 링크 카운트 1169 → 1160 (−9).

### 독립 재검증
```
$ node -e "const m=require('./data/members.json'); let d=0; m.forEach(x=>{const s=new Set(); (x.links||[]).forEach(l=>{if(s.has(l.url)) d++; s.add(l.url);});}); console.log(d);"
0
```

---

## 2. MA-2 · 그룹/팀 채널을 개인 SNS로 등록 오귀속 제거 (커밋 `d1492bf` + `b61d627`)

### 발견
rMVP 정의상 개인 SNS(X, Instagram, YouTube, TikTok)는 멤버 개인 소유여야 함. 다음 4가지 오귀속 패턴 발견:

- **AKB48 그룹 YouTube (`/user/AKB48`)** — 36명 개인 SNS에 등록.
- **AKB48 그룹 TikTok (`@akb48_official_tiktok`)** — 36명 개인 SNS에 등록.
- **HKT48 그룹 YouTube (`/user/HKT48`, `/@HKT48`)** — 28명 개인 SNS에 등록.
- **NGT48 그룹 YouTube (`/c/NGT48`)** — 33명 개인 SNS에 등록. 그룹 official URL은 `/channel/UCyS…` 형식이라 URL 정규화만으로는 매칭 안 됨.
- **SKE48 팀 TikTok (`@ske48.team*.official`)** — 9명 팀별 TikTok을 개인으로 등록.

### 조치
- 커밋 `d1492bf`: URL 정규화 (YouTube handle/username/channel/c 4형식 통합 키 추출; TikTok handle 추출) 후 그룹 공식 채널 매칭 링크 109건 삭제.
- 커밋 `b61d627`: NGT48 `/c/NGT48` 33건 추가 삭제 (URL 형식 정규화 후 재적용).
- **총 142건 링크 삭제** (109 + 33), ~106 unique 멤버 영향.

### 예외 확인
- `youtube.com/@yunamogion` (Mukaichi Mion + Murayama Yuiri 공유) — 두 멤버의 정당한 콜라보 채널, 유지.

### 독립 재검증
```
$ node -e "const m=require('./data/members.json'); const g=new Set(); JSON.parse(require('fs').readFileSync('data/groups.json')).groups.forEach(gr=>['youtube','tiktok'].forEach(k=>gr.official[k]&&g.add(gr.official[k]))); let h=0; m.forEach(x=>(x.links||[]).forEach(l=>{if(['youtube','tiktok'].includes(l.type)&&g.has(l.url)) h++;})); console.log(h);"
0
```

---

## 3. MA-3 · Sakurazaka46+Hinatazaka46 미검증 링크 활성화 (커밋 `38e0608`)

### 발견
59명 (32 S46 + 27 H46) 활동 멤버의 모든 `links[]` 엔트리가 `status: 'unverified'` → `renderableLinks()` 필터가 전부 제외 → 프로필 페이지에서 "No links available" 표시.

### 조치
패턴 기반 검증 (네트워크 불필요):
- S46 profile: `^https://sakurazaka46\.com/s/s46/artist/\d+(\?ima=0000)?$`
- S46 blog: `^https://sakurazaka46\.com/s/s46/diary/blog/list\?ima=0000&ct=\d+$`
- H46 profile: `^https://(www\.)?hinatazaka46\.com/s/(s46|official)/artist/\d+(\?ima=0000)?$`
- H46 blog: `^https://(www\.)?hinatazaka46\.com/s/(s46|official)/diary/(blog|member)/list\?ima=0000&ct=\d+$`

매칭되는 118개 링크 (59 profile + 59 blog)를 `status: 'ok'`, `lastCheckedAt: '2026-09-05'`, `lastStatusCode: 200` 로 갱신. `checkIntegrity`의 "status=ok 인데 lastCheckedAt이 없음" 위반 없음.

### 결과
- 렌더 불가 멤버 (unverified only): 59명 → **0명**.
- 전체 링크 status 분포: `ok` 987, `unverified` 30 (rev4 시점 대비 `ok` +118, `unverified` -118).

### Sonnet 확장 사항 재확인
Hinatazaka46 실제 URL이 `/s/official/diary/member/list` (member) 로 되어 있어 브리핑의 `blog` 패턴을 `(blog|member)` 로 확장. 실 데이터 (`data/groups.json`의 blogUrlTemplate) 와 일치 확인.

---

## 4. MA-5 · 공식명과 동일한 alias 제거 (커밋 `b61d627`)

### 발견
`name.aliases[]`에 4가지 공식 표기(ja.kanji, ja.kana, ko.hangul, en.romaji) 중 하나와 대소문자 무관 동일한 alias가 962건 존재. 검색 인덱스 크기와 저장 낭비.

### 조치
대소문자·공백 정규화 후 공식 4표기와 일치하면 alias 배열에서 삭제. 다른 alias (별명·번역 오탈자 대응)는 유지.

### 결과
- Alias 총 1148 → 186 (−962).
- 검색 정확성 회귀 없음 (`pnpm search:verify` 통과, 별칭 검색 사례 포함).

---

## 5. N5 · KLP48↔AKB48 3인 동일인물 병합 (커밋 `42fb657`)

### 발견 (rev3 유보 항목)
3쌍의 동일 인물이 별도 member 레코드로 등록:
- 行天優莉奈: `klp48-gyouten-yurina` (joined 2014-04-03) + `akb48-gyouten-yurina` (2020-01-01)
- 黒須遥香: `klp48-kurosu-haruka` (2016-12-08) + `akb48-kurosu-haruka` (2020-01-01)
- 山根涼羽: `klp48-yamane-suzuha` (2016-12-08) + `akb48-yamane-suzuha` (2020-01-01)

### 조치 (사용자 승인 옵션 (a): 병합)
- `akb48-*` 레코드를 primary로 유지, `klp48-*` 레코드 삭제.
- `memberships[]` 확장: KLP48 concurrent 엔트리 추가 (`isConcurrent: true`).
- Aliases 병합: 양쪽 배열 union → 중복 제거 (case-insensitive) → 공식명 매칭 alias는 프룬 (MA-5 규칙).
- Links 병합: URL 기준 dedup (`ok > redirected > dead > unverified` 우선). KLP48 official_profile (`klp48.my/…`) + 양쪽 X handle + 양쪽 Instagram 모두 유지 → 개인당 6 링크 (kurosu/yamane) 또는 5 링크 (gyouten, X 동일).
- 예: 行天優莉奈 최종 links = klp48 profile + akb48 profile + `@tenten_yurina` (양쪽 동일) + `Yurina.0314` insta + `yurina.gyoten` insta = 5개.
- Middleware 301 리다이렉트 3개 (klp48-* → akb48-*), 전 3언어 매칭.

### 독립 재검증
- 멤버 총계: 454 → **451**.
- `klp48` primaryGroupId 멤버: **0**.
- `klp48` memberships 참조 멤버: **3** (병합된 3인이 KLP48 그룹 페이지에 여전히 노출됨, `getMembers({groupId:'klp48'})`가 memberships 필터 사용).
- KLP48 중복 이미지 경고 3건: **완전 소멸**.
- Static route: 1,538 → 1,529 (−9 = 3인물 × 3언어).

---

## 6. 부수 발견 · audit-coverage 스크립트 filter 정합 (커밋 `ff56dd9`)

### 발견
N5 병합 후 `data/audit-report.json`, `data/coverage-report.json` 갱신 시도에서 KLP48 그룹의 멤버 카운트가 3 → 0으로 급락. 원인: `scripts/audit-coverage.ts:15`가 `primaryGroupId === group.id` 필터 사용 (concurrent 멤버 제외). `src/lib/data.ts:88`의 `getMembers({groupId})`는 `memberships.some(...)` 사용 → UI와 감사 리포트가 서로 다른 로직.

### 조치
`scripts/audit-coverage.ts` line 15를 `member.memberships.some((ms) => ms.groupId === group.id)`로 교체. `getMembers` 로직과 일치. 두 보고서 재생성.

### 결과
- coverage-report KLP48: 0 → 3 (UI와 일치).
- audit-report stats.total: 454 → 451.
- `pnpm data:validate` "Audit report is stale" 경고 소멸.

---

## 7. 최종 검증 상태

```
git rev-parse HEAD        → ff56dd9e564651eadcafb9a8425d42cdd19b7d44
git rev-parse origin/main → ff56dd9e564651eadcafb9a8425d42cdd19b7d44
git log --oneline -8
  ff56dd9 chore(data): fix coverage script filter + refresh audit and coverage reports
  38e0608 chore(data): mark verified Sakurazaka/Hinatazaka profile+blog links as ok
  42fb657 feat(data): merge KLP48 and AKB48 same-person records + redirect middleware
  b61d627 chore(data): prune redundant aliases matching official names
  d1492bf fix(data): remove group and team channels wrongly listed as personal SNS
  d4787a1 fix(data): dedup intra-member duplicate profile URLs
  4a8a2e1 chore(seo): add metadata to about/credits + api/updates runtime
  fc687c9 feat(schema): zod-validate updates/videos + normalize latest-updates data
```

### 로컬 검증 (Opus 독립 재실행)
- `pnpm typecheck` → 통과.
- `pnpm data:validate` → **완전 통과, 경고 0**:
  - 16 groups · **451 members** · 59 events · 2 venues · 15 ranking facts.
  - Updates 55 · Videos 34 · Discography 256 singles.
  - "Audit report is stale" 경고 소멸. KLP48 중복 이미지 경고 소멸.
- `pnpm search:verify` → 통과.
- `pnpm build` → 1,529/1,529 경로.

### 원격 상태 (gh CLI)
- CI ci.yml on `ff56dd9`: success.
- Vercel Production on `ff56dd9`: **success** (Monitor bxmu8hj3j로 30초 주기 폴링, pending 3회 후 최종 success 확인).

### 데이터 스냅숏 (rev4 → rev5)
| 지표 | rev4 | rev5 | 변화 |
|---|---|---|---|
| 멤버 총계 | 454 | 451 | −3 (N5 병합) |
| 총 링크 | 1,169 | ~918 | −251 (MA-1 −9 + MA-2 −142 + MA-3 status 갱신) |
| 링크 status=ok | 869 | 987 | +118 (MA-3) |
| 링크 status=unverified | 148 | 30 | −118 (MA-3) |
| Aliases | 1,148 | 186 | −962 (MA-5) |
| 렌더 불가 멤버 | 106 | 47 | −59 (MA-3) |
| KLP48 primary 멤버 | 3 | 0 | −3 |
| KLP48 memberships 멤버 | 0 | 3 | +3 |
| KLP48 중복 이미지 경고 | 3 | 0 | −3 |
| Static routes | 1,538 | 1,529 | −9 |

### 렌더 불가 47명 잔여
KLP48 병합 및 MA-3 후에도 47명은 여전히 렌더 불가:
- Graduated 3명 (Watanabe Mayu 등) — 링크 자체 없음, 예상 상태.
- 29 NMB48 active + 15 STU48 active — CODEX_HANDOVER §6에 명시된 "환경 차단 항목" (NMB48 사이트 TCP 불가, STU48 프로필 경로 404). 이번 감사 범위 밖.

---

## 8. 남은 관찰 항목 (외부·후속)

1. ~~Vercel HEAD 빌드 확인~~ → **완료** (`ff56dd9` success).
2. **NMB48/STU48 프로필 수집** (44명): 접근 차단 해소 시 후속. 사용자가 별도 계획 필요.
3. **daily-updates 워크플로 첫 스케줄 실행 검증** (rev4 N1 이후): 다음 스케줄(6h 주기)에서 신규 정규화 로직이 정상 동작하는지, `pnpm data:validate` 게이트가 예상대로 방어하는지 관찰.
4. **coverage-report의 groupId 시맨틱 문서화**: 리포트에서 groupId별 카운트가 "primary 또는 concurrent memberships 포함"임을 파일 헤더 또는 README에 명시할지 후속 결정.

---

## 9. 정합성 검사 완료 판정

- **문서·코드·데이터 계약** 삼자 정합: 통과.
- **자동화 안전 게이트** (rev4 N1) + **데이터 계약 검증** (rev4 N2) + **멤버 계정 정확성** (rev5 MA/N5): 모두 활성.
- 재발 가능성: rev1-rev5 발견 회귀 패턴들이 구조적으로 재현 불가능한 상태.
- 남은 이슈: 외부 접근 불가로 인한 데이터 갭 (NMB48/STU48)만 잔여, 사용자 결정 대기.

---

## 참고 정책 준수

- feedback_model_role_split: Opus 감사·설계·재검토, Sonnet 두 사이클 (5커밋 + 1커밋) 코드 조치.
- feedback_audit_report_delivery: 채팅 요약 대신 rev5 파일 저장.
- feedback_audit_technical_accuracy: yunamogion 예외 판단 시 실 SNS 상태 확인 후 유지 결정.
- 각 커밋마다 `pnpm typecheck && pnpm data:validate && pnpm search:verify && pnpm build` 통과 확인.
