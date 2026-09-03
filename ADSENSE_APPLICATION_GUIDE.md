# Google AdSense Application Guide / Google AdSense 신청 가이드

> **Status update (2026-08-25): AdSense is approved and ads are live.** The application steps below are retained as historical setup notes. Current operations should focus on Policy Center alerts, consent-message/CMP configuration, mobile placement quality, and `ads.txt` availability.
>
> **상태 갱신 (2026-08-25): AdSense 승인 완료, 광고 게재 중.** 아래 신청 단계는 초기 설정 이력으로 유지합니다. 현재 운영에서는 정책 센터 경고, 동의 메시지/CMP 설정, 모바일 광고 배치 품질, `ads.txt` 접근성을 우선 점검합니다.

---

## English

### 1. Prerequisites (Already Done)

The following have been implemented to meet AdSense requirements:

- **Privacy Policy** — `/privacy-policy` (trilingual: ja/ko/en)
- **Terms of Service** — `/terms` (trilingual)
- **Contact page** — `/contact` with a no-account private inquiry box using a temporary ID and password (no public operator email)
- **ads.txt** — `public/ads.txt` (historical setup note; the live publisher ID is already present)
- **AdSlot component** — `src/components/ads/AdSlot.tsx` (renders nothing until Publisher ID is set)
- **Unique content** — member directory for Sakamichi Series + AKB48 Group with multilingual search

### 2. Application Steps

1. Visit **https://www.google.com/adsense/start/**
2. Click **Get started** and sign in with your Google account
3. Enter the site URL: `https://sakamichi-hub.vercel.app`
4. Select country: **Japan**, currency: **JPY** (or your preference)
5. Provide payment information (bank account details)
6. Copy the AdSense verification `<script>` snippet from the dashboard

To add the verification snippet to the site, add it to `src/app/layout.tsx` inside the `<head>`:

```tsx
// In src/app/layout.tsx — add inside <head> or use next/script
import Script from 'next/script';

<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
  crossOrigin="anonymous"
  strategy="afterInteractive"
/>
```

### 3. Historical post-approval inputs (completed for the publisher ID)

Once approved, provide:

1. **Publisher ID** — e.g. `ca-pub-1234567890123456`
   - Historical action: replace `pub-XXXXXXXXXXXXXXXX` in `public/ads.txt` (completed; do not restore the placeholder)
   - Set in Vercel: `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-1234567890123456`
2. **Ad Slot IDs** — created in AdSense dashboard under **Ads > By ad unit**
   - Use these as the `slot` prop on `<AdSlot slot="1234567890" />`

### 4. Placement Recommendations (for after approval)

| Location | Component usage |
|---|---|
| Home hero (below group grid) | `<AdSlot slot="SLOT_ID" format="auto" />` |
| Group page — below insights section | `<AdSlot slot="SLOT_ID" format="fluid" />` |
| Member page — below links section | `<AdSlot slot="SLOT_ID" format="auto" />` |

### 5. Compliance Notes

- Keep the Privacy Policy updated when new third-party services are added
- GDPR opt-out link must remain accessible (already in Privacy Policy)
- Do not click your own ads
- Do not place ads on pages with very thin content

### 6. Common Rejection Reasons

| Reason | Fix |
|---|---|
| Insufficient content | Add more member profiles / descriptions |
| No Privacy Policy | Already added at `/privacy-policy` |
| Site under construction | Ensure all pages are accessible |
| Content violation | This is a fan site — ensure no copyright-infringing media is hosted |
| ads.txt not found | Confirm `https://sakamichi-hub.vercel.app/ads.txt` returns the file |

---

## 한국어 (Korean)

### 1. 사전 준비 (이미 완료)

AdSense 요구 사항을 충족하기 위해 다음이 구현되었습니다:

- **개인정보 처리방침** — `/privacy-policy` (3개 언어: ja/ko/en)
- **이용약관** — `/terms` (3개 언어)
- **문의 페이지** — `/contact` 임시 아이디·비밀번호 방식의 무회원 비공개 문의함(운영자 이메일 비공개)
- **ads.txt** — `public/ads.txt` (역사 설정 기록이며 현재 운영 Publisher ID 반영 완료)
- **AdSlot 컴포넌트** — `src/components/ads/AdSlot.tsx` (Publisher ID 설정 전까지 렌더링 안 함)
- **고유 콘텐츠** — 사카미치 시리즈 + AKB48 그룹 다국어 멤버 디렉토리

### 2. 신청 단계

1. **https://www.google.com/adsense/start/** 접속
2. **시작하기** 클릭 후 Google 계정 로그인
3. 사이트 URL 입력: `https://sakamichi-hub.vercel.app`
4. 국가: **일본**, 통화: **JPY** 선택 (또는 본인 선호)
5. 결제 정보 입력 (은행 계좌)
6. AdSense 대시보드에서 인증용 `<script>` 스니펫 복사

인증 스니펫을 사이트에 추가하려면 `src/app/layout.tsx`에 next/script를 사용하여 추가하세요.

### 3. 승인 후 입력 항목의 역사 기록 (Publisher ID 반영 완료)

승인 후 다음을 알려주세요:

1. **Publisher ID** — 예: `ca-pub-1234567890123456`
   - 과거 실행 항목: `public/ads.txt`의 `pub-XXXXXXXXXXXXXXXX` 교체 (완료, placeholder로 되돌리지 않음)
   - Vercel 환경변수 설정: `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-1234567890123456`
2. **광고 슬롯 ID** — AdSense 대시보드의 **광고 > 광고 단위별**에서 생성
   - `<AdSlot slot="1234567890" />`의 `slot` prop으로 사용

### 4. 광고 배치 권장 위치 (승인 후)

| 위치 | 컴포넌트 사용 예 |
|---|---|
| 홈 히어로 (그룹 그리드 아래) | `<AdSlot slot="슬롯ID" format="auto" />` |
| 그룹 페이지 — 인사이트 섹션 아래 | `<AdSlot slot="슬롯ID" format="fluid" />` |
| 멤버 페이지 — 링크 섹션 아래 | `<AdSlot slot="슬롯ID" format="auto" />` |

### 5. 규정 준수 사항

- 새로운 서드파티 서비스 추가 시 개인정보 처리방침 업데이트
- GDPR 거부 링크 접근 가능 상태 유지 (이미 개인정보 처리방침에 포함)
- 자신의 광고 클릭 금지
- 콘텐츠가 너무 적은 페이지에 광고 게재 금지

### 6. 주요 거절 사유

| 사유 | 해결책 |
|---|---|
| 콘텐츠 부족 | 멤버 프로필/설명 보강 |
| 개인정보 처리방침 없음 | 이미 `/privacy-policy` 추가 완료 |
| 사이트 건설 중 | 모든 페이지 접근 가능 상태 유지 |
| 콘텐츠 정책 위반 | 저작권 침해 미디어 미호스팅 (이미 준수) |
| ads.txt 없음 | `https://sakamichi-hub.vercel.app/ads.txt` 접근 가능 여부 확인 |
