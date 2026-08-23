# Google AdSense Application Guide / Google AdSense 신청 가이드

---

## English

### 1. Prerequisites (Already Done)

The following have been implemented to meet AdSense requirements:

- **Privacy Policy** — `/privacy-policy` (trilingual: ja/ko/en)
- **Terms of Service** — `/terms` (trilingual)
- **Contact page** — `/contact` with `royaljjong@gmail.com`
- **ads.txt** — `public/ads.txt` (placeholder — update after approval)
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

### 3. What to Give Me After Approval

Once approved, provide:

1. **Publisher ID** — e.g. `ca-pub-1234567890123456`
   - Replace `pub-XXXXXXXXXXXXXXXX` in `public/ads.txt`
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
- **문의 페이지** — `/contact` (`royaljjong@gmail.com`)
- **ads.txt** — `public/ads.txt` (승인 후 업데이트 필요)
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

### 3. 승인 후 제공해야 할 정보

승인 후 다음을 알려주세요:

1. **Publisher ID** — 예: `ca-pub-1234567890123456`
   - `public/ads.txt`에서 `pub-XXXXXXXXXXXXXXXX` 교체
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
