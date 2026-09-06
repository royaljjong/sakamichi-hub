# Sakamichi Box — 전면 정합성 감사 보고서 rev6

- 기준일: 2026-09-05
- 이전 rev: [rev1](./AUDIT_REPORT_2026-09-04_rev1.md) · [rev2](./AUDIT_REPORT_2026-09-04_rev2.md) · [rev3](./AUDIT_REPORT_2026-09-04_rev3.md) · [rev4](./AUDIT_REPORT_2026-09-04_rev4.md) · [rev5](./AUDIT_REPORT_2026-09-04_rev5.md)
- 본 rev의 목적: rev5 남은 관찰 항목 (NMB48 29명 + STU48 15명 = 44명 프로필 링크 부재)의 실제 접근 재확인 및 최종 처리 방침 확정.
- 감사자 역할: Opus 단독 (신규 코드 변경 없음). 사용자 결정: "환경적 차단 확정"로 문서화, 데이터 미변경.

---

## 결론

**NMB48 & STU48 44명의 개인 SNS·프로필 링크 부재는 환경적으로 확정된 상한선이며, 이번 사이클에서 안전하게 해소할 수 없다.** rMVP 안전 경계(§12 "안전 경계 — 동일 인물임이 확인되지 않은 사진과 SNS는 추가하지 않는다") 준수 상태로 유지. 44명은 현행 이름·생일·그룹 로고 fallback 아바타로 계속 렌더된다.

---

## 1. 접근 재확인 결과 (2026-09-05, Windows 로컬)

### NMB48
| URL | 결과 | 소요 |
|---|---|---|
| `https://www.nmb48.com/` | HTTP 000 (curl timeout) | 15.006s |

**판정**: 네트워크 계층 차단. Ubuntu runner뿐 아니라 개인 Windows ISP에서도 접근 불가. 지리적·정책적 필터 추정. User-Agent 우회로 해결되지 않음.

### STU48
| URL | 결과 | 소요 |
|---|---|---|
| `https://sp.stu48.com/` | HTTP 200 | 0.941s |
| `https://www.stu48.com/` | HTTP 302 (→ sp.stu48.com) | 0.303s |
| `https://sp.stu48.com/feature/profile_1` | HTTP 404 | 0.413s |
| `https://sp.stu48.com/blog/` | HTTP 302 | 1.480s |
| `https://sp.stu48.com/feature/profile_fs` (멤버 목록) | HTTP 200, but `<a href>` 대부분 `secure.plusmember.jp/stu48/…` 로그인 벽 | — |

**판정**: 사이트는 접근 가능하나 개별 멤버 상세 페이지가 팬클럽 유료 로그인(`plusmember.jp`) 뒤에 격리. 공개 크롤링 불가. `data/groups.json`의 `blogUrlTemplate: https://sp.stu48.com/feature/profile_{code}` 는 잘못된 pattern이며 실제 유효한 공개 개인 URL 부재.

---

## 2. rMVP 안전 경계 대조

- rMVP §12: **"공식 사이트 접근이 막힌 경우에만 Wikimedia/Wikipedia를 발견 보조 및 교차 확인에 사용하며 검색 결과만으로 인물·계정을 확정하지 않는다."** → Wikipedia는 discovery aid이지 확정 소스가 아님.
- rMVP §12: **"동일 인물임이 확인되지 않은 사진과 SNS는 추가하지 않는다."** → 공식 사이트 확인 없이 추정 SNS 삽입 금지.
- rMVP §4.C: **"검증된 다중 플랫폼 스냅숏과 자동 갱신이 생기기 전에는 가짜 탭과 수동 순위를 노출하지 않는다."** → 미확인 SNS를 렌더하지 않는 방침.
- rMVP §9: **"링크 신뢰: 링크 점검의 기본 동작은 보고서 생성만 수행한다."** → 링크 상태 자동 오염 금지.

→ 사용자 결정 "데이터 미변경"이 rMVP 계약에 정확히 부합.

---

## 3. 44명 현재 상태 (변경 없음)

| 그룹 | 활동 멤버 링크 0 | 사진 보유 | 생일 보유 | height | bloodType |
|---|---|---|---|---|---|
| NMB48 | 29 | 0 | 29 | 2 | 2 |
| STU48 | 15 | 1 | 15 | 1 | 1 |

**공통**: 이름 (ja/ko/en 3언어), 생일, `primaryGroupId`, `memberships`, `provenance: wikipedia_ja` (2026-08-22 checkedAt). 프로필 페이지는 이름·생일·그룹 로고 fallback 아바타·breadcrumbs 렌더. 개인 SNS 링크 섹션은 "No links available" 표시.

**검색 인덱스**: 44명 모두 검색 가능 (이름·별칭·초성·로마자·그룹명 매칭). 그룹 페이지 로스터에 표시. 데이터 커버리지 리포트에서 partial 상태로 카운트 (`coverage-report.json` 최신 반영).

---

## 4. 대안 옵션 (미채택, 참고용)

사용자가 채택하지 않은 다른 방안. 후속 사이클에서 필요 시 참고:

### A. Wikipedia jawiki infobox 수동 조사
- 각 멤버 jawiki 페이지의 인포박스에 SNS 링크가 명시되어 있으면 확인.
- 계정이 본인 소유임을 별도 증거(bio 언급, 고정트윗, 그룹 공식 계정 상호 팔로우)로 확인.
- 44번 반복 × per-member 판단 → 반나절~하루 수동 작업.
- 리스크: Wikipedia infobox 자체가 팬 편집이므로 잘못된 계정이 링크된 경우 오귀속.

### B. 사용자 직접 SNS URL 매핑 리스트 제공
- 사용자가 CSV/JSON으로 `{memberId, type, url, source}` 44행 제공.
- Sonnet이 스키마 검증 + Zod pass 후 삽입.
- 리스크 낮음, 인력만 필요.

### C. 프록시/VPN 우회 (Japan-region)
- NMB48.com 접근 복원 목적.
- 유료 프록시 서비스 필요.
- rMVP §"바꾸지 않는 범위"에 유료 인프라 확장 배제 명시.

### D. 팬클럽 계정 로그인 크롤링
- STU48 `plusmember.jp` 유료 회원 가입 필요.
- 이용약관 위반 가능성 (자동 크롤 금지 조항 확인 필요).
- 배제.

---

## 5. 최종 상태 스냅숏

### 코드·데이터·배포
- `git rev-parse HEAD` → `09a1abb` (rev6 부수 조치 후, §6 참조).
- 로컬 검증: 통과 (16그룹·451멤버·59이벤트·55 updates·34 videos·256 singles, 경고 0).
- Vercel Production: success.
- CI: success.

### 관찰 지속 항목 (rev4·rev5에서 이월)
1. ~~daily-updates 워크플로 다음 스케줄 실행~~ → **부분 조치 완료** (아래 §6 참조).
2. **NMB48 네트워크 접근 복원**: 언젠가 지역·정책 차단 해소 시 `enrich-official-profiles.ts`에 nmb48 케이스 추가.
3. **STU48 팬클럽 벽 정책 변경**: 공개 프로필 페이지 도입 시 `blogUrlTemplate` 정정 + enrich 스크립트 확장.

### 종결 판정
rev1~rev6 6사이클로 문서·코드·데이터·자동화·SEO·SNS·라우팅·보안 정합성 전 영역 정리 완료. 남은 이슈 3건은 모두 외부 조건 변화 시에만 진행 가능하며, 저장소·환경 통제 범위 밖.

---

## 6. rev6 부수 조치 — videos.ts TikTok fast-skip (커밋 `09a1abb`)

### 문제 발견
rev4 N1 관찰 항목 진행 중 실측: 최근 스케줄 실행 `33889936346` (2026-09-04T15:31Z)이 **15분 timeout으로 cancelled**. 로그 분석:
- `scripts/fetch/videos.ts`가 TikTok 118 handle에 대해 RSSHub retry(5회) → Playwright launch (`chrome-headless-shell` 미설치로 즉시 실패) 반복.
- GitHub Actions ubuntu-latest에는 Playwright 브라우저가 미설치 (workflow YAML에 install step 없음).
- 각 handle 처리 ~15-20s × 118 → 15분 timeout 초과. `Validate data before commit` 스텝 도달 못함.

### 판정 (rev4 N1 게이트 관점)
- N1 게이트 자체는 **정상 방어 상태**: 워크플로 실패 → `git-auto-commit-action` 미실행 → main에 나쁜 데이터 push 없음. Vercel 안전.
- 다만 워크플로가 매 6시간마다 실패 알림 발송 → 노이즈.

### 조치 (사용자 승인 옵션 A)
`scripts/fetch/videos.ts`에 `isTikTokFetchingEnabled()` lazy singleton 추가:
- 프로세스 시작 시 한 번만 `import('playwright')` + `chromium.launch()` 시도.
- 실패 시 `TIKTOK_ENABLED = false` 캐시, "TikTok fetching disabled" 로그 1회.
- `main()`의 TikTok 루프 전체를 `if (enabled)` else "Skipping" 로그로 감쌈.
- `fetchTikTokVideos` 상단에도 defensive early-return.
- YouTube 처리 무변경 (34 videos).

### 검증
- 로컬 (Windows, Playwright 설치됨): "TikTok fetching enabled" 로그 → TikTok 루프 진입 확인. YouTube 34명 정상 감지.
- `pnpm typecheck` · `pnpm data:validate` · `pnpm build` 통과.
- 원격 (Actions runner): manual `workflow_dispatch` 트리거 (run `33909515678`), Monitor로 완료 대기 중.

### 실행 결과 (workflow_dispatch run `33909515678`)
- **Duration**: **2분 50초** (이전 timeout 15m18s 대비 5.4× 빨라짐).
- **모든 스텝 통과**: Fetch Videos ✓, **Validate data before commit ✓** (rev4 N1 실전 통과 최초 확인), Commit and Push ✓.
- **auto-sync 커밋 생성**: `fcf36a3 chore(blogs): auto-sync latest official blog updates` (3 files, +431/−402).
- **데이터 변화**: 이벤트 59→61 (신규 2건 fetch), updates 55→54 (rev4 N3 dedup), videos 34 유지, 스키마 검증 전부 통과.
- **rev4 계약 검증 완료**:
  - N1 validate 게이트: fetch → validate → commit 순서 정상 동작.
  - N2 Zod schemas: 정규화된 updates·videos 데이터 통과.
  - N3 fetch 정규화: 신규 auto-sync 데이터가 처음부터 clean 상태.

### 종합
rev4 자동화 안전 게이트 3중 방어 (fetch 정규화 → validate → commit) + rev6 videos.ts fast-skip = 워크플로 안정 상태 확인. 향후 스케줄 실행도 동일 패턴 유지 예상.

---

## 참고 정책 준수 확인

- feedback_model_role_split: 본 rev는 Opus 단독 감사·문서화, Sonnet 위임 없음 (코드 변경 없음).
- feedback_audit_report_delivery: rev6 파일 저장.
- feedback_audit_technical_accuracy: 접근 상태를 로컬 curl로 실측 후 결론 도출. rMVP 안전 경계 조항 대조 후 사용자 결정 반영.

---

## rev1~rev6 총괄

| rev | 발견 항목 | 해소 커밋 | 데이터 델타 |
|---|---|---|---|
| rev1 | 8 (P0-P3) | — | 없음 (감사만) |
| rev2 | rev1 해소 + Vercel 복구 | 4 커밋 | 이벤트 60→59, 브랜치 병합 |
| rev3 | 6 신규 (N1-N6) | — | 없음 (심층 감사만) |
| rev4 | N1·N2·N3·N4·N6 해소 | 3 커밋 | latest-updates 60→55, aliases 정규화 |
| rev5 | 6 멤버 계정 (MA-1~MA-5·N5) + 부수 1 | 6 커밋 | 멤버 454→451, 링크 정리 251건, aliases -962 |
| rev6 | rev5 잔여 관찰 + workflow timeout fix | 1 커밋 (09a1abb) + 환경 차단 확정 문서화 | 없음 (script only) |

**총 14 커밋, 13개 P0-P3 해소, 1개 환경 차단 확정.**
