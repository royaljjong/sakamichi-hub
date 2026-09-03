# 무회원 비공개 문의함 설정

문의자는 회원가입하지 않습니다. 글을 작성할 때 자신이 정한 `임시 아이디`와 `문의 비밀번호`를 입력하고, 같은 조합으로 자기 문의 목록만 조회합니다. 임시 아이디와 비밀번호 원문은 저장하지 않습니다. 아이디는 SHA-256, 비밀번호는 `pgcrypto` bcrypt 해시로 저장합니다.

## 1. 프로젝트 연결

Supabase 프로젝트를 만든 후 서버 전용 설정과 별도 활성화 게이트를 사용합니다.

```env
SUPABASE_URL=프로젝트_URL
SUPABASE_SECRET_KEY=secret_key
PRIVATE_INQUIRY_ENABLED=false
NEXT_PUBLIC_PRIVATE_INQUIRY_ENABLED=false
```

secret key는 Vercel server-only 환경 변수에만 저장하며 `NEXT_PUBLIC_*`, 브라우저 코드, 문서, 로그에 넣지 않습니다.

```powershell
npx supabase login
npx supabase link --project-ref PROJECT_REF
npx supabase db push
```

브라우저는 Supabase RPC를 직접 호출하지 않고 Vercel의 `/api/inquiries/create`, `/api/inquiries/read`를 사용합니다. Firewall IP rate limit과 smoke test가 끝난 환경에서만 server/client 활성화 플래그를 모두 `true`로 설정합니다. 어느 하나라도 미설정·`false`·오타이면 안전한 `설정 중` 또는 API 503 상태입니다.

## 2. 운영자 답변

공개 사이트에는 관리자 로그인이나 전체 문의 목록을 만들지 않았습니다. 운영자는 Supabase Dashboard의 Table Editor에서 `public.inquiries`를 열어 다음 세 열만 수정합니다.

- `status`: `received`, `reviewing`, `answered`, `closed`
- `admin_reply`: 사용자에게 보여줄 답변
- `updated_at`: 답변 시각

`private_id_hash`, `password_hash`, 본문 및 생성 시각은 수정하지 않습니다.

## 3. 보안 구조

- `anon`, `authenticated` 역할은 `inquiries` 테이블에 직접 권한이 없습니다.
- `anon`, `authenticated`는 RPC도 직접 실행할 수 없고 `service_role`만 두 함수를 실행합니다.
- Vercel 서버 API는 입력을 재검증한 뒤 server-only secret으로 RPC를 호출합니다.
- 조회 RPC는 임시 아이디와 비밀번호가 모두 맞는 문의만 반환합니다.
- 잘못된 아이디와 잘못된 비밀번호는 UI에서 같은 메시지로 처리합니다.
- DB 전역 1분당 30건 등록 상한과 ID당 50건 상한을 유지하고, Vercel Firewall에서 create/read POST를 하나의 공유 IP bucket(30회/60초)으로 제한합니다.

## 4. 활성화 후 필수 검증

```powershell
npx supabase test db
pnpm typecheck
pnpm build
```

서로 다른 임시 아이디·비밀번호로 문의 두 건을 만든 뒤 교차 조합 네 가지를 확인합니다. 올바른 두 조합만 각각 자기 문의를 반환하고 교차 조합은 모두 빈 결과여야 합니다.
