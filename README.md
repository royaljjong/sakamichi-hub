# 坂道シリーズ リンクハブ (Sakamichi Series Link Hub)

> 乃木坂46・櫻坂46・日向坂46の現役・卒業メンバー公式リンク集（日本語 / 한국어 / English 3언어 지원 정적 링크 허브）

---

## 🌸 프로젝트 개요

- **공식 링크 중심**: 현역 멤버의 공식 블로그, 공식 프로필 및 소속사/본인 인증 SNS로 직접 이동
- **초상권 보호**: 인물 사진 호스팅을 일절 배제하고 성(姓) 기반 **글리프 아바타** 및 와시(和紙) 미감 적용
- **데이터 계약 (Single Source of Truth)**: `src/lib/schema.ts` (Zod) 및 `data/*.json`을 통한 빌드 시 무결성 보장
- **배경 엔진**: `@property` CSS 변수 보간 + Motion path morphing + Canvas 2D 파티클 크로스페이드

---

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router, SSG)
- **Language**: TypeScript 5 (Strict Mode)
- **Validation**: Zod
- **i18n**: next-intl 3.x (`ja`, `ko`, `en`)
- **Styling**: Tailwind CSS + Custom CSS Properties (`@property`)
- **Animation**: Motion (Framer Motion 12) + HTML5 Canvas 2D
- **Package Manager**: pnpm

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 개발 서버 실행
```bash
pnpm dev
```
브라우저에서 `http://localhost:3000` 또는 `http://localhost:3000/ja` 접속.

### 3. 배경 애니메이션 검수 페이지
```
http://localhost:3000/ja/dev/bg
```

---

## 📋 데이터 관리 및 스크립트

### 데이터 무결성 검증 (Zod & Relational Integrity)
```bash
pnpm data:validate
```

### 공식 사이트 최신 멤버 데이터 수집
```bash
pnpm data:fetch
```

### 링크 헬스체크 (상태 코드 검사 및 report 갱신)
```bash
pnpm data:links
```

### WCAG AA 색상 대비 검사
```bash
pnpm data:contrast
```

### 정적 프로덕션 빌드
```bash
pnpm build
```

---

## 📜 법적 고지 (Legal Disclaimers)

1. **비공식 팬사이트**: 본 사이트는 팬이 운영하는 비공식·비영리 사이트이며 소속사(Seed & Flower, Sony Music Labels)와 일체 무관합니다.
2. **콘텐츠 정책**: 인물 사진, 로고, 음원, 블로그 본문을 게재하지 않으며 검증된 공식 링크만을 연결합니다.
3. **라이선스 & 출처**: 각 그룹 공식 사이트 및 日本語版Wikipedia (CC BY-SA 4.0).
4. **삭제 요청**: `contact@sakamichi-hub.example.com`
