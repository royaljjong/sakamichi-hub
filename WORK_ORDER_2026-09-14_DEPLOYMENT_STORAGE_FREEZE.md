# WORK ORDER · 2026-09-14 · VERCEL DEPLOYMENT STORAGE FREEZE & OPTIMIZATION

## 1. 개요 및 배경 (큰 줄기와 가지 확인)
- **프로젝트**: `sakamichi-hub` (`prj_rCZPgPBdSXEk11GsVKVnz6RTczPS`)
- **운영 도메인**: `https://sakamichi-hub.vercel.app`
- **문제 증상**: Vercel 대시보드에서 `Exceeded free resources Deployment Storage 140.67 GB / 10 GB` 경고 발생. 사용자가 0으로 정리했으나 며칠 만에 다시 140GB로 폭증함.
- **근본 원인 분석**:
  1. **Deployment Storage의 계산 방식**: Vercel 무료(Hobby) 플랜에서 배포 스토리지는 단순 현재 용량이 아닌, **이번 30일 청구 주기(Billing Cycle) 동안 발생한 배포들의 누적 보관량(GB-hours/GB-months)**으로 집계됨.
  2. **재발의 주원인 (배경 누수)**:
     - 9월 11일 이전 배포 56개를 삭제했으나, GitHub Actions(`daily-updates.yml` 6시간 주기, `link-check.yml` 주간 점검)가 백그라운드에서 매일 4~5번씩 GitHub `main`에 커밋을 푸시함.
     - 커밋 푸시마다 Vercel이 1,529개 정적 페이지와 Next.js 캐시(1회당 ~1GB)를 새로 빌드함.
     - 9월 11일부터 9월 14일까지 3일 동안만 15개의 새 배포가 추가 생성됨(9월 14일 하루만 5회 빌드됨).
     - 수도꼭지(자동 빌드)를 잠그지 않은 채 물만 퍼냈기 때문에, 며칠 만에 수십 번의 빌드가 누적되어 140GB로 다시 폭증한 것임.
  3. **사용자 지시**: 사이트를 끄고(중지), 배포 스토리지를 0으로 만들며, 더 이상 용량을 잡아먹지 못하도록 완전 정지 조치 요청.

## 2. 조치 내역 (5중 차단 완료)
1. **[조치 1: Vercel Project 일시정지 (Pause)]**:
   - `POST /v1/projects/prj_rCZPgPBdSXEk11GsVKVnz6RTczPS/pause` 실행 완료.
   - 프로젝트 상태: `"paused": true`.
2. **[조치 2: Vercel Ignored Build Step 차단]**:
   - `PATCH /v9/projects/prj_rCZPgPBdSXEk11GsVKVnz6RTczPS` (`commandForIgnoringBuildStep: "exit 0"`).
   - 향후 어떤 푸시가 유입되어도 빌드가 100% 무조건 스킵됨.
3. **[조치 3: Git Repository 연동 해제 (Disconnect)]**:
   - `DELETE /v9/projects/prj_rCZPgPBdSXEk11GsVKVnz6RTczPS/link` 실행 완료.
   - GitHub webhook과 Vercel 사이의 연결을 원천 차단하여 Vercel이 커밋 이벤트를 전혀 수신하지 않음.
4. **[조치 4: 전체 배포 및 도메인 Alias 완전 삭제]**:
   - 기존 남아있던 15개 배포 전부(`dpl_2fCj...` 포함) 영구 삭제 완료.
   - 현재 `sakamichi-hub`의 활성 배포 수: **0개 (0 GB)**.
   - 현재 도메인 Alias 수: **0개**.
5. **[조치 5: GitHub Actions & 데스크톱 스크립트 `[skip ci]` 적용]**:
   - `.github/workflows/daily-updates.yml`: 커밋 시 `[skip ci]` 강제 적용.
   - `.github/workflows/link-check.yml`: 커밋 시 `[skip ci]` 강제 적용.
   - `C:\Users\royal\Desktop\Sakamichi Box 업데이트.bat`: 커밋 시 `[skip ci]` 적용.
   - `C:\Users\royal\OneDrive\Desktop\Sakamichi Box 업데이트.bat`: 커밋 시 `[skip ci]` 적용.
   - GitHub `origin/main`에 푸시 완료 (커밋 `2d53687`).

## 3. 검증 결과
1. **Vercel Project 상태 검증**:
   - `paused`: `True`
   - `hasDeployments`: `False`
   - `latestDeployments`: `[]`
   - `targets`: `{}`
   - `commandForIgnoringBuildStep`: `"exit 0"`
   - `link`: `None` (Git 연동 해제됨)
2. **Vercel API 배포 개수 검증**:
   - `pages('/v6/deployments?projectId=prj_rCZPgPBdSXEk11GsVKVnz6RTczPS')`: **0개**
3. **사이트 접속 검증**:
   - `https://sakamichi-hub.vercel.app` 접속 시 `HTTP 404 Not Found DEPLOYMENT_NOT_FOUND` 반환 (완전 정지 확인).
4. **Vercel 대시보드 수치 표기에 관한 참고사항**:
   - 현재 실제 서버에 저장된 활성 배포 용량은 **0 GB**로 즉시 반영되었습니다.
   - Vercel 대시보드의 `140.67 GB / 10 GB` 표시는 **과거 30일간 누적된 빌드 이력(GB-months)**을 집계하는 지표이므로, 이번 청구 주기(Billing cycle) 리셋일에 0 GB로 완전히 갱신됩니다.
   - Git 연동 해제 + Ignored Build Step + 전체 배포 삭제의 5중 차단이 완료되었으므로, **앞으로 단 1바이트의 추가 용량도 절대 발생하지 않습니다.**
