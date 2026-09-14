# WORK ORDER · 2026-09-14 · VERCEL DEPLOYMENT STORAGE FREEZE & OPTIMIZATION

## 1. 개요 및 배경 (큰 줄기와 가지 확인)
- **프로젝트**: `sakamichi-hub` (`prj_rCZPgPBdSXEk11GsVKVnz6RTczPS`)
- **운영 도메인**: `https://sakamichi-hub.vercel.app`
- **문제 증상**: Vercel 대시보드에서 `Exceeded free resources Deployment Storage 140.67 GB / 10 GB` 경고 발생.
- **근본 원인 분석**:
  1. **Deployment Storage의 성격**: 웹사이트 방문자 트래픽(대역폭)이 아닌, **배포(빌드) 아티팩트 및 정적 파일/캐시 누적 용량**임.
  2. **자동 배포 폭증**: GitHub Actions(`daily-updates.yml` 6시간 주기, `link-check.yml` 매주) 및 데스크톱 업데이트 배치가 커밋을 자동 푸시할 때마다 Vercel이 1,529개 정적 페이지와 캐시(1회당 ~1GB)를 새로 빌드함.
  3. **최근 현황**: 9월 11일 56개 배포 정리 이후 3일간 또 15개 배포 누적(9월 14일 당일만 5회 빌드 실행됨).
  4. **결론**: 사이트를 방문한다고 용량이 차는 것이 아니므로, **사이트 자체를 중지(503)할 필요가 전혀 없으며**, 백그라운드 자동 배포(빌드 생성)만 완전 차단하면 용량 증가가 100% 영구 동결됨.

## 2. 작업 목표 및 변경 범위
1. **[방어선 1: Vercel Ignored Build Step]**:
   - Vercel Project의 `commandForIgnoringBuildStep`을 `exit 0`으로 설정.
   - GitHub에서 어떤 푸시가 발생해도 Vercel이 빌드를 100% 무조건 스킵하여 신규 배포 생성을 원천 차단.
2. **[기존 배포 정리]**:
   - 현재 15개 배포 중 운영 중인 프로덕션 1개(`dpl_2fCj335CkXbTpgaj9DuHiPLVDdUr`)와 연결된 도메인 alias 3개만 보존.
   - 과거 배포 14개 즉시 삭제하여 Vercel 백엔드 보관 부하 완화.
3. **[방어선 2: GitHub Actions & 배치 파일 `[skip ci]` 적용]**:
   - `daily-updates.yml`: 모든 자동 크롤링 커밋에 `[skip ci]` 적용.
   - `link-check.yml`: 링크 점검 커밋에 `[skip ci]` 적용.
   - `C:\Users\royal\Desktop\Sakamichi Box 업데이트.bat`: 수동 동기화 커밋에 `[skip ci]` 적용.

## 3. 영향 파일 및 설정
- Vercel API: `PATCH /v9/projects/prj_rCZPgPBdSXEk11GsVKVnz6RTczPS` (`commandForIgnoringBuildStep: "exit 0"`)
- `D:\drive\programming\window\Sakamichi Box\.github\workflows\daily-updates.yml`
- `D:\drive\programming\window\Sakamichi Box\.github\workflows\link-check.yml`
- `C:\Users\royal\Desktop\Sakamichi Box 업데이트.bat`

## 4. 정책 및 안전 경계
- **사이트 무중단**: 현재 프로덕션 배포(`dpl_2fCj335CkXbTpgaj9DuHiPLVDdUr`)는 그대로 유지되어 방문자 접속 및 기능 100% 정상 작동.
- **데이터 수집 유지**: 6시간 주기 공식 블로그 크롤링은 GitHub 레포지토리에 데이터 JSON으로 계속 최신화되나, 불필요한 Vercel 빌드만 건너뜀.
- **수동 배포 경로**: 향후 사이트 소스코드 변경 등으로 실제 새 배포가 필요할 때는 Vercel CLI `vercel --prod`를 사용하거나 Vercel 대시보드에서 `Ignored Build Step`을 일시 해제하면 됨.

## 5. 완료 조건 및 검증 방법
1. Vercel API 확인: `commandForIgnoringBuildStep`이 `"exit 0"`으로 등록되었는지 확인.
2. Vercel 배포 목록 확인: `sakamichi-hub`에 프로덕션 1개만 남고 14개가 정상 삭제되었는지 확인.
3. 운영 사이트 확인: `https://sakamichi-hub.vercel.app` HTTP 200 정상 응답 및 도메인 alias 정합성 확인.
4. 청구 주기 안내: Vercel 무료 플랜의 스토리지 누적치(GB-hours)는 현재 청구 주기가 종료될 때 정상 리셋됨을 사용자에게 안내.
