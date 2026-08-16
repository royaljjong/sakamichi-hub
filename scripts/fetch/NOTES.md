# 公式サイト DOM / API 構造調査ノート (Phase 1)

작성일: 2026-08-16
조사 대상: 乃木坂46, 櫻坂46, 日向坂46 공식 사이트

---

## 1. 乃木坂46 (Nogizaka46)

### 엔드포인트
- **멤버 목록 페이지**: `https://www.nogizaka46.com/s/n46/search/artist?ima=0000`
- **멤버 데이터 API**: `https://www.nogizaka46.com/s/n46/api/list/member` (JSONP: `res(...)`)
- **프로필 상세 페이지**: `https://www.nogizaka46.com/s/n46/artist/{code}?ima=0000`
- **공식 블로그 목록**: `https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000&ct={code}`

### 데이터 구조
- `code`: 5자리 또는 가변 문자열 (예: `'48006'`, `'63111'`) — 반드시 string 보존
- `name`: 漢字 (예: `'遠藤 さくら'`)
- `kana`: かな (예: `'えんどう さくら'`)
- `english_name`: 로마자 (예: `'sakura endo'`)
- `cate`: 기수 구분 (`'1期生'`, `'2期生'`, `'3期生'`, `'4期生'`, `'5期生'`, `'6期生'`)
- `graduation`: `'YES'` | `'NO'` (현역 / 졸업생 완벽 구분)
- `birthday`: `'YYYY/MM/DD'`
- `blood`: 혈액형
- `link`: 프로필 링크

---

## 2. 櫻坂46 (Sakurazaka46)

### 엔드포인트
- **멤버 목록 페이지**: `https://sakurazaka46.com/s/s46/search/artist?ima=0000`
- **프로필 상세 페이지**: `https://sakurazaka46.com/s/s46/artist/{code}?ima=0000`
- **공식 블로그 목록**: `https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000&ct={code}`

### DOM 구조
- 목록 컨테이너: `<ul class="member-list">` 또는 `li.box`
- 멤버 아이템: `<li class="box" data-member="{code}">`
- 멤버 링크: `<a href="/s/s46/artist/{code}?ima=0000">`
- 이름(漢字): `<p class="name">...</p>`
- 이름(かな): `<p class="kana">...</p>`
- 프로필 페이지 SNS:
  - 개인 Instagram: `href="https://www.instagram.com/..."`
  - 개인 X / 공식 링크: 프로필 페이지 링크 파싱
- 블로그 링크: `/s/s46/diary/blog/list?ima=0000&ct={code}`
- `code` 패턴: 2자리 문자열 (`'03'`, `'43'`, `'53'`, `'70'` 등 — 0 패딩 보존)

---

## 3. 日向坂46 (Hinatazaka46)

### 엔드포인트
- **멤버 목록 페이지**: `https://www.hinatazaka46.com/s/official/search/artist?ima=0000`
- **프로필 상세 페이지**: `https://www.hinatazaka46.com/s/official/artist/{code}?ima=0000`
- **공식 블로그 목록**: `https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000&ct={code}`

### DOM 구조
- 멤버 아이템: `<li class="p-member__item" data-member="{code}">`
- 멤버 링크: `<a href="/s/official/artist/{code}?ima=0000">`
- 이름(漢字): `<div class="c-member__name">...</div>`
- 이름(かな): `<div class="c-member__kana">...</div>`
- 프로필 페이지 SNS:
  - 개인 Instagram/X: 프로필 내 링크 파싱
- 블로그 링크: `/s/official/diary/member/list?ima=0000&ct={code}`
- `code` 패턴: 1~2자리 문자열 (`'1'`, `'14'`, `'39'` 등 — 문자열 보존)

---

## 4. 기수(Generation) 및 계보(Lineage) 구조 확정

### 乃木坂46
- `lineage`:
  - `nogizaka46` (2011-08-21 ~ 현재)
- `generations`:
  - `nogi-g1`: 1期生 (2011-08-21)
  - `nogi-g2`: 2期生 (2013-03-28)
  - `nogi-g3`: 3期生 (2016-09-04)
  - `nogi-g4`: 4期生 (2018-11-29)
  - `nogi-g5`: 5期生 (2022-02-01)
  - `nogi-g6`: 6期生 (2025-02-06)

### 櫻坂46
- `lineage`:
  - `keyakizaka46` (2015-08-21 ~ 2020-10-12, color: `#5FAE84`)
  - `sakurazaka46` (2020-10-14 ~ 현재, color: `#E88AA6`)
- `generations`:
  - `saku-g1`: 1期生 (joinedUnder: `keyakizaka46`, 2015-08-21)
  - `saku-g2`: 2期生 (joinedUnder: `keyakizaka46`, 2018-11-29)
  - `saku-g2-new`: 新2期生 (joinedUnder: `keyakizaka46`, 2020-02-16, order: 2, sortSuffix: 1)
  - `saku-g3`: 3期生 (joinedUnder: `sakurazaka46`, 2023-01-05)
  - `saku-g4`: 4期生 (joinedUnder: `sakurazaka46`, 2025-03-01)

### 日向坂46
- `lineage`:
  - `hiragana-keyaki` (2015-11-30 ~ 2019-02-10, color: `#77C6EE`)
  - `hinatazaka46` (2019-02-11 ~ 현재, color: `#5AB4E0`)
- `generations`:
  - `hina-g1`: 1期生 (joinedUnder: `hiragana-keyaki`, 2016-05-08)
  - `hina-g2`: 2期生 (joinedUnder: `hiragana-keyaki`, 2017-08-13)
  - `hina-g3`: 3期生 (joinedUnder: `hinatazaka46`, 2018-11-29)
  - `hina-g4`: 4期生 (joinedUnder: `hinatazaka46`, 2022-09-21)
  - `hina-g5`: 5期生 (joinedUnder: `hinatazaka46`, 2025-03-01)
