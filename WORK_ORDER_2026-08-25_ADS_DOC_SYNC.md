# 2026-08-25 AdSense 운영 문서 정합성 작업지시서

## 목적과 범위

Google AdSense 승인·게재 상태를 제품 정책, 개인정보 처리방침, 운영 인수인계에 일관되게 반영한다. 기존 Wikipedia 출처 페이지 구현 여부도 확인해 오래된 P0 항목을 정리한다.

영향 파일:

- `AUDIT_AND_REBUILD_PLAN.md`: 제품 운영 전제와 안전 경계
- `src/app/[locale]/privacy-policy/page.tsx`: ja/ko/en 광고 상태 문구와 갱신일
- `ADSENSE_APPLICATION_GUIDE.md`: 신청 가이드를 승인 후 운영 가이드로 전환
- `CODEX_HANDOVER.md`, `HANDOVER.md`, `PLAN_REPORT_2026-08-23_rev1.md`: 현재 상태와 완료 항목 동기화
- `README.md`: 현재 광고 운영 상태와 문서 우선순위 안내
- `scripts/desktop-refresh.bat` 및 실제 바탕화면 복사본: 수동 갱신 명령 복구와 실패 안전성
- `src/app/[locale]/{page,g/[groupId]/page,m/[memberId]/page}.tsx`: 페이지 단위 `metadataBase`
- `data/audit-report.json`: 현재 454명 기준 재감사 결과
- `ADSENSE_POST_APPROVAL_CHECKLIST.md`: 관리 화면에서 확인할 운영 체크리스트

## 연결과 예외

- 데이터: `data/*.json`은 변경하지 않는다.
- UI: 개인정보 처리방침의 표시 문구만 변경하며 광고 로더·슬롯 배치는 변경하지 않는다.
- 명령/자동화: 빌드 및 타입 검사로 정적 페이지 생성과 TypeScript 회귀를 확인한다.
- 실패·빈 상태: AdSense 관리 화면의 동의 메시지/CMP 상태는 저장소만으로 확인할 수 없으므로 운영 체크리스트에 미확인 항목으로 남긴다.
- 회귀 위험: 번역 간 의미 불일치, 실제 광고 상태와 문서 재불일치, 사용자가 수정 중인 자동 수집 데이터 혼입.

## 완료 조건과 검증

- ja/ko/en 개인정보 처리방침에서 광고가 현재 운영 중임을 표현한다.
- 현행 인수인계에 `승인 대기` 문구가 남지 않는다.
- Wikipedia attribution 구현 완료 상태가 로드맵에 반영된다.
- `pnpm typecheck`, `pnpm data:validate`, `pnpm build` 결과를 아래에 기록한다.
- 기존 변경인 `data/latest-updates.json`, `data/latest-videos.json`은 수정하지 않는다.

## 후속 실행 단위

1. 저장소 배치 파일에 경로·도구·수집 단계 실패 검사를 추가한다.
2. `[Environment]::GetFolderPath('Desktop')` 결과인 `C:\Users\royal\OneDrive\Desktop`에 실행 파일을 복구한다.
3. 현재 멤버 데이터로 감사 보고서를 재생성하고 `data:validate`의 stale 경고 제거를 확인한다.
4. 홈·그룹·멤버 메타데이터에 프로덕션 `metadataBase`를 명시하고 빌드 경고를 재확인한다.
5. AdSense CMP/정책 센터/모바일 배치를 사용자가 대시보드에서 확인할 수 있는 체크리스트로 남긴다.

### 구현 중 확인된 방향 차이

페이지의 `generateMetadata`에 `metadataBase`를 추가해도 특수 `opengraph-image` 라우트에는 적용되지 않아 경고가 유지됐다. 페이지별 중복 설정은 유지하되, OG 이미지 라우트가 직접 상속할 수 있는 경로 레이아웃을 추가하고 루트 OG 이미지를 `[locale]` 아래로 이동한다. 다국어 `<html lang>` 구조와 광고 로더 위치는 변경하지 않는다.

## 검증 결과

- `pnpm typecheck`: 통과 (exit 0).
- 최초 `pnpm data:validate`: 통과 (16그룹, 454명, 이벤트 52건, 싱글 256건). 당시 `audit-report` 453/454 stale 경고는 후속 실행에서 해소했다.
- `pnpm build`: 통과. 정적 페이지 1,536개 생성 완료.
- 최초 빌드 비차단 경고: 일부 페이지의 `metadataBase` 미설정으로 `localhost` 폴백이 반복됐으나 후속 실행에서 OG 이미지 경로를 조정해 제거했다.
- 문구 검색: 현행 코드·인수인계에서 광고를 미래/승인 대기로 표현하는 문구가 제거됐다. 기획서와 본 작업지시서의 문제 정의에 인용된 과거 표현만 남아 있다.
- 기존 사용자 변경 `data/latest-updates.json`, `data/latest-videos.json`은 수정하지 않았다.

### 후속 실행 결과

- 바탕화면 명령 복구: `C:\Users\royal\OneDrive\Desktop\Sakamichi Box 업데이트.bat` 생성.
- 배치 안전성: 저장소·pnpm·Git 사전 확인, 수집 실패 시 검증/커밋/푸시 중단, `--check` 무변경 점검 모드 추가.
- `--check`: 통과. 저장소·pnpm·Git 인식 확인.
- 멤버 감사: 454명 기준 `data/audit-report.json` 재생성. 실행 환경의 외부 URL 접근 실패로 이미지 348건은 status 0 경고이며 데이터 변경 근거로 사용하지 않았다.
- `pnpm data:validate`: 통과. 이전 453/454 stale 경고 제거.
- `pnpm typecheck`: 통과.
- 최종 `pnpm build`: 통과, 1,536개 정적 페이지 생성. `metadataBase` 경고 제거 확인. Edge runtime의 정적 생성 제한 안내 1건은 동적 OG 이미지 설계에 따른 비차단 안내로 남는다.
- AdSense 관리 화면 확인 항목은 `ADSENSE_POST_APPROVAL_CHECKLIST.md`에 분리했다. 계정 접근 없이 CMP·정책 센터 상태를 완료로 표시하지 않았다.
