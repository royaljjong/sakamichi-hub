# 작업지시서 · 2026-10-19 · 정기 블로그 갱신 검증 실패 복구

## 제품 줄기와 사용자 의도

- 공식 블로그 최신 정보가 6시간 주기로 검증되어 저장소에 반영되는 흐름을 복구한다.
- GitHub Actions 실패 메일의 확인된 원인은 `latest-updates.json`의 `memberImage` URL 오류(2026-10-18 실행)와 200자 초과 제목(2026-10-14~15 실행)이다. Vercel CLI는 워크플로에 없다.

## 변경 범위와 연결

- `scripts/fetch/updates.ts`: 외부 게시물 정규화 지점에서 제목의 UTF-16 길이 상한과 사진 URL을 데이터 계약에 맞춘다.
- `scripts/fetch/updates.test.ts`: 외부 입력의 긴 제목, 이모지 경계, 상대/무효 사진 URL에 대한 회귀 검증을 추가한다.
- `src/lib/updates-schema.ts`와 UI의 계약은 유지한다. `memberImage: null`은 기존 대체 이미지 흐름으로 이어진다.
- `.github/workflows/daily-updates.yml`의 6시간 수집 → 데이터 검증 → 성공 시 커밋 순서는 유지한다.

## 실패·빈 상태, 회귀 위험

- 무효하거나 웹 주소가 아닌 사진은 `null`로 저장한다. 상대 사진 주소는 공식 게시물 URL 기준으로 해석하되 유효하지 않으면 버린다.
- 빈 제목과 URL만 있는 제목은 기존처럼 게시물에서 제외한다. 긴 제목은 앞부분을 보존해 200 UTF-16 코드 단위 이내로 제한하며 이모지 반쪽은 남기지 않는다.
- 위험: 사진 URL 해석 기준이 달라져 이미지 표시가 바뀔 수 있다. 스키마 검증과 회귀 사례로 확인한다. 외부 사이트 접속 실패는 검증 통과로 오인하지 않는다.

## 완료 조건과 검증 방법

1. 확인된 두 형태의 불량 입력을 정규화한 결과가 `RecentUpdate` 스키마를 통과한다.
2. `pnpm exec tsx --test scripts/fetch/updates.test.ts`, `pnpm data:validate`, `pnpm typecheck`를 통과한다.
3. 수정은 수집 정규화와 문서에 한정하고 자동 작업의 다음 실행 결과를 확인한다. 수동 워크플로 실행과 Vercel 재개는 범위 밖이다.

## 검증 결과

- `pnpm exec tsx --test scripts/fetch/updates.test.ts`: 3건 통과. 200자 제한과 이모지 경계, 상대 사진 URL, 무효/비웹 사진 URL 확인.
- `pnpm typecheck`: 통과.
- `pnpm data:validate`: 기존 저장 데이터와 실제 수집으로 생성한 56건 모두 통과.
- `pnpm exec tsx scripts/fetch/updates.ts`: 실제 공식 피드를 수집해 56건 저장, 이어서 검증 통과. 일부 Nitter 접속 실패는 비필수 소스 경고였고 작업은 완료됨. 검증용 데이터 파일 변경은 원래 저장소 상태로 복원함.
- `git diff --check`: 통과. ESLint는 저장소 설정에서 두 `scripts/fetch` 파일을 제외하므로 검사 대상이 아니었음.
- GitHub 다음 정기 실행 결과는 푸시 후 확인한다. 외부 사이트 응답의 변동까지 보장하지는 않는다.
