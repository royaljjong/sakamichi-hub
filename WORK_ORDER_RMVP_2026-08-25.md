# rMVP 1차 실행 작업지시서

## 변경 연결

- 데이터: 기존 이름·aliases·그룹 이름·provenance에서 검색 파생어와 커버리지를 계산한다. 원본 멤버 사실 데이터는 임의 수정하지 않는다.
- 검색: 인덱스 생성기 → `public/search-index.json` → 클라이언트 검색 → 결과 카드 연결을 함께 변경한다.
- SEO: 동일한 이름 유틸리티를 메타데이터, 본문, JSON-LD에 사용해 표현 불일치를 막는다.
- UI: 그룹 신뢰 패널, 검색 결과 그룹명, 멤버 별칭·출처 표시, 랭킹 제거.
- 디자인: semantic surface/card 토큰과 모바일 배경 강도만 조정한다.

## 영향 파일

- `src/lib/search.ts`, `scripts/build-search-index.ts`, `public/search-index.json`
- `src/app/[locale]/m/[memberId]/page.tsx`
- `src/components/search/SearchResults.tsx`, `src/components/group/GroupInsights.tsx`
- 신규 검색어·커버리지 유틸 및 컴포넌트
- `messages/{ja,ko,en}.json`, `src/app/globals.css`

## 실패·빈 상태

- aliases가 없어도 공식 4개 표기와 그룹명으로 검색 가능해야 한다.
- provenance URL이나 확인일이 없으면 출처 링크를 만들지 않고 미확인으로 표시한다.
- 이벤트·음반 0건은 그룹 자체가 비어 있다는 뜻으로 표시하지 않는다.
- 검색 인덱스 로딩 실패는 기존 오류 상태를 유지한다.

## 회귀 위험

- 454명 인덱스 크기 증가, 검색 과매칭, JSON-LD 중복명, 번역 키 누락, 클라이언트 번들 증가.
- 검색어 파생은 짧은 한 글자 결과가 많아질 수 있으므로 부분 검색은 유지하되 그룹·상태 필터를 함께 제공한다.

## 완료 조건과 검증

- 성·이름 일부, 별명, 한자·가나·한글·초성·로마자, 그룹명으로 내부 검색 결과가 나온다.
- 멤버 페이지 본문과 구조화 데이터에 검증된 대체 이름과 그룹명이 들어간다.
- 그룹 페이지가 데이터 커버리지와 확인일을 표시한다.
- 그룹 페이지의 영구 빈 랭킹 패널이 사라진다.
- `pnpm data:validate`, 검색 인덱스 생성, `pnpm typecheck`, `pnpm build`를 통과한다.

## 검증 결과

- 검색 인덱스 생성: 통과. 454명, 386KB.
- `search:verify`: 통과. 일본어 성 `矢田`, 한국어 성 `야다`, 로마자 성 `Yada`, 일본어·한국어·영문 그룹명, 실제 alias 검색 확인.
- `data:validate`: 통과. 16그룹·454명·이벤트 52건·싱글 256건.
- TypeScript `--noEmit`: 통과.
- 프로덕션 빌드: 통과. 정적 페이지 1,536개 생성, 검색 페이지 First Load JS 176KB로 기존 수준 유지.
- 정적 HTML 확인: 한국어 멤버 페이지에 별명·정보 출처·마지막 확인·그룹명 렌더링, JKT48 그룹 페이지에 `수집 중`과 대표 멤버 수록 안내 렌더링.
- 비교 페이지에 남아 있던 동일 수동 X 팔로워 TOP 3 노출도 제거해 랭킹 정책을 일치시켰다.
- 자동 브라우저 화면 검증: 로컬 CDP 데몬 버전 불일치로 두 차례 실패. 프로덕션 서버 HTTP 응답과 HTML 내용 검증으로 대체했으며 시각적 픽셀 검증은 미완료 위험으로 남긴다.
- 비차단 빌드 안내: 동적 OG 이미지의 Edge runtime이 해당 이미지 라우트 정적 생성을 비활성화한다는 기존 안내 1건.

## 후속 실행 — LIVE·TikTok 로고 대체 이미지

- 의도: 포스터가 없는 LIVE 카드와 개인 사진이 없거나 불안정한 TikTok 채널 카드의 빈 시각 영역을 그룹 로고로 채워 그룹 식별성을 유지한다.
- 변경 범위: 홈 포털의 LIVE 미디어 영역, TikTok 채널 원형 이미지 영역, 관련 스타일. 이벤트·멤버 원본 데이터와 외부 이미지 저장 방식은 변경하지 않는다.
- 연결: `event.groupIds[0]` 또는 `member.primaryGroupId` → `groupMap` → `group.logoUrl` → 로고 이미지 → 로고 로드 실패 시 기존 LIVE/문자 대체 UI.
- 실패·빈 상태: 그룹 또는 로고 URL이 없거나 외부 이미지가 실패하면 LIVE 기본 카드나 멤버 글리프로 되돌아간다. 깨진 이미지 아이콘을 노출하지 않는다.
- 회귀 위험: 가로형 로고의 잘림, 밝은 로고의 대비 부족, 외부 Wikimedia 응답 실패, 접근성 대체 텍스트 중복.
- 완료 조건: 포스터 없는 LIVE 카드에 그룹 로고가 보이고, TikTok 멤버 카드에는 개인 사진 유무와 관계없이 그룹 로고가 보이며, 로고 실패 시 안전한 대체 UI가 유지된다.
- 검증 방법: TypeScript 검사, 프로덕션 빌드, 실행 화면 또는 정적 출력에서 두 영역 확인.

## 폐기 이력 — 계정별 비공개 문의함 (최종 UX에서 사용하지 않음)

### 사용자 의도와 기대 흐름

- 공개된 운영자 개인 이메일을 모든 사용자 노출면에서 제거한다.
- 사용자는 `아이디 생성 → 비밀번호 설정 → 로그인 → 내 문의 작성·목록·상세 확인` 흐름을 사용한다.
- 운영자는 관리자 권한으로 모든 문의를 읽고 답변하며, 일반 사용자는 자신 소유 행만 읽는다.

### 변경 범위와 연결

- UI: `/[locale]/contact`를 이메일 안내 페이지에서 로그인·가입·내 문의 게시판으로 전환한다.
- 인증: Supabase Auth에 비밀번호를 위임하고 브라우저·서버 세션을 쿠키로 연결한다. 화면의 아이디는 정규화된 내부 로그인 식별자로 변환하되 이메일을 사용자에게 요구하거나 공개하지 않는다.
- 데이터: `inquiries`, `inquiry_admins` 테이블과 사용자 소유권·관리자 권한 RLS를 추가한다.
- 정책: 개인정보처리방침의 수집 정보와 보존 설명을 실제 계정·문의 저장 구조에 맞춘다.
- 문서: 광고 신청 안내·소개 페이지에 남은 실제/예시 이메일 문자열도 제거한다.

### 실패·빈 상태

- Supabase 환경 변수가 없으면 문의 내용을 받지 않고 안전한 설정 대기 안내를 표시한다.
- 로그인 실패, 중복 아이디, 짧은 비밀번호, 빈 제목·본문, DB 쓰기 실패를 각각 사용자에게 알린다.
- 문의가 없으면 비공개 빈 상태와 새 문의 작성 동작을 표시한다.
- 세션 만료 시 데이터 대신 로그인 화면으로 돌아간다.

### 보안·회귀 위험

- `anon` 역할에는 문의 테이블 권한을 부여하지 않는다.
- `authenticated`에는 필요한 작업만 명시적으로 부여하고, 모든 SELECT/INSERT/UPDATE 정책에 소유권 또는 관리자 판정을 둔다.
- 관리자 판정에 사용자 수정 가능 metadata를 사용하지 않는다.
- 서비스 역할 키는 클라이언트 코드와 `NEXT_PUBLIC_*` 환경 변수에 두지 않는다.
- 공개 정적 생성 중심이던 사이트에 인증 쿠키·동적 렌더링이 추가되므로 sitemap, locale middleware, AdSense 공개 페이지 동작을 회귀 확인한다.

### 완료 조건과 검증

- 저장소의 공개 소스·안내 문서에 운영자 개인 이메일이 남지 않는다.
- 비로그인 사용자는 문의 데이터에 접근할 수 없다.
- 사용자 A는 A의 문의만, 사용자 B는 B의 문의만 조회 가능하도록 RLS 테스트가 정의된다.
- 운영자는 관리자 테이블에 등록된 경우에만 전체 문의와 답변 수정이 가능하다.
- 환경 변수 미설정 상태에서도 빌드가 통과하고 안전한 설정 안내가 렌더링된다.
- 환경 연결 후 가입·로그인·작성·조회·관리자 답변을 실제 두 사용자로 검증한다.

### 실행 결과 (2026-08-25)

- 공개 이메일 제거: 통과. 저장소 공개 소스에서 개인 이메일, 예시 이메일, `mailto:` 검색 결과 0건.
- 구현: 아이디·비밀번호 가입/로그인, 자기 문의 작성·목록·답변 확인, 관리자 전체 목록·답변 입력 UI를 추가했다.
- DB 보안 설계: `inquiries`와 서버 관리형 `inquiry_admins`, 명시적 GRANT, RLS 소유권/관리자 정책, 인덱스와 pgTAP 정책 구조 테스트를 migration으로 추가했다.
- 안전한 미설정 상태: 통과. Supabase 공개 환경 변수 없이는 입력 폼을 렌더링하지 않고 설정 중 안내만 표시한다.
- LIVE/TikTok 로고: 포스터 없는 LIVE 카드에 그룹 로고를 넣고, TikTok 채널 원형 이미지는 개인 사진 대신 그룹 로고를 우선 표시하도록 변경했다. 로고 실패 시 기존 글리프 대체가 유지된다.
- `pnpm typecheck`: 통과.
- `pnpm build`: 통과. 정적 페이지 1,536개 생성.
- 로컬 실행: `/ko/contact`, `/ko` HTTP 200. 문의 설정 안내, LIVE 로고 마크업, TikTok 섹션 확인.
- 운영 배포: Vercel production READY, `https://sakamichi-hub.vercel.app` 별칭 갱신. 운영 `/ko/contact` HTTP 200, 개인 이메일 미노출, 비공개 문의함 설정 안내 확인. 배포 후 오류 로그 0건.
- 미완료 외부 연결: Vercel에 Supabase 환경 변수가 없고 로컬 Supabase CLI가 프로젝트에 인증되지 않아 migration 적용과 실제 두 사용자 RLS 검증은 수행하지 못했다. `supabase/README.md`의 프로젝트 연결·환경 변수·관리자 UUID 등록 후 반드시 검증한다.
- 자동 브라우저 검증: `agent-browser`가 일반 실행과 `--no-sandbox` 실행 모두 응답 없이 멈춰 HTTP/정적 HTML 검증으로 대체했다.

## 폐기 이력 — 무회원 문의번호 방식 (최종 UX에서 사용하지 않음)

### 변경 이유

- 사이트에 회원 전용 기능이 없으므로 문의 하나를 위해 계정을 만드는 흐름은 제품 범위에 비해 과하다.
- 기존 계정 기반 구현은 Supabase 미연결 상태라 실제 사용자 가입이나 데이터 저장이 시작되지 않았다.

### 기대 흐름

- 사용자는 가입 없이 문의 유형·제목·내용·문의 비밀번호를 입력한다.
- 등록 성공 시 무작위 문의번호를 화면에 한 번 명확히 보여주고 복사할 수 있게 한다.
- 사용자는 문의번호와 문의 비밀번호를 입력해 해당 문의 한 건과 운영자 답변만 조회한다.
- 운영자는 공개 사이트가 아닌 Supabase Dashboard에서 전체 문의를 확인하고 답변한다.

### 데이터·UI·명령 연결

- UI: 회원가입/로그인/내 목록을 제거하고 `문의 등록`과 `문의 조회` 두 탭만 둔다.
- DB: 인증 사용자 소유권 테이블을 폐기하고, 비밀번호 해시와 고엔트로피 공개 문의번호를 가진 문의 테이블로 교체한다.
- API: 테이블 직접 접근은 `anon`, `authenticated` 모두 금지하고 `create_private_inquiry`, `read_private_inquiry` RPC만 최소 권한으로 공개한다.
- 운영: 답변은 Dashboard에서 `admin_reply`, `status`, `updated_at`만 수정한다.

### 실패·빈 상태와 안전 경계

- Supabase 환경 변수가 없으면 입력 폼 대신 설정 중 안내만 표시한다.
- 비밀번호는 8자 이상, 제목 120자 이하, 본문 5,000자 이하로 제한하고 DB에서도 재검증한다.
- 잘못된 문의번호와 비밀번호는 같은 오류를 반환해 번호 존재 여부를 노출하지 않는다.
- 조회 RPC는 정확히 한 건만 반환하며 목록·검색·페이지네이션 기능을 제공하지 않는다.
- 비밀번호 원문, 운영자 이메일, 서비스 역할 키는 브라우저·로그·DB에 저장하지 않는다.

### 완료 조건

- 가입·로그인 관련 UI와 코드가 공개 문의 흐름에서 제거된다.
- 문의 등록 성공 시 문의번호가 반환되고, 올바른 번호·비밀번호 조합만 한 건을 조회한다.
- 테이블 직접 권한이 없고 RPC 실행 권한만 명시적으로 부여된다.
- 타입 검사와 빌드가 통과하고 운영 사이트에서 개인 이메일이 계속 비공개다.

### 배포 제외 경계

- 로컬 빌드 복구본과 임시 산출물이 Vercel 업로드에 포함되지 않도록 `.vercelignore`에서 `.next`, `.tmp`, `node_modules`, `.git`, `supabase/.temp`를 제외한다.

## 최종 UX 정정 — 게시글형 임시 아이디·비밀번호

- 자동 문의번호 발급은 사용자 의도와 다르므로 폐기한다.
- 가입 없이 문의를 작성하면서 사용자가 임시 아이디와 비밀번호를 직접 정한다.
- 같은 아이디·비밀번호 조합을 다시 입력하면 그 조합으로 작성한 문의 목록과 답변만 조회한다.
- 임시 아이디와 비밀번호는 계정이 아니며 쿠키 세션, 프로필, 회원 목록을 생성하지 않는다.
- DB에는 정규화한 아이디의 SHA-256 해시와 bcrypt 비밀번호 해시만 저장한다.
- 아이디 또는 비밀번호가 틀린 경우 동일한 빈 결과 메시지를 사용한다.

### 최종 구현·검증 결과

- 자동 문의번호 UI/RPC를 제거하고 사용자가 직접 정하는 임시 아이디·비밀번호 등록/조회로 교체했다.
- 같은 아이디·비밀번호 조합으로 작성한 문의를 최신순 최대 50건 반환하며 다른 조합은 빈 결과다.
- 임시 아이디는 정규화 후 SHA-256 해시, 비밀번호는 개별 bcrypt 해시만 저장한다. 원문 아이디·비밀번호 열은 없다.
- 공개 역할의 테이블 직접 권한은 없고 생성/조회 RPC만 실행할 수 있다.
- `pnpm typecheck`: 통과.
- Vercel 원격 production build: 통과. 1,536개 페이지 생성, contact First Load JS 238KB.
- 운영 배포: `dpl_5qsqJ8yQVbCkSDs8vFaZ8gdX5tfv` READY, 운영 별칭 갱신.
- 운영 `/ko/contact`: HTTP 200, 개인 이메일·`mailto:` 미노출, 오류 로그 0건.
- Supabase 외부 프로젝트가 연결되기 전에는 입력을 받지 않는 `설정 중` 상태를 유지한다.

### 폐기 이력의 구현 기록 — 자동 문의번호 방식 (2026-08-26, 현재 사용하지 않음)

- 회원가입·로그인·세션·사용자별 목록·관리자 공개 화면 코드를 제거했다.
- 문의 등록/조회 두 탭, 12자리 무작위 문의번호, 문의번호 복사, 비밀번호 일치 시 한 건 조회 UI를 구현했다.
- `inquiries` 테이블 직접 권한은 공개 역할에서 모두 회수하고, 제한된 생성·조회 RPC 실행 권한만 부여했다.
- 문의 비밀번호는 `pgcrypto` bcrypt 해시로만 저장하며 입력 길이, 제목·본문 길이, 유형을 DB와 UI 양쪽에서 검사한다.
- 잘못된 번호와 비밀번호는 같은 사용자 오류로 처리하고 목록 조회 RPC는 제공하지 않는다.
- 운영자 답변은 Supabase Dashboard에서 `status`, `admin_reply`, `updated_at`만 수정하도록 운영 문서를 갱신했다.
- `@supabase/ssr`와 Auth 세션 코드를 제거하고 세션을 만들지 않는 `@supabase/supabase-js` 클라이언트만 유지했다.
- `pnpm typecheck`: 통과.
- 로컬 `next build`: 외부 이미지 서버의 반복적인 `ECONNRESET/ECONNABORTED`로 완료 전 중단. 코드/타입 오류는 발생하지 않았다. 중단 전 출력은 `.tmp/.next-stale-20260826`에 복구 가능하게 보관했다.
- Vercel 원격 production build: 통과. 1,536개 정적 페이지 생성, contact First Load JS 243KB → 238KB 감소.
- 운영 배포: `dpl_9nvsz1aWPE76aLV5UEsd52X5d6JQ` READY, `https://sakamichi-hub.vercel.app` 별칭 갱신.
- 운영 확인: `/ko/contact` HTTP 200, 운영자 개인 이메일·`mailto:`·회원가입 화면 미노출, 배포 후 오류 로그 0건.
- 외부 연결 대기: Supabase 프로젝트와 Vercel 환경 변수가 아직 없어 운영 문의 입력은 안전한 `설정 중` 상태다. 외부 계정 생성/프로젝트 선택과 키 발급은 사용자 권한·비용 선택이 필요한 작업이라 임의 수행하지 않았다.

## 정합성 후속 작업지시 — 성능·LIVE 실패·문의 방어 (2026-08-26)

### 변경 범위와 연결

- 데이터/UI: 홈에 전체 `Member` 객체를 직렬화하지 않고 홈에서 사용하는 최소 필드만 전달한다. 검색·멤버 상세 원본은 유지한다.
- UI/실패 상태: LIVE 포스터의 누락과 로드 실패가 같은 브랜드 대체 카드로 수렴하게 한다.
- DB/명령: 공개 문의 생성의 `count → insert`를 transaction advisory lock으로 직렬화하고 동일 임시 아이디의 시간당 생성 상한을 둔다.
- 테스트: pgTAP에 공개 역할의 직접 테이블 권한 부재, 올바른/잘못된 비밀번호 조회, 입력 제한을 추가한다.
- 운영/문서: 폐기된 계정·문의번호 단계를 명시하고 AdSense/README/인수인계의 최종 흐름을 맞춘다.

### 실패·빈 상태와 회귀 위험

- 최소 홈 멤버 타입에 생일·이름·아바타·공식 YouTube/TikTok 링크가 누락되면 기존 레일이 깨질 수 있으므로 타입 검사와 화면 빌드로 확인한다.
- 포스터 실패 전환은 링크 클릭 영역과 그룹 로고의 대체 실패를 보존해야 한다.
- 동일 임시 아이디 상한은 실제 사용자가 지나치게 많은 문의를 남길 때 안내 가능한 일반 오류로 수렴한다.
- DB 프로젝트가 아직 연결되지 않았으므로 migration/pgTAP의 원격 실행은 통과로 기록하지 않는다.

### 완료 조건과 검증

- 운영 빌드의 홈 HTML 크기가 기존 1,117,167바이트보다 유의미하게 감소한다.
- 깨진 LIVE 이미지 URL을 주입했을 때 placeholder가 나타난다.
- 문의 생성 제한이 동시 요청에서도 상한을 넘지 않고, 동일 아이디 행 누적으로 조회 비용이 무제한 증가하지 않는다.
- `pnpm typecheck`, 데이터·검색 검증, `pnpm build`가 통과한다.

### 구현·검증 결과

- 홈 클라이언트에 전달하는 멤버 객체를 이름·소속·상태·생일·이미지·아바타·YouTube/TikTok 링크 필드로 축소했다. 검색 및 상세 페이지의 원본 데이터는 유지했다.
- 로컬 생성 `/ko` HTML은 534,256바이트로, 작업 전 운영 응답 1,117,167바이트보다 582,911바이트(약 52.2%) 감소했다.
- LIVE 포스터에 지연 로딩·referrer 정책·`onError` 상태를 연결해 깨진 URL도 그룹 로고/브랜드 placeholder로 전환되게 했다.
- 새 migration `20260826130102_harden_private_inquiry_limits.sql`에 transaction advisory lock, ID당 50건 상한, 조회 입력 길이 방어, `extensions.pgcrypto` 명시 호출을 추가했다.
- pgTAP 계획을 4개에서 10개로 확장해 anon 직접 SELECT/INSERT 차단, RPC 실행 권한, 정상 생성, 일치/불일치 비밀번호 조회를 검사하게 했다.
- `pnpm typecheck`: 통과.
- `pnpm data:validate`: 통과. 16개 그룹, 454명, 이벤트 52개, 싱글 256개.
- `pnpm search:verify`: 통과. 일본어·한국어·로마자 성, 다국어 그룹명, 별칭 검색 확인.
- `pnpm build`: 통과. 외부 이미지 서버의 `ECONNRESET` 재시도가 있었으나 컴파일·타입 검사·1,536개 정적 페이지 생성까지 완료했다. 홈 First Load JS 177KB, 문의 238KB.
- 프로젝트에 ESLint 실행 파일이 없어 별도 lint 명령은 수행하지 못했다. Next 빌드 내 lint/type 단계는 통과했다.
- Docker 엔진과 연결된 Supabase 프로젝트가 없어 새 migration 적용 및 pgTAP 실DB 실행은 미검증이다. 운영 문의 기능 활성화 전 필수로 실행한다.

## Supabase CLI 운영 연결 실행 (2026-08-26)

### 의도와 범위

- 사용자 승인에 따라 기존의 다른 서비스 프로젝트를 재사용하지 않고 `sakamichi-box` 전용 Supabase 프로젝트를 서울 리전에 생성한다.
- DB 비밀번호는 CLI 실행 중 무작위 생성해 프로젝트 생성·연결·migration 적용에만 사용하고 저장소, 문서, 터미널 출력에 남기지 않는다.
- migration 적용 후 공개 역할의 테이블 직접 권한, RPC 실행 권한, 정상/오류 조회를 실DB에서 검증한다.
- 검증이 통과한 경우에만 publishable URL/key를 Vercel Production 환경에 연결하고 재배포한다. secret/service-role/DB 비밀번호는 브라우저 환경 변수에 넣지 않는다.

### 실패·회귀 경계

- 프로젝트 생성 후 migration 또는 테스트가 실패하면 Vercel 환경 변수를 연결하지 않아 운영 입력을 계속 `설정 중`으로 유지한다.
- 기존 Supabase 네 프로젝트와 Vercel의 다른 프로젝트 설정은 변경하지 않는다.
- 새 프로젝트 생성은 되돌릴 수 있는 별도 리소스지만 삭제는 이번 실행 범위에 포함하지 않는다.

### 완료 조건

- 전용 프로젝트 연결과 migration 목록이 일치한다.
- DB 테스트와 advisor 결과에서 공개 문의 데이터 노출 결함이 없다.
- Vercel에는 `NEXT_PUBLIC_SUPABASE_URL`과 publishable key만 등록된다.
- 운영 `/ko/contact`에서 폼이 표시되고 등록·조회 smoke test 후 테스트 문의는 제거하거나 명확히 테스트 데이터로 기록한다.

### CLI 실행 결과

- Supabase CLI 로그인과 조직 `zrnjqdfkutcpjcljgmaa` 접근을 확인했다.
- `sakamichi-box`, 서울 `ap-northeast-2`, 무작위 일회성 DB 비밀번호로 프로젝트 생성을 요청했다.
- 계정 소유자의 활성 무료 프로젝트 한도 2개가 `kurashi-compass`, `kurashi-compass-staging`으로 모두 사용 중이라 API가 생성을 거부했다.
- Sakamichi 프로젝트·DB·migration은 생성/적용되지 않았고 기존 네 프로젝트도 변경하지 않았다.
- 계속하려면 기존 활성 프로젝트 하나를 pause/delete하거나 조직 요금제를 업그레이드한 뒤 같은 CLI 절차를 재개해야 한다.
- 후속 확인: 현재 Supabase CLI의 `projects` 하위 명령은 `list/create/api-keys/delete`만 제공하고 pause는 제공하지 않는다. 공식 Management API에는 `POST /v1/projects/{ref}/pause`가 있지만 별도 PAT/OAuth 토큰이 필요하며 CLI 로그인 자격 증명을 추출·노출해 우회하지 않는다. 따라서 `kurashi-compass-staging` pause는 Dashboard에서 수행해야 한다.

### 인수인계 갱신 실행 단위

- `CODEX_HANDOVER.md`를 2026-08-26 기준의 단일 현행 상태 문서로 갱신한다.
- 코드·성능·문의 보안 보완의 완료 범위와 실제 검증 결과를 기록한다.
- Supabase 프로젝트 생성 실패 원인, 기존 프로젝트 무변경, 운영 문의의 `설정 중` 상태를 최상단에 명확히 표시한다.
- 다음 작업자는 기존 Kurashi 프로젝트를 임의로 pause/delete/재사용하지 않고 사용자 결정 후에만 외부 연결을 재개한다.
- 초기 구조 기록인 `HANDOVER.md`는 현행 계약 문서의 날짜와 최신 규모만 바로잡고 상세 중복 서술은 확장하지 않는다.

## 문서 정합성 및 두 번째 조직 운영 연결 실행 (2026-08-30)

### 변경 범위와 연결

- 제품 기획: `PRODUCT_RMVP_PLAN.md`에 문서 신뢰와 전용 문의 인프라가 제품 큰 줄기에서 차지하는 위치, 안전 경계, 비범위를 기록한다.
- 문서: `README.md`, `HANDOVER.md`, `PLAN_REPORT_2026-08-23_rev1.md`, `AUDIT_AND_REBUILD_PLAN.md`, `ADSENSE_APPLICATION_GUIDE.md`, `CODEX_HANDOVER.md`의 권위·역사 상태·수치·후속 명령을 정렬한다.
- UI: `src/app/[locale]/contact/page.tsx`의 계정 기반 잔존 문구를 임시 아이디 기반 무회원 문의 설명으로 교체한다.
- Supabase: 조직 `fnieuabteduvjdlpyott`(`seceond Organization`)에 `sakamichi-box` 전용 프로젝트를 `ap-northeast-2`로 생성하고 저장소를 연결한다. 기존 조직과 기존 프로젝트는 읽기 확인 외에는 변경하지 않는다.
- 명령 흐름: 프로젝트 생성 → 연결 → migration dry-run/push → migration 목록 → pgTAP → DB advisor → 공개 RPC·직접 테이블 권한 확인 순서로 진행한다.

### 실패·빈 상태와 회귀 위험

- 생성·migration·테스트 중 하나라도 실패하면 Vercel 환경 변수 등록과 운영 활성화를 중단하고 문의 페이지는 `설정 중` 상태를 유지한다.
- 새 프로젝트의 Data API 자동 노출 정책이 변경된 상태를 고려해 테이블 직접 접근은 금지하고 RPC 실행 권한만 명시적으로 검증한다.
- DB 비밀번호와 secret/service-role key는 저장소·문서·명령 출력에 남기지 않는다. 브라우저에는 URL과 publishable key만 허용한다.
- 역사 문서의 원문 증거는 보존하되 문서 상단과 섹션에 역사 기준선임을 표시한다. 현재 완료 상태처럼 읽히는 체크리스트만 정리한다.
- 문서 수치 갱신은 현재 데이터와 검증 명령 결과를 근거로 하며, 미실행 항목은 완료로 표시하지 않는다.

### 완료 조건과 검증 방법

- 문의 안내 세 언어가 회원 계정이 아닌 임시 아이디 방식과 일치한다.
- README에서 현행 계약과 역사 참고 문서의 역할이 충돌하지 않는다.
- 전용 프로젝트가 올바른 조직·서울 리전에 생성되고 두 migration이 원격 이력과 일치한다.
- pgTAP, DB advisor, 공개 역할 권한·RPC smoke test가 통과한다.
- `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm build`를 실행하고 실제 결과를 이 문서 및 `CODEX_HANDOVER.md`에 반영한다.
- Vercel 연결은 DB 검증 통과 후 공개 URL·publishable key만 등록하며, 재배포와 운영 smoke test를 별도로 기록한다.

### 사전 확인

- Supabase CLI `2.116.0`과 로그인 상태를 확인했다.
- 두 번째 조직에는 `smarttube-box` 한 프로젝트만 있으며 `sakamichi-box`는 아직 없다.
- 2026-08-30 기준 Supabase 변경사항상 새 `public` 테이블은 Data API에 자동 노출되지 않을 수 있으므로 migration의 명시 권한과 실RPC 검증을 완료 조건으로 유지한다.

### 구현 중 확인된 방향 차이 — 새 프로젝트의 `pgcrypto` 스키마

- 원격 dry-run은 두 migration만 적용 대상으로 확인했으나 첫 push가 `digest(bytea, unknown) does not exist`로 트랜잭션 중단됐다. 원격 migration 이력에는 적용 완료 항목이 생기지 않았다.
- 새 프로젝트에서는 `pgcrypto`가 `extensions` 스키마에 설치되므로, 첫 migration이 `search_path = ''`인 함수 안에서 비정규화 `digest`·`crypt`·`gen_salt`를 호출하는 기존 전제가 성립하지 않는다.
- 변경 방향: 아직 어떤 원격 환경에도 적용되지 않은 첫 migration부터 `extensions` 스키마 생성, `pgcrypto with schema extensions`, `extensions.digest/crypt/gen_salt`를 사용하도록 고친다. 두 번째 hardening migration도 같은 전제를 유지하되 이미 올바른 스키마일 때 불필요한 이동을 시도하지 않게 정리한다.
- 영향 범위는 두 문의 migration과 원격 검증뿐이다. 테이블 계약, RPC 시그니처, RLS·권한, UI 방식은 바꾸지 않는다.
- 수정 후 dry-run → push → migration list를 다시 수행하고, 실패가 반복되면 운영 연결과 Vercel 등록을 중단한다.

### 검증 중 확인된 방향 차이 — 원격 pgTAP 실행기

- `supabase test db --linked`는 원격 연결과 별개로 로컬 Docker 테스트 러너를 요구해 Docker Desktop 미실행 상태에서 사용할 수 없었다.
- CLI의 Management API 기반 `db query --linked --file`로 동일한 트랜잭션·rollback 테스트를 실행한다. 새 프로젝트에는 pgTAP이 기본 설치되지 않아 검증 동안만 `extensions` 스키마에 설치하고 완료 후 제거한다.
- 테스트 파일은 트랜잭션 범위에서 `extensions, public` search path를 명시한다. 앱 테이블·RPC 계약과 운영 migration 이력에는 pgTAP 의존성을 추가하지 않는다.

### 완료 직전 안전 경계 재대조 — 운영 활성화 플래그

- 전용 프로젝트·migration·RPC 검증과 Vercel 공개 변수 등록은 완료됐지만, 제품 기획은 CAPTCHA 또는 네트워크 단위 방어 전 운영 활성화를 완료로 간주하지 않는다.
- 현재 DB의 전역 30건/분과 ID당 50건 상한은 저장·bcrypt 비용을 제한하지만 CAPTCHA나 네트워크 단위 방어를 대신했다고 해석하지 않는다.
- URL·publishable key 등록 상태와 실제 사용자 입력 허용을 분리하기 위해 `NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED=true`일 때만 문의 보드를 활성화한다. 변수 미설정·오타·`false`는 안전한 `설정 중` 상태다.
- `.env.example`과 Supabase 클라이언트 구성 판정만 변경하며, 기존 공개 변수·DB·다른 페이지는 변경하지 않는다.
- 로컬·원격 재빌드와 운영 `/ko/contact` HTTP 응답에서 `설정 중` 표시 및 폼 비노출을 확인한다. CAPTCHA 또는 네트워크 방어 구현은 별도 기획·작업지시 후 활성화한다.

### 2026-08-30 실행·검증 결과

- Supabase CLI `2.116.0`; 조직 `fnieuabteduvjdlpyott`에 `sakamichi-box`(ref `pdfxiubzwaudqebbgyrg`, `ap-northeast-2`) 생성·연결 완료. 기존 프로젝트 무변경.
- migration dry-run에서 2개 대상 확인. 최초 push는 첫 migration의 비정규화 `digest()`가 새 프로젝트의 `extensions.pgcrypto`와 맞지 않아 트랜잭션 중단됐고 원격 이력은 생성되지 않았다. migration 수정 후 두 파일 적용 및 local/remote 이력 일치 확인.
- `supabase test db --linked`는 Docker Desktop 미실행으로 사용할 수 없어 Management API의 `db query --linked --file`로 같은 rollback pgTAP 파일을 실행했다. 10개 테스트 통과.
- publishable-key REST smoke: 등록 성공, 정상 조합 1건, 잘못된 비밀번호 0건, 직접 테이블 요청 HTTP 401. 테스트 행 0건·임시 pgTAP 미설치 상태로 정리 확인.
- DB advisor: performance WARN/ERROR 없음. security는 공개 문의 계약상 익명·authenticated 역할에 명시적으로 허용한 두 `SECURITY DEFINER` RPC에 대해 의도된 WARN 4건. 테이블 직접 권한 차단은 pgTAP과 REST로 확인.
- Vercel Production에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 등록. secret/service-role/DB 비밀번호 미등록.
- `pnpm typecheck`: 통과. `pnpm data:validate`: 통과(16그룹·454명·이벤트 49건·싱글 256건). `pnpm search:verify`: 통과(454명). `pnpm build`: 통과(1,536개 정적 페이지, 홈 177KB, 문의 238KB). Edge runtime 정적 생성 제한 안내 1건은 기존 비차단 안내.
- 최종 Vercel 배포 `dpl_BBvr8RvmFj1zrvFomzWyMakLtN77`: READY, `https://sakamichi-hub.vercel.app` alias 연결. 운영 HTTP 검증은 200, 임시 아이디·무회원 안내 존재, `설정 중` 존재, `<form>` 비노출.
- `agent-browser` 시각 검증은 운영 URL 연결이 OS 10060으로 타임아웃되어 완료하지 못했다. 대신 운영 HTTP 응답과 Vercel READY/빌드 로그를 확인했으며, 활성화 전 브라우저 접근성·상호작용 검증은 남은 필수 항목이다.
- 완료 판정: 전용 DB·migration·Vercel 공개 구성 등록은 완료. CAPTCHA/네트워크 방어와 실제 사용자 입력 활성화는 미완료이며 활성화 플래그를 설정하지 않았다.

## 서버 경계·Vercel Firewall 실행 단위 (2026-08-30)

### 의도와 변경 범위

- 브라우저의 Supabase RPC 직접 호출을 `/api/inquiries/create`, `/api/inquiries/read` 서버 경로로 단일화한다.
- 새 migration으로 `anon`, `authenticated`의 inquiry RPC 실행 권한을 회수하고 `service_role`만 허용한다.
- 서버는 요청 크기·필드 길이·category를 재검증하고, 비활성화나 외부 오류 때 DB 상세를 노출하지 않는다.
- Vercel에는 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `PRIVATE_INQUIRY_ENABLED`를 server-only로 등록한다. production 활성화 플래그는 아직 켜지 않는다.
- Firewall은 두 POST 경로만 IP 기준으로 집계한다. production log draft → 사용자 publish·트래픽 검토 → preview enforcement → production rate limit 순서로 승격한다.

### 실패·빈 상태와 회귀 위험

- server secret 미설정·비활성화·Supabase 실패는 일반 오류 또는 설정 중 상태만 반환한다.
- 권한 회수 후 publishable key 직접 RPC가 거부되는지 확인한다.
- Firewall draft는 전체 사이트가 아니라 정확한 두 POST 경로만 대상으로 하며 production publish는 사용자 확인 없이 수행하지 않는다.
- bcrypt 조회 비용을 고려해 create와 read를 별도 bucket으로 두고, 실제 traffic 확인 전 기준을 낮추지 않는다.

### 완료 조건과 검증

- `anon`·`authenticated` 직접 RPC는 거부되고 `service_role` 서버 호출만 성공한다.
- API create/read 정상·오류·비활성 상태와 입력 제한을 검증하고 테스트 행을 제거한다.
- 타입·데이터·검색·빌드가 통과한다.
- Firewall draft 조건과 영향 범위를 `diff`로 확인하고 사용자에게 publish 단계와 traffic URL을 인계한다.
- production은 사용자가 Firewall log publish와 단계별 검토를 승인할 때까지 `설정 중` 상태를 유지한다.

### 구현 중 확인된 방향 차이 — i18n middleware와 API

- 서버 API 배포 후 POST smoke가 예상한 비활성 503 대신 404를 반환했다. 포괄 i18n matcher가 `/api/*`를 locale 경로로 처리한 것이 원인이다.
- middleware에서 `/api/`를 명시적으로 `NextResponse.next()` 처리한다. 루트 rewrite, locale 페이지, 정적 자산 matcher는 변경하지 않는다.
- API 비활성 503과 기존 `/ko/contact` 200·설정 중 상태를 재확인한 뒤에만 DB RPC 권한 회수를 진행한다.

### 서버 경계·Firewall 실행 결과

- Vercel server-only 변수 3개를 등록하고 production 배포 `dpl_AuoSoy1iMgJToN3uN8X3SLEYePbU`를 READY로 확인했다. create/read API는 비활성 상태에서 각각 503이다.
- migration `20260830085201_restrict_private_inquiry_rpcs_to_service_role.sql` 적용 및 이력 일치. publishable 직접 RPC는 create/read 모두 401이다.
- secret을 메모리로만 주입한 Node API smoke는 create 201, read 1건, invalid 400. 테스트 행 제거 후 DB 문의 0건이다.
- pgTAP 12개, DB security/performance advisor, typecheck, 1,538경로 build, data validation(16그룹·454명·이벤트 44건·싱글 256건), search verification 통과. contact First Load JS는 175KB다.
- Firewall draft `rule_log_inquiry_create_traffic_oJnJkJ`, `rule_log_inquiry_read_traffic_lydFnL` 생성. exact path + POST + production, action `log`, valid이며 미게시 상태다.
- 사용자 승인 단계: 사용자가 `vercel firewall publish --yes`를 직접 실행한다. 이후 traffic 확인 전에는 rate limit이나 운영 활성화로 승격하지 않는다.
- traffic URL: `https://vercel.com/royaljjongs-projects/sakamichi-hub/firewall/traffic?filter=rule_log_inquiry_create_traffic_oJnJkJ`
- traffic URL: `https://vercel.com/royaljjongs-projects/sakamichi-hub/firewall/traffic?filter=rule_log_inquiry_read_traffic_lydFnL`

### Preview IP rate-limit 실행 단위 (2026-08-30)

- production의 create/read 로그 규칙은 그대로 유지한다. 사용자가 두 exact POST 경로만 매칭됨을 확인했다.
- 별도 preview 규칙으로 create는 IP당 60초 20회, read는 IP당 60초 60회를 허용하고 초과 요청만 429로 제한한다. 정상 예상치의 5~10배인 완화된 시작값이며 지역별 카운터 특성을 감안한다.
- 경로·POST·preview 조건을 모두 AND로 묶어 운영 사용자, 다른 API, GET 요청에는 영향을 주지 않는다.
- 초안 생성 후 규칙 상세와 diff를 검사하고 사용자가 직접 publish하기 전에는 적용된 것으로 간주하지 않는다.
- publish 후 Preview 배포에서 정상 503(기능 비활성), 임계 초과 429, Production의 기존 503·log 유지 여부를 검증한다.

### Preview rate-limit 플랜 제약 반영

- 두 번째 rate-limit 규칙 생성은 Vercel API의 Rate limiting is not available for this plan (401)로 거부됐다. 공식 문서상 Hobby는 프로젝트당 무료 rate-limit 규칙 1개다.
- 별도 endpoint bucket 계획을 하나의 preview 공용 IP bucket으로 축소한다. exact create/read 두 경로와 POST·preview만 매칭하고 합산 60초 30회 초과 시 429를 반환한다.
- 이 선택은 MVP에서 플랜 업그레이드 없이 두 bcrypt 관련 경로를 함께 보호하며, Production log 규칙과 기능 비활성 상태는 유지한다. endpoint별 세분화는 Pro 전환 또는 애플리케이션 계층 limiter 도입 시의 가지로 남긴다.

### Preview rate-limit 초안 결과

- 규칙 rule_preview_rate_limit_inquiry_create_3sVb7C를 Preview rate limit inquiry APIs로 구성했다. create/read는 OR, 각 그룹 내부 path·POST·preview는 AND다.
- action은 IP fixed-window 30회/60초, 초과 시 429이며 규칙은 valid다. Production 로그 규칙 2개는 live 상태로 변경하지 않았다.
- hasDraft=true, pending changes 2건은 동일 규칙의 insert/update 이력이다. 사용자가 직접 publish하기 전에는 Preview에도 적용되지 않는다.

### Preview 검증 결과

- Preview 배포 dpl_3Vgk35mEiYRRc7rEig7qj5SQ4SHh는 READY이며 1,538개 경로 빌드를 통과했다.
- 동일 IP의 create 35개 동시 요청은 503 30건, 429 5건으로 30회/60초 제한이 정확히 동작했다. 창 만료 후 read는 503으로 복귀했다.
- Production create/read는 모두 기존 비활성 503이며 Preview 규칙의 영향이 없다. 우회 토큰은 메모리에서만 사용했고 출력·파일 저장하지 않았다.

### Production rate-limit 승격 실행 단위

- Hobby의 단일 rate-limit 규칙과 30회/60초 IP bucket을 유지하고, 각 exact POST 경로의 환경 조건만 preview와 production을 모두 포함하도록 확장한다.
- 다른 경로·GET·정적 페이지에는 영향을 주지 않으며 문의 server/client 활성화 플래그는 계속 false로 둔다.
- 초안 상세와 diff를 확인한 뒤 사용자가 직접 publish한다. 게시 후 Production 30회 정상 503·초과 429·창 만료 복귀를 확인하기 전에는 문의 UI를 활성화하지 않는다.

### Production rate-limit 초안 결과

- 기존 단일 규칙을 Rate limit inquiry APIs로 이름 변경하고 각 OR 그룹의 environment를 preview, production 포함 조건으로 확장했다.
- exact create/read path, POST, IP fixed-window 30회/60초, 초과 429는 유지된다. inspect 결과 valid이고 diff는 rules.update 1건이며 아직 미게시 상태다.

### Production rate-limit 검증 결과

- Rate limit inquiry APIs 규칙은 preview와 production에서 live이며 미게시 초안은 0건이다.
- Production create 35개 동시 요청 결과는 503 30건, 429 5건이다. 65초 후 create/read 모두 503으로 정상 복귀했다.
- Supabase inquiries 행은 0건으로 유지됐다. 서버 플래그는 false 상태이고 client 활성화 변수는 Production에 등록하지 않아 문의 UI는 계속 설정 중이다.
- 다음 실행은 PRIVATE_INQUIRY_ENABLED와 NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED를 Production true로 전환하고 재배포하는 실제 수집 활성화다. 사용자 명시 승인 전에는 수행하지 않는다.

### 운영 문의 활성화 결과

- 사용자 승인 후 Production의 PRIVATE_INQUIRY_ENABLED와 NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED를 true로 설정하고 dpl_AEMYHonr6gqM5ZqKMh9UTWBXe9Pm을 배포했다. 배포는 READY, 1,538개 경로 빌드 통과, sakamichi-hub.vercel.app alias 연결 상태다.
- 운영 API smoke는 create 201, read 200·1건, 잘못된 비밀번호 200·빈 결과다. 고유 테스트 UUID 한 건만 linked DB query로 삭제했고 최종 inquiries는 0건이다.
- 운영 /ko/contact HTML은 form 1개, 설정 중 문구 없음이다. 최근 1시간 Vercel error 로그는 0건이다.
- Supabase performance advisor는 0건이다. security advisor의 INFO 1건은 public.inquiries에 RLS를 켜고 공개 policy를 의도적으로 두지 않은 서버 전용 구조를 알리는 항목이다. anon/auth 테이블·RPC 권한 회수와 service-role 서버 API 경계는 유지된다.

## 운영 활성화 후 정합성 마감 작업지시 — 2026-08-30

### 의도와 범위

- 문의 가지의 운영 활성화 이후 제품 큰 줄기·문서·UI가 같은 현재 상태를 설명하는지 마감 점검한다.
- `README.md`의 빌드 경로 수와 역사 문서 `HANDOVER.md`의 현재 데이터 규모를 최신 검증값과 맞춘다.
- `PrivateInquiryBoard`의 등록/조회 탭에 선택 상태, 제어 대상, 탭 패널 관계를 추가한다.
- 외부 승인이나 비용이 필요한 Supabase·Vercel·Firewall 변경과 운영 데이터 생성은 수행하지 않는다.

### 연결·실패 상태·회귀 위험

- 데이터/문서: 검증 명령 결과와 문서 수치가 다시 어긋날 수 있으므로 실제 명령 결과만 기록한다.
- UI: 탭 접근성 속성 추가가 기존 폼 제출·조회·빈 결과 메시지를 바꾸지 않아야 한다.
- 운영: 로컬 검증은 실제 문의를 생성하지 않으며 프로덕션 환경 변수와 DB를 읽거나 변경하지 않는다.
- 회귀 위험: React 타입 오류, 숨겨진 패널의 잘못된 노출, 빌드 경로 수 재변동, 역사 문서가 현행 계약처럼 보이는 표현이다.

### 완료 조건과 검증 방법

- 현행 문서의 빌드·이벤트 수치가 최신 검증 결과와 일치한다.
- 탭 버튼에 `role=tab`, `aria-selected`, `aria-controls`가 있고 활성 패널에 대응하는 `role=tabpanel`과 `aria-labelledby`가 있다.
- `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm build`가 통과한다.
- 가능하면 로컬 브라우저에서 세 언어 문의 페이지의 탭 전환·폼 표시·키보드 포커스를 확인하고, 불가능한 항목은 미검증으로 기록한다.

### 실행·검증 결과

- `README.md`의 빌드 설명을 서버 API 포함 1,538개 경로로, 역사 참고 `HANDOVER.md`의 이벤트 수를 실제 검증값 44개로 동기화했다.
- 문의 등록/조회 탭에 ARIA 선택 상태·제어 패널 관계와 좌우 방향키·Home·End 키보드 이동 및 선택 탭 포커스 이동을 추가했다. 문의 생성·조회 API 계약은 변경하지 않았다.
- `pnpm typecheck`: 통과.
- `pnpm data:validate`: 통과. 16그룹·454멤버·44이벤트·2장소·15 ranking facts·256싱글.
- `pnpm search:verify`: 통과. 454명 기준 일본어·한국어·로마자 성, 3언어 그룹명, 별칭 검색을 확인했다.
- `pnpm build`: 통과. 1,538/1,538 경로, 문의 First Load JS 175KB.
- Playwright 로컬 브라우저 검증: `ko`, `ja`, `en` 모두 탭 2개, 초기 등록 탭 선택, 클릭 전환, ArrowRight, Home, 선택 탭 포커스, 활성 `tabpanel` 연결을 확인했다. 검증용 임시 스크립트와 개발 서버는 종료·제거했다.
- 외부 운영 설정·Supabase 데이터·Vercel 배포는 변경하지 않았다.

## 무료 운영·잔여 가지 일괄 실행 작업지시 — 2026-08-31

### 사용자 의도와 실행 범위

- Vercel은 Hobby 무료 요금제를 유지하며 Firewall 유료 확장은 하지 않는다.
- 추가 영속 저장이 필요할 때만 두 번째 조직의 기존 `sakamichi-box` Supabase 프로젝트를 사용한다. 이번 범위에는 새 저장 요구가 없어 DB 변경을 하지 않는다.
- 남은 무승인 작업을 데이터 신뢰, 링크 안전, 스크린샷 기반 카드/LIVE 시각 회귀, 모바일 UI, 자동화 상태, 운영 보안, 인수인계 순으로 한 번에 검증·보완한다.

### 변경 단위와 연결

- `scripts/check-links.ts`, `package.json`: 링크 점검을 기본 비파괴 보고 모드로 바꾸고 네트워크 불확실성을 dead와 분리한다.
- 데이터 커버리지: 기존 JSON과 schema를 읽어 그룹별 핵심 필드·출처 확인일을 측정하는 재현 가능한 명령과 보고서를 마련한다.
- 스크린샷 기준 UI: 그룹 카드가 로고/콘텐츠 폭만큼 축소되어 열 사이에 큰 공백이 생기거나 텍스트가 겹치지 않게 wrapper와 링크를 셀 전체 폭으로 고정한다. LIVE poster fallback은 로고가 실제 식별 요소가 되도록 가용 높이와 너비를 키우고 텍스트 fallback과 충돌하지 않게 한다.
- 모바일 UI: 로컬 Playwright 검증으로 세 언어 핵심 경로, 내비게이션·검색·카드·문의 탭의 기본 충돌과 가로 넘침을 검사한다.
- 자동화/운영: GitHub Actions 최근 실행, Vercel Hobby 경계, 전용 Supabase migration/advisor 상태는 읽기 전용으로 확인한다.
- 문서: 실제 결과만 현행 인수인계에 반영하며 역사 문서는 실행 계약으로 승격하지 않는다.

### 실패·빈 상태와 회귀 위험

- 외부 링크의 timeout·DNS·403·429·봇 차단은 인물 데이터 오류로 확정하지 않고 `unverified`로 남긴다.
- 링크 검사가 중단돼도 원본 멤버 데이터는 기본 모드에서 바뀌지 않아야 한다.
- 로고의 원본 종횡비가 서로 다르므로 `object-fit: contain`을 유지하고 확대 때문에 잘리거나 LIVE 텍스트와 겹치지 않게 한다.
- headless 환경에 실제 AdSense 광고가 없으면 정적 레이아웃만 검증하고 실광고 충돌은 미검증으로 기록한다.
- 자동화나 advisor 조회가 인증·네트워크 때문에 실패하면 재실행을 남발하지 않고 로컬 증거와 실패 이유를 기록한다.

### 완료 조건과 검증

- `pnpm data:links` 기본 실행이 `members.json`을 변경하지 않고 네트워크 실패를 unverified로 보고한다.
- 그룹별 데이터 커버리지 보고서를 로컬 명령으로 재생성할 수 있다.
- 데스크톱 그룹 카드가 각 grid cell을 채우고, LIVE fallback 로고가 잘림·겹침 없이 충분한 식별 크기로 표시된다.
- 세 언어 모바일 핵심 경로의 가로 넘침·핵심 UI 중첩·문의 키보드 탭 회귀를 검사한다.
- typecheck, 데이터·검색·대비·빌드 검증이 통과한다.
- 승인 대상 외부 변경 없이 자동화·Supabase·Vercel 현재 상태와 남은 한계를 인수인계에 기록한다.

### 실행·검증 결과

- Vercel Hobby 무료 요금제와 기존 Firewall 규칙을 유지했다. Supabase에는 새 저장 요구가 없어 두 번째 조직의 `sakamichi-box` 프로젝트를 포함해 프로젝트·schema·운영 데이터를 변경하지 않았다.
- 사용자 스크린샷을 기준으로 홈 그룹 카드 wrapper/link가 grid cell 전체 폭·높이를 채우게 고쳤다. 과거처럼 카드가 내용 폭으로 축소되어 열 사이가 비거나 텍스트가 겹치는 상태를 방지한다.
- LIVE fallback은 72px 높이·최대 184px의 식별 영역으로 확대했다. 원격 로고가 실패하면 깨진 이미지 대신 같은 크기의 그룹 워드마크로 전환한다.
- Playwright 로컬 브라우저 검증: 데스크톱의 모든 그룹 카드가 셀 폭과 2px 이내로 일치하고 LIVE 로고/워드마크가 최소 100×60px 이상이다. `ko`·`ja`·`en` 390×844 뷰포트의 가로 넘침은 1px 이하로 통과했다.
- `scripts/check-links.ts`는 기본 report-only가 됐다. `members.json` 변경은 명시적 `--write-members`에서만 허용하며 timeout·DNS·403·429·기타 일시 실패는 `unverified`, 404·410만 `dead`로 분류한다.
- 실제 `pnpm data:links`: 777개 중 OK 642, redirected 33, dead 67, unverified 35. 실행 전후 `members.json` SHA-256가 `7B26C69B500D2EB96C5C8486F66BDA5F6D018A1159C201811577CB2339F33F12`로 동일했다.
- `pnpm data:coverage`를 추가하고 `data/coverage-report.json`을 생성했다. 16그룹·454명·44이벤트·256 discography를 그룹별 사진·공식 프로필·렌더 가능 링크·확인일과 함께 집계한다.
- 주요 보강 대상: AKB48 사진 24/50·공식 프로필 21/50, NMB48 사진 7/46·공식 프로필 6/46, STU48 사진 2/32·공식 프로필 4/32. 해외 대표 수록 그룹의 1~3명 범위는 의도된 partial 상태다.
- 검증 통과: `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm data:contrast`, `pnpm data:coverage`, `pnpm build`(1,538/1,538 경로, 홈 177KB, 문의 175KB).
- GitHub Actions 최근 실행 조회는 sandbox 네트워크 차단으로 실패했다. workflow dispatch나 설정 변경은 하지 않았으며 현행 YAML의 6시간 cron·주간 갱신 정의만 로컬 확인했다.
- headless 로컬 환경에는 실제 AdSense 광고가 주입되지 않아 실광고 anchor 충돌은 미검증이다. 이 항목은 AdSense 관리 화면 변경 없이 실제 운영 기기 관찰로만 남긴다.

## 현행 인수인계 갱신 작업지시 — 2026-08-31

- 의도: 다음 작업자가 과거 확장 목록보다 현재 무료 운영 경계, 데이터 공백, 검증 결과와 실제 다음 순서를 먼저 읽게 한다.
- 범위: `CODEX_HANDOVER.md` 기준일·현재 상태·다음 실행 순서를 2026-08-31 결과로 동기화한다.
- 바꾸지 않는 범위: 코드·데이터·Supabase·Vercel·Firewall·광고 설정·배포·Git 상태는 변경하지 않는다.
- 실패 위험: 완료된 rMVP와 선택적 확장을 섞거나, 승인 필요한 대시보드·유료 작업을 즉시 가능 항목으로 오인하게 만들지 않는다.
- 완료 조건: 무료 로컬 다음 작업, 운영 관찰, 승인 필요 항목, 선택적 후속 제품 가지가 명확히 분리되고 최신 검증 수치와 일치한다.

## Markdown 문서 정합성 보완 작업지시 — 2026-08-31

### 변경 범위와 연결

- `PRODUCT_RMVP_PLAN.md`: 과거 공개 RPC 설계를 현행 service-role 전용 서버 API 계약으로 정정한다.
- `HANDOVER.md`: 역사 문서 내부의 1,536페이지 표현을 `당시 검증 기준`으로 바꿔 현재 1,538경로와 구분한다.
- `sakamichi-hub-work-order.md`: 폐기 배너의 현행 계약 링크를 `README.md`의 문서 권위 지도와 일치시킨다.
- 데이터·UI·명령·자동화는 변경하지 않고 Markdown 설명과 교차 참조만 보완한다.

### 실패·빈 상태와 회귀 위험

- 폐기 이력과 당시 수치는 삭제하지 않는다. 역사적 맥락은 보존하되 현재 실행 지시처럼 읽히지 않게 한다.
- `정적 페이지`와 서버 API 포함 `경로`의 단위를 섞지 않는다.
- 문의 권한 설명은 `supabase/README.md`와 `CODEX_HANDOVER.md`의 실제 운영 계약을 기준으로 한다.

### 완료 조건과 검증 방법

- 현행 제품 기획서에 `anon`·`authenticated`의 문의 RPC 직접 실행 허용 문구가 없다.
- 역사 인수인계의 1,536 수치는 모두 당시 기준으로 표시되고, 현행 문서의 1,538경로와 충돌하지 않는다.
- 폐기 작업지시서가 제품 기획서·현행 작업지시서·운영 인수인계를 안내하며 감사 계획을 현행 계약으로 부르지 않는다.
- `rg` 교차 검색과 `git diff --check`로 잔존 문구, 링크, 공백 오류를 검증한다.

### 실행·검증 결과

- `PRODUCT_RMVP_PLAN.md`의 과거 공개 RPC 허용 문구와 `공개 RPC smoke test` 표현을 제거했다. 공개 역할의 테이블·RPC 직접 권한 회수, Vercel 서버 API, service-role 전용 RPC 계약이 `supabase/README.md` 및 `CODEX_HANDOVER.md`와 일치한다.
- `CODEX_HANDOVER.md`의 모호한 `제한 RPC` 표현을 실제 적용 상태인 `service-role 전용 RPC`로 명시했다.
- `HANDOVER.md` 두 곳의 1,536개 정적 페이지는 `당시 검증 기준`으로 표시했고, 현행 `README.md`와 `CODEX_HANDOVER.md`의 서버 API 포함 1,538개 경로와 구분했다.
- `sakamichi-hub-work-order.md` 폐기 배너를 제품 기획·현행 작업지시·운영 인수인계 순서로 정렬하고 `AUDIT_AND_REBUILD_PLAN.md`를 감사·재설계 이력으로 표시했다.
- 대상 Markdown 교차 검색으로 보안 계약, 빌드 수치 단위, 문서 권위 링크를 확인했다. 코드·데이터·외부 운영 상태는 변경하지 않았다.
- 추적 중인 대상 문서에 대한 `git diff --check`는 통과했다. 기존 작업 트리의 다른 변경과 줄바꿈 정책은 변경하지 않았다.

## 문서 정합화 인수인계 갱신 작업지시 — 2026-08-31

- 사용자 의도: 다음 작업자가 이번 정합화 결과와 현행 문서 권위 순서를 `CODEX_HANDOVER.md` 첫 화면에서 확인하게 한다.
- 변경 범위: `CODEX_HANDOVER.md`의 완료 상태와 다음 실행 안내에 문서 정합화 결과 및 읽기 순서를 추가한다.
- 연결: 제품 줄기는 `PRODUCT_RMVP_PLAN.md`, 실행 설계·검증은 `WORK_ORDER_RMVP_2026-08-25.md`, 운영 상태와 다음 순서는 `CODEX_HANDOVER.md`를 우선하며 나머지 계획·인수인계는 역사 참고로 둔다.
- 실패·회귀 위험: 기존 운영 수치, 문의 보안 계약, 무료 운영 경계와 다음 데이터 보강 순서를 바꾸거나 완료되지 않은 외부 상태를 완료로 표시하지 않는다.
- 완료 조건과 검증: 현재 상태와 다음 실행 순서에 문서 권위가 명시되고 앞서 수정한 보안·빌드 수치 설명과 모순이 없다. `rg` 교차 검색과 `git diff --check`로 확인한다.
- 실행 결과: `CODEX_HANDOVER.md`의 완료된 로컬 구현·검증에 문서 권위·보안 계약 정합화 결과를 추가하고, 다음 실행 순서에 현행 3문서와 역사 참고 문서의 읽기 순서를 명시했다.
- 검증 결과: 제품 기획·작업지시·인수인계의 정합화 문구를 `rg`로 교차 확인했고, 추적 중인 대상 Markdown의 `git diff --check`가 통과했다. 기존 운영 수치·다음 무료 로컬 실행·외부 승인 경계는 변경하지 않았다.

## 전체 정합성 복구·Vercel 빌드 정상화 작업지시 — 2026-09-03

### 변경 범위와 연결

- `scripts/fetch/events.ts`, `data/portal.json`: 자동 수집 이벤트의 HTTPS 계약 위반을 재발 방지하고 현재 실패 레코드를 안전하게 정합화한다.
- `src/lib/search.ts`, 검색 결과 UI·메시지·검증 스크립트: 공백·하이픈 변형과 일치 근거 표시를 같은 검색 계약으로 연결한다.
- `src/components/group/GroupDataStatus.tsx` 및 데이터 계약: 커버리지 상태가 단순 링크 개수로 완전 수록을 주장하지 않도록 보수적으로 판정한다.
- 현행 문서: 실제 데이터·빌드 검증 결과만 반영하고 역사 수치와 현재 수치를 섞지 않는다.
- 마지막 실행 단위: 로컬 검증 통과 후 Vercel 배포 로그와 동일 환경 빌드를 확인해 실패 원인을 수정한다.

### 실패·빈 상태와 회귀 위험

- HTTP 공식 URL을 무조건 HTTPS로 바꿨을 때 대상 사이트가 HTTPS를 지원하지 않을 수 있으므로, HTTPS 가능성이 확인되지 않으면 원 출처 페이지를 공식 링크로 보존한다.
- 검색 구분자 정규화가 한자·가나·한글 검색을 넓혀 오탐을 만들지 않게 구분자만 제거하고 기존 필터를 유지한다.
- 일치 근거가 없는 필터 전용 결과와 빈 검색은 기존 UI 흐름을 유지한다.
- 명단 완전성의 근거가 없으면 `complete`로 승격하지 않으며 대표 수록 그룹은 계속 `collecting` 또는 `partial`로 표시한다.
- Vercel 진단 중 배포·환경 변수·외부 서비스 상태는 읽기부터 시작하고, 제품 해결에 필요한 저장소 변경만 수행한다.

### 완료 조건과 검증 방법

- `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm data:contrast`, `pnpm data:coverage`, `pnpm build`가 모두 통과한다.
- 검색 검증이 가나·초성·공백/하이픈·별칭·3언어 그룹명 사례를 명시적으로 포함한다.
- 이벤트 수집기를 재실행해도 HTTP URL 때문에 스키마 검증이 실패하지 않는다.
- 그룹 상태가 렌더 가능한 공식 링크와 명시적 수집 범위를 기준으로 계산된다.
- Vercel 빌드 실패 로그의 원인이 제거되고 같은 대상 환경 빌드가 성공한다.
- 최종 결과와 미검증 외부 상태를 이 작업지시서 및 `CODEX_HANDOVER.md`에 기록한다.

### 실행·검증 결과

- 이벤트 수집기에 `httpsUrlOrFallback` 경계를 추가했다. 외부 상세 링크가 HTTP이거나 URL로 파싱되지 않으면 검증된 HTTPS 일정 출처를 사용한다. 현재 `MUSIC EXPO LIVE 2026 in TAIPEI` 레코드도 Sakurazaka 공식 일정 출처로 정합화했다.
- 검색 정규화가 공백·하이픈·밑줄·일본어 중점 구분자를 동일하게 제거한다. 검색 결과에는 이름·별명·그룹명 중 실제 일치 근거를 세 언어로 표시한다.
- 검색 검증을 가나, 한글 초성, 로마자 하이픈 변형까지 확장했다.
- 그룹 데이터에 `rosterScope: complete | partial | representative`를 명시했다. UI는 명단 범위가 `complete`이고 모든 수록 멤버에게 클릭 가능한 공식 링크가 있을 때만 완전 수록으로 표시한다.
- 현재 데이터 검증값은 16그룹·454멤버·59이벤트·2장소·15 ranking facts·256싱글이다. 커버리지 보고서를 59이벤트 기준으로 재생성했다.
- `pnpm typecheck`, `pnpm data:validate`, `pnpm search:verify`, `pnpm data:contrast`, `pnpm data:coverage`, `pnpm build`가 통과했다. 로컬 빌드는 1,538/1,538 경로를 생성했다.
- Vercel 실패 배포의 직접 원인은 이벤트 `officialUrl` HTTPS 스키마 위반으로 확인됐다. 수정본 프로덕션 배포 `dpl_8MJ991bx7a1mjfa8apn6VjddfBAx`가 1,538/1,538 경로 빌드를 완료하고 `READY`가 됐으며 `https://sakamichi-hub.vercel.app`에 연결됐다.
- 프로덕션 검색 URL은 Vercel 인증 curl에서 HTML 200 응답을 확인했다. 로컬 `agent-browser open`은 두 차례 출력 없이 대기해 중단했으므로 시각 스크린샷·브라우저 콘솔 검증은 미검증으로 남긴다.

## 전체 멤버 공식 데이터 재감사·갱신 자동화 작업지시 — 2026-09-03

### 변경 범위와 연결

- 454명 전체 `members.json`을 생일·개인 사진·공식 프로필·Instagram/X/YouTube/TikTok·확인일 기준으로 스캔하고 그룹별 누락·미확인 목록을 만든다.
- 기존 그룹별 수집기와 감사 스크립트가 실제 공식 페이지 필드를 빠뜨리는 지점을 확인하고, 공식 출처에서 인물 동일성이 확정되는 필드만 병합한다.
- URL 존재 여부만 보지 않고 공식 링크 상태, 이미지가 그룹 로고인지 개인 사진인지, 생일 형식과 출처를 검증한다.
- `scripts/desktop-refresh.bat`과 실제 OneDrive 바탕화면 실행 파일을 동일 원본·동일 검증 순서로 동기화한다.

### 실패·빈 상태와 회귀 위험

- 공식 사이트의 403·SPA·지역 차단·DOM 변경은 `unverified`로 보고하고 기존 값을 삭제하지 않는다.
- 이름이 같은 인물, 졸업 후 계정 변경, 그룹 이동, 팬 계정과 비공식 사진은 자동 병합하지 않는다.
- 사진 URL이 열리더라도 인물 동일성과 공식 출처가 확인되지 않으면 개인 사진으로 승격하지 않는다.
- 자동 수집이 일부 그룹에서 실패하면 오래된 데이터로 검증·커밋·배포를 계속하지 않고 해당 단계에서 중단한다.

### 완료 조건과 검증 방법

- 454명 전체 누락 매트릭스와 그룹별 커버리지 변화가 보고서로 재현된다.
- 공식 출처에서 확정된 생일·사진·SNS 누락이 데이터와 수집기에 함께 반영된다.
- 수집 재실행 시 같은 누락을 다시 만들지 않고 기존 검증 필드를 불필요하게 덮어쓰지 않는다.
- `pnpm data:validate`, `pnpm search:build`, `pnpm search:verify`, `pnpm data:coverage`, `pnpm typecheck`, `pnpm build`가 통과한다.
- 저장소 배치 파일과 바탕화면 사본이 동일하고 `--check`가 원격 변경 없이 통과한다.

### 실행·검증 결과

- 454명 전체를 감사하는 `scripts/enrich-official-profiles.ts`와 `data:profiles`, `data:profiles:write` 명령을 추가했다. 기본 실행은 미리보기이며 `--write`에서만 `members.json`을 변경한다.
- 2026-09-03 현재 AKB48·SKE48·HKT48·NGT48 공식 명단 및 개인 상세 페이지를 직접 재탐색했다. 정규화한 일본어 이름이 정확히 일치한 인물만 병합했고, 생일 44건·개인 사진 18건을 포함한 총 152명 필드를 1차 보강했다. 그룹 공용 SNS가 개인 계정으로 섞이는 경우를 제거한 뒤 재실행 결과 변경 0건으로 멱등성을 확인했다.
- 현재 활동 멤버의 생일/사진/공식 프로필 누락은 AKB48 `0/0/0`, SKE48 `1/0/0`, HKT48 `0/2/3`, NGT48 `0/0/0`이다. 공식 현재 명단에서 일치하지 않은 로컬 활동 멤버는 AKB48 2명, SKE48 1명, HKT48 3명, NGT48 1명이며 명단 부재만으로 졸업·탈퇴를 추정하지 않고 기존 값을 보존했다.
- Instagram 등 개인 SNS는 공식 상세 페이지에 실제 링크가 있을 때만 추가한다. 따라서 누락 수는 데이터 오류가 아니라 계정 미개설일 수 있으며, 검색 결과나 비공식 집계로 채우지 않는다.
- NMB48 공식 사이트는 현재 환경에서 연결 시간 초과, STU48은 확인한 프로필 경로가 404여서 자동 병합 대상에서 제외했다. 두 그룹의 현재 활동 멤버 누락은 NMB48 사진 34·프로필 36, STU48 사진 29·프로필 27이며 `data/profile-audit-report.json`에 `not-supported-or-blocked`로 명시했다.
- `public/search-index.json`과 `data/coverage-report.json`을 새 멤버 데이터 기준으로 재생성했다. 저장소 배치 파일은 공식 프로필 병합 → 검색 인덱스 → 피드 → 검증 순서로 갱신했고, `C:\Users\royal\OneDrive\Desktop\Sakamichi Box 업데이트.bat` 사본을 복구해 `--check`를 통과시켰다.
- GitHub 주간 작업에는 새 프로필 수집을 연결하지 않았다. 기존 운영 기록상 GitHub Ubuntu IP에서 AKB48 공식 사이트가 차단되므로, 현재의 fail-closed 수집기를 넣으면 정상 자동화까지 실패할 위험이 있다.
- `pnpm data:validate`, `pnpm search:verify`, `pnpm data:contrast`, `pnpm data:coverage`, `pnpm typecheck`, `pnpm build`가 통과했다. 빌드는 1,538/1,538 경로를 생성했다. 검증기의 동일 사진 경고 3건은 AKB48과 KLP48에 함께 표현된 동일 인물(行天優莉奈·黒須遥香·山根涼羽)의 교차 그룹 중복이다.
- 프로덕션 배포 `dpl_6hsWpH5fyg7vWwtqNoBNyQGV5vuc`가 동일하게 1,538/1,538 경로를 생성하고 `READY`가 됐으며 `https://sakamichi-hub.vercel.app`에 연결됐다.

## 인수인계 확정·커밋·배포 작업지시 — 2026-09-03

### 의도·범위·안전 경계

- 이번 rMVP 정합성 수정, 공식 프로필 보강, 생성 보고서, 운영 문서와 인수인계를 하나의 검증된 스냅숏으로 커밋한다.
- 임시 실행 산출물과 비밀값은 커밋하지 않는다. 추적·미추적 파일을 모두 확인하고 민감정보 검사를 통과한 범위만 스테이징한다.
- 현재 작업 브랜치를 원격 동일 브랜치에 푸시한 뒤, 커밋된 내용으로 Vercel 프로덕션을 다시 배포한다.

### 완료 조건과 검증

- 커밋 직전 `git diff --check` 및 민감정보 검사를 통과한다.
- 커밋 SHA가 원격 브랜치에 반영되고 로컬 작업 트리가 의도한 상태로 정리된다.
- Vercel 배포가 `READY`이며 운영 별칭이 HTTP 200을 반환한다.
- 최종 커밋 SHA와 배포 ID를 `CODEX_HANDOVER.md`와 이 작업지시서에 기록한다.

### 실행 결과

- 진행 중.
