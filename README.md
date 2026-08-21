# 🌸 坂道シリーズ & AKB48グループ リンクハブ (Sakamichi & 48 Group Hub)

> 乃木坂46・櫻坂46・日向坂46 및 AKB48 그룹의 현역・졸업 멤버 공식 링크, 프로필 및 블로그 최신 갱신 포털（日本語 / 한국어 / English 3언어 지원 정적 허브）
> ⚠️ **현행 계약**: 실행 계약은 [`AUDIT_AND_REBUILD_PLAN.md`](./AUDIT_AND_REBUILD_PLAN.md) + [`CODEX_HANDOVER.md`](./CODEX_HANDOVER.md)입니다. 본 README와 [`HANDOVER.md`](./HANDOVER.md)는 서술 기록입니다.

---

## 📌 프로젝트 개요

- **사카미치 3사 & 48그룹 통합**: 노기자카46, 사쿠라자카46, 히나타자카46 및 AKB48, SKE48, NMB48, HKT48, NGT48, STU48, 해외 자매그룹 전체 통합 탐색
- **공식 링크 중심**: 현역 및 역대 졸업 멤버의 공식 블로그, 공식 프로필, 개인 소속사 및 공식 SNS(X, Instagram, YouTube) 직접 연결
- **단일 원천 데이터 (Single Source of Truth)**: `src/lib/schema.ts` (Zod) 및 `data/*.json`을 통한 빌드 시 무결성 보장
- **블로그 최신 갱신 피드**: 사카미치 그룹 30명 + AKB48 그룹 30명의 최신 블로그 갱신 타임라인 및 드래그 스크롤 지원

---

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router, SSG)
- **Language**: TypeScript 5 (Strict Mode)
- **Validation**: Zod
- **i18n**: next-intl (`ja`, `ko`, `en`)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Custom Tokens
- **Package Manager**: pnpm
- **Deployment**: Vercel

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 개발 서버 실행
```bash
pnpm dev
```
브라우저에서 `http://localhost:3000` 접속.

---

## 📋 데이터 관리 명령어

```bash
# 전체 멤버 데이터 크롤링 및 dataset 갱신
pnpm data:fetch

# 최신 블로그 60개 피드 수집
pnpm exec tsx scripts/fetch/updates.ts

# 데이터 스키마 및 관계 정합성 검증
pnpm data:validate

# 정적 프로덕션 빌드 (1,056개 페이지)
pnpm build
```

---

## 📖 시스템 아키텍처 및 상세 인수인계
자세한 코드베이스 구조, 데이터 파이프라인, 크롤러 로직 및 과거 이슈 해결 내역은 [`HANDOVER.md`](./HANDOVER.md)를 참고해 주시기 바랍니다.
