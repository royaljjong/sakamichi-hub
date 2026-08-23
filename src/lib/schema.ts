/**
 * sakamichi.schema.ts
 * ---------------------------------------------------------------------------
 * 坂道シリーズ リンクハブ — 単一データ契約 (Single Source of Truth)
 *
 * 이 파일이 이 프로젝트의 "계약서"다.
 * - UI 컴포넌트는 이 타입 밖의 필드를 절대 가정하지 않는다.
 * - JSON 데이터는 빌드 전 반드시 이 스키마로 검증된다 (pnpm data:validate).
 * - 스키마 변경은 반드시 이 파일 → JSON → 컴포넌트 순서로 전파한다.
 *
 * 설계 원칙:
 *   1) 사실(fact)과 표시(presentation)를 분리한다. 색·아이콘·라벨은 UI 토큰 쪽,
 *      여기에는 검증 가능한 사실만 둔다. (예외: 그룹 컬러는 그룹의 공식 속성이므로 포함)
 *   2) 모든 외부 링크는 "검증 상태"를 자기 자신 안에 들고 다닌다.
 *      검증되지 않은 링크는 렌더링되지 않는다. 이것이 환각 방지의 최종 방어선이다.
 *   3) 그룹 개명(欅坂46→櫻坂46, けやき坂46→日向坂46)은 "별도 그룹"이 아니라
 *      같은 그룹의 lineage(계보)로 모델링한다. 멤버는 그룹에 소속되고,
 *      "어느 시대의 이름으로 활동했는가"는 membership 기간에서 파생된다.
 * ---------------------------------------------------------------------------
 */

import { z } from 'zod';

/* ========================================================================== */
/* 1. 원시 타입                                                                */
/* ========================================================================== */

/** ISO 8601 날짜 (YYYY-MM-DD). 일자 불명이면 null, 추정 금지. */
export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 함');

/** URL은 https만 허용. http, 프로토콜 없는 문자열, 상대경로 전부 거부. */
export const HttpsUrl = z.string().url().startsWith('https://');

/** slug: 소문자 영숫자와 하이픈만. 일본어/한글 절대 불가 (URL 안정성). */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case 소문자 slug만 허용');

/** HEX 컬러 (#RRGGBB, 6자리 고정. 3자리 축약형 금지 — 보간 계산 시 오류 방지) */
export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/* ========================================================================== */
/* 2. 다국어 텍스트                                                            */
/* ========================================================================== */

/**
 * 3언어 필수 텍스트.
 * 번역이 없다고 빈 문자열을 넣지 말 것. 없으면 일본어 원문을 그대로 복사하고
 * translationStatus 를 'raw' 로 표기한다.
 */
export const LocalizedText = z.object({
  ja: z.string().min(1),
  ko: z.string().min(1),
  en: z.string().min(1),
});
export type LocalizedText = z.infer<typeof LocalizedText>;

/**
 * 인물명 — 표기 체계가 언어마다 다르므로 별도 구조를 쓴다.
 *
 * ja.kanji : 遠藤さくら        (공식 사이트 표기 그대로, 姓と名の間の空白は削除)
 * ja.kana  : えんどうさくら     (히라가나. ルビ 표시에 사용)
 * romaji   : Endo Sakura       (헵번식, 姓→名 순서, 마크론 미사용 = 공식 영문 표기 준수)
 * ko.hangul: 엔도 사쿠라        (국립국어원 외래어 표기법 기준, 姓 名 사이 공백 1칸)
 */
export const PersonName = z.object({
  ja: z.object({
    kanji: z.string().min(1),
    kana: z.string().min(1),
  }),
  ko: z.object({
    hangul: z.string().min(1),
  }),
  en: z.object({
    romaji: z.string().min(1),
  }),
  /** 검색 매칭용 별칭. 애칭/구 표기/오탈자 흡수. 표시에는 쓰지 않는다. */
  aliases: z.array(z.string()).default([]),
});
export type PersonName = z.infer<typeof PersonName>;

/* ========================================================================== */
/* 3. 출처 및 검증 (Provenance)                                                */
/* ========================================================================== */

/**
 * 데이터 출처. 이 프로젝트에서 허용되는 출처는 아래 4종뿐이다.
 *  - official      : 각 그룹 공식 사이트 (최우선. 충돌 시 항상 승리)
 *  - official_sns  : 운영사/그룹/본인이 공식 인증한 SNS 계정 페이지 자체
 *  - wikipedia_ja  : 日本語版Wikipedia (CC BY-SA 4.0 / 출처 표기 의무)
 *  - manual        : 운영자가 직접 확인하여 손으로 입력 (note 필수)
 *
 * ⚠ namuwiki, 개인 팬블로그, 위키 미러 사이트는 출처로 사용 금지.
 *   (라이선스 불명 + 이미지 저작권 문제 + 스크래핑 차단)
 */
export const SourceKind = z.enum([
  'official',
  'official_sns',
  'wikipedia_ja',
  'manual',
]);

export const Provenance = z.object({
  source: SourceKind,
  /** 실제로 확인한 페이지 URL. 'official' 이라고만 적고 URL 없는 것은 불가. */
  sourceUrl: HttpsUrl.nullable(),
  /** 사람 또는 스크립트가 마지막으로 눈으로 확인한 날짜 */
  checkedAt: IsoDate,
  note: z.string().nullable().default(null),
});
export type Provenance = z.infer<typeof Provenance>;

/* ========================================================================== */
/* 4. 링크                                                                     */
/* ========================================================================== */

export const LinkType = z.enum([
  'official_blog', // 그룹 공식 사이트 내 개인 블로그
  'official_profile', // 그룹 공식 사이트 내 프로필 페이지
  'x', // 舊 Twitter
  'instagram',
  'tiktok',
  'youtube',
  'note', // note.com
  'ameblo', // 졸업 후 개인 블로그로 다수 이동
  'weibo',
  'agency', // 이적 후 소속사 프로필
  'personal_site',
  'other',
]);
export type LinkType = z.infer<typeof LinkType>;

/**
 * 링크 상태.
 *  unverified : 아직 HTTP 확인 안 함 → **렌더링 금지**
 *  ok         : 200 응답 확인됨 → 정상 렌더링
 *  redirected : 3xx로 다른 곳에 도달 → 렌더링하되 최종 URL로 갱신 필요 (경고 배지)
 *  dead       : 4xx/5xx → 렌더링하되 비활성 + 「아카이브」 표기, 클릭 불가
 */
export const LinkStatus = z.enum(['unverified', 'ok', 'redirected', 'dead']);

export const MemberLink = z.object({
  type: LinkType,
  url: HttpsUrl,
  /** 화면에 보일 라벨. null이면 type 기반 기본 라벨을 UI가 붙인다. */
  label: LocalizedText.nullable().default(null),
  /** 운영사/본인이 공식으로 인정한 계정인가. 팬 운영 계정은 애초에 수록 금지. */
  isOfficial: z.boolean(),
  status: LinkStatus.default('unverified'),
  lastCheckedAt: IsoDate.nullable().default(null),
  /** 마지막 확인 시 HTTP 상태 코드 */
  lastStatusCode: z.number().int().nullable().default(null),
});
export type MemberLink = z.infer<typeof MemberLink>;

/* ========================================================================== */
/* 5. 그룹 계보 (Lineage)                                                      */
/* ========================================================================== */

/**
 * 그룹이 특정 이름으로 존재했던 기간.
 * 예) 櫻坂46 그룹의 lineage:
 *   [ { name:'欅坂46',  from:'2015-08-21', to:'2020-10-12' },
 *     { name:'櫻坂46',  from:'2020-10-14', to:null } ]
 *
 * 왜 이렇게 하는가:
 *   개명은 해산이 아니다. 멤버는 연속적으로 소속되어 있었고,
 *   기수(期) 번호도 연속이다. 별도 그룹으로 쪼개면 1期生이 두 그룹에
 *   중복 존재하게 되어 데이터가 깨진다.
 */
export const LineageEntry = z.object({
  id: Slug, // 'keyakizaka46' | 'sakurazaka46' ...
  name: LocalizedText,
  from: IsoDate,
  to: IsoDate.nullable(), // null = 현재 사용 중인 이름
  /** 이 시대의 상징색. 아카이브 화면에서 사용 */
  color: HexColor,
  logoUsageAllowed: z.boolean().default(false), // Legacy lineage flag; verified brand assets are governed by portal provenance.
});
export type LineageEntry = z.infer<typeof LineageEntry>;

/* ========================================================================== */
/* 6. 기수 (Generation)                                                        */
/* ========================================================================== */

export const Generation = z.object({
  id: Slug, // 'nogi-g1', 'saku-g2-new', 'hina-g5'
  /** 정렬용 정수. 「新2期生」처럼 부칭이 붙는 경우 order는 2, sortSuffix로 구분 */
  order: z.number().int().positive(),
  sortSuffix: z.number().int().default(0),
  label: LocalizedText, // { ja:'1期生', ko:'1기생', en:'1st Generation' }
  /** 오디션 합격 발표일 = 가입일로 통일 (그룹별 정의 차이 흡수) */
  joinedOn: IsoDate.nullable(),
  /** 가입 당시 그룹명 id (lineage.id 참조). 欅坂 시절 가입 기수 표시용 */
  joinedUnderLineageId: Slug,
  note: LocalizedText.nullable().default(null),
});
export type Generation = z.infer<typeof Generation>;

/* ========================================================================== */
/* 7. 그룹                                                                     */
/* ========================================================================== */

/**
 * 그룹 컬러 팔레트.
 * 배경 애니메이션이 이 6개 값을 CSS 변수로 주입받아 보간한다.
 * 반드시 6개 전부 채울 것. 하나라도 비면 전환 애니메이션이 깨진다.
 */
export const GroupPalette = z.object({
  /** 공식 상징색에 가장 가까운 값. 배지·강조선에 사용 */
  brand: HexColor,
  /** 배경 blob 1 (가장 진함, 화면 우상단) */
  blobA: HexColor,
  /** 배경 blob 2 (중간, 좌하단) */
  blobB: HexColor,
  /** 배경 blob 3 (가장 옅음, 중앙) */
  blobC: HexColor,
  /** 카드·패널 배경에 깔리는 아주 옅은 톤 */
  wash: HexColor,
  /** 이 팔레트 위에서 AA 대비를 만족하는 본문 잉크색 */
  ink: HexColor,
});
export type GroupPalette = z.infer<typeof GroupPalette>;

/** 프랜차이즈 구분: 坂道シリーズ vs AKB48 Group */
export const FranchiseKind = z.enum(['sakamichi', 'akb48g']);
export type FranchiseKind = z.infer<typeof FranchiseKind>;

/** 지역 구분: 일본 국내 그룹 vs 해외 자매 그룹 */
export const RegionKind = z.enum(['domestic', 'international']);
export type RegionKind = z.infer<typeof RegionKind>;

/** 배경 파티클 모티프. 그룹 정체성과 결합된다. */
export const ParticleMotif = z.enum([
  'bubble', // 乃木坂46 — しゃぼん玉, 아래→위 부상
  'petal', // 櫻坂46, HKT48, BNK48 — 花びら, 좌우 흔들리며 하강
  'sparkle', // 日向坂46, NMB48 — 光の粒, 제자리 반짝 + 완만한 우측 드리프트
  'leaf', // 欅坂46 (아카이브) — 若葉, 회전 낙하
  'star', // AKB48, JKT48 — 星屑, 펄스 반짝임
  'flare', // SKE48 — 太陽フレア, 따뜻한 입자
  'wave', // STU48 — 瀬戸内の波, 파도 물결
  'snow', // NGT48 — 雪の結晶, 부드러운 낙하
  'mixed', // 홈 화면 — 혼합
]);
export type ParticleMotif = z.infer<typeof ParticleMotif>;

export const Group = z.object({
  id: Slug, // 'nogizaka46' | 'sakurazaka46' | 'hinatazaka46' | 'akb48' ...
  franchise: FranchiseKind.default('sakamichi'),
  region: RegionKind.default('domestic'),
  baseLocation: LocalizedText.nullable().default(null),
  /** 정렬 순서 (데뷔순) */
  order: z.number().int().positive(),
  /** 현재 이름 */
  name: LocalizedText,
  /** 짧은 표기 (배지·모바일용). 예: '乃木坂' / '노기자카' / 'Nogi' */
  shortName: LocalizedText,
  status: z.enum(['active', 'archived']), // archived = 활동 종료 그룹
  debutedOn: IsoDate,
  /** 그룹 공식 로고 URL (Wikimedia Commons 등). 사진 없는 멤버 아바타 폴백에 사용. */
  logoUrl: HttpsUrl.nullable().optional(),
  /** 이름 변천사. 최소 1개(현재 이름) 이상. from 오름차순 정렬 필수. */
  lineage: z.array(LineageEntry).min(1),
  palette: GroupPalette,
  motif: ParticleMotif,
  /** 그룹 공식 링크 */
  official: z.object({
    site: HttpsUrl,
    blogIndex: HttpsUrl.nullable(),
    x: HttpsUrl.nullable(),
    instagram: HttpsUrl.nullable(),
    youtube: HttpsUrl.nullable(),
    tiktok: HttpsUrl.nullable(),
  }),
  /**
   * 개인 블로그 URL 템플릿. {code} 자리에 member.officialCode 를 끼워 넣는다.
   * 이 템플릿 덕분에 멤버마다 긴 URL을 손으로 적을 필요가 없고,
   * 공식 사이트 구조가 바뀌어도 한 줄만 고치면 전체가 복구된다.
   */
  blogUrlTemplate: z.string().includes('{code}').nullable(),
  generations: z.array(Generation).min(1),
  description: LocalizedText,
  provenance: Provenance,
});
export type Group = z.infer<typeof Group>;

/* ========================================================================== */
/* 8. 멤버                                                                     */
/* ========================================================================== */

export const MemberStatus = z.enum([
  'active', // 현역
  'trainee', // 연구생/연습생 — 공식 분류가 확인된 경우만 사용
  'graduating', // 졸업 발표 완료, 최종 활동일 이전 → 현역으로 취급하되 배지 표시
  'graduated', // 졸업
  'withdrawn', // 계약해지/탈퇴 등 졸업 이외의 이탈
  'transferred', // 坂道 내 다른 그룹으로 이적 (예: 兼任 해제 후 이동)
]);
export type MemberStatus = z.infer<typeof MemberStatus>;

/**
 * 소속 이력.
 * 겸임(兼任)과 이적을 표현하기 위해 배열이다.
 * 한 멤버가 여러 그룹 카드에 등장해야 하는 경우가 실제로 존재한다.
 */
export const Membership = z.object({
  groupId: Slug,
  generationId: Slug,
  joinedOn: IsoDate.nullable(),
  leftOn: IsoDate.nullable(), // null = 현재 소속 중
  /** 겸임이었는가 */
  isConcurrent: z.boolean().default(false),
  /** 이 소속 기간의 종료 사유 */
  endReason: z
    .enum(['graduation', 'withdrawal', 'transfer', 'rename', 'unknown'])
    .nullable()
    .default(null),
});
export type Membership = z.infer<typeof Membership>;

export const Member = z.object({
  /**
   * id 규칙: {group prefix}-{romaji-family}-{romaji-given}
   *   예: 'nogi-endo-sakura', 'hina-kosaka-nao', 'saku-morita-hikaru'
   * 동명이인 발생 시 뒤에 -2 를 붙인다. 절대 이름을 바꾸지 않는다.
   * 이 id는 URL에 노출되므로 한 번 정하면 변경 금지 (변경 시 301 리다이렉트 필수).
   */
  id: Slug,
  name: PersonName,
  /** 현재(또는 마지막) 소속. 목록 필터링의 기본 축. */
  primaryGroupId: Slug,
  primaryGenerationId: Slug,
  status: MemberStatus,
  memberships: z.array(Membership).min(1),
  birthDate: IsoDate.nullable().default(null),
  /** 출신지 (일본어 도도부현 표기 + 번역) */
  birthplace: LocalizedText.nullable().default(null),
  /** 공식 사이트 블로그 URL의 ct 파라미터 값. 문자열임에 주의 ('03' 같은 0 패딩 존재) */
  officialCode: z.string().nullable().default(null),
  imageUrl: z.string().url().nullable().default(null),
  links: z.array(MemberLink).default([]),
  provenance: Provenance,
  /**
   * 초상 이미지 관련 — 이 프로젝트는 인물 사진을 호스팅하지 않는다.
   * 대신 이니셜 문자와 그룹 팔레트로 아바타를 생성한다.
   * 이 필드는 그 생성에 쓰이는 값이다.
   */
  avatar: z.object({
    /** 아바타에 표시할 1~2글자 (보통 姓의 첫 글자) */
    glyph: z.string().min(1).max(2),
    /** 0~360. id 해시로 결정. 같은 그룹 내에서 색 편차를 주기 위함 */
    hueShift: z.number().min(-40).max(40).default(0),
  }),
});
export type Member = z.infer<typeof Member>;

/* ========================================================================== */
/* 9. 루트 데이터셋                                                            */
/* ========================================================================== */

export const Dataset = z.object({
  /** 스키마 버전. 구조 변경 시 반드시 올린다. */
  schemaVersion: z.literal('1.0.0'),
  generatedAt: IsoDate,
  groups: z.array(Group).min(1),
  members: z.array(Member),
});
export type Dataset = z.infer<typeof Dataset>;

/* ========================================================================== */
/* 10. 참조 무결성 검사                                                        */
/* ========================================================================== */

/**
 * zod만으로는 잡을 수 없는 관계 오류를 잡는다.
 * data:validate 스크립트에서 반드시 호출할 것.
 * 하나라도 실패하면 빌드를 중단한다 (process.exit(1)).
 */
export function checkIntegrity(data: Dataset): string[] {
  const errors: string[] = [];
  const groupIds = new Set(data.groups.map((g) => g.id));
  const genIds = new Set(
    data.groups.flatMap((g) => g.generations.map((x) => x.id)),
  );
  const memberIds = new Set<string>();

  for (const g of data.groups) {
    // lineage 는 시간순이어야 하고, 마지막 항목만 to === null
    const sorted = [...g.lineage].sort((a, b) => a.from.localeCompare(b.from));
    if (JSON.stringify(sorted) !== JSON.stringify(g.lineage)) {
      errors.push(`[${g.id}] lineage 가 from 오름차순이 아님`);
    }
    g.lineage.forEach((l, i) => {
      const isLast = i === g.lineage.length - 1;
      if (!isLast && l.to === null) {
        errors.push(`[${g.id}] lineage '${l.id}' 의 to 가 null 인데 마지막이 아님`);
      }
    });
    // 기수 id 중복
    const seen = new Set<string>();
    for (const gen of g.generations) {
      if (seen.has(gen.id)) errors.push(`[${g.id}] 기수 id 중복: ${gen.id}`);
      seen.add(gen.id);
      if (!g.lineage.some((l) => l.id === gen.joinedUnderLineageId)) {
        errors.push(
          `[${g.id}] 기수 '${gen.id}' 의 joinedUnderLineageId 가 lineage 에 없음`,
        );
      }
    }
  }

  for (const m of data.members) {
    if (memberIds.has(m.id)) errors.push(`멤버 id 중복: ${m.id}`);
    memberIds.add(m.id);

    if (!groupIds.has(m.primaryGroupId))
      errors.push(`[${m.id}] 존재하지 않는 primaryGroupId: ${m.primaryGroupId}`);
    if (!genIds.has(m.primaryGenerationId))
      errors.push(
        `[${m.id}] 존재하지 않는 primaryGenerationId: ${m.primaryGenerationId}`,
      );

    if (m.memberships.length === 0)
      errors.push(`[${m.id}] memberships 가 비어 있음`);

    for (const ms of m.memberships) {
      if (!groupIds.has(ms.groupId))
        errors.push(`[${m.id}] membership groupId 없음: ${ms.groupId}`);
      if (!genIds.has(ms.generationId))
        errors.push(`[${m.id}] membership generationId 없음: ${ms.generationId}`);
      if (ms.joinedOn && ms.leftOn && ms.leftOn < ms.joinedOn)
        errors.push(`[${m.id}] leftOn 이 joinedOn 보다 빠름`);
    }

    // 상태와 소속 종료일의 일관성
    const stillIn = m.memberships.some((ms) => ms.leftOn === null);
    if (m.status === 'active' && !stillIn)
      errors.push(`[${m.id}] status=active 인데 진행 중인 membership 이 없음`);
    if (m.status === 'graduated' && stillIn)
      errors.push(`[${m.id}] status=graduated 인데 leftOn=null 인 membership 존재`);

    // 링크 검증
    for (const l of m.links) {
      if (l.status === 'ok' && l.lastCheckedAt === null)
        errors.push(`[${m.id}] status=ok 인데 lastCheckedAt 이 없음 (위조 의심)`);
      if (!l.isOfficial)
        errors.push(`[${m.id}] isOfficial=false 인 링크는 수록 금지: ${l.url}`);
    }

    // 공식 블로그 URL 이 템플릿과 어긋나는지
    const group = data.groups.find((g) => g.id === m.primaryGroupId);
    const blog = m.links.find((l) => l.type === 'official_blog');
    if (group?.blogUrlTemplate && blog && m.officialCode) {
      const expected = group.blogUrlTemplate.replace('{code}', m.officialCode);
      if (blog.url !== expected)
        errors.push(
          `[${m.id}] official_blog URL 이 템플릿과 불일치\n  기대: ${expected}\n  실제: ${blog.url}`,
        );
    }
  }

  return errors;
}

/* ========================================================================== */
/* 11. UI 가드 — 렌더링 직전 최종 필터                                          */
/* ========================================================================== */

/**
 * 화면에 실제로 그릴 링크만 남긴다.
 * unverified 는 여기서 전부 탈락한다. 이것이 "AI가 지어낸 URL"이
 * 사용자에게 노출되지 않는 마지막 방어선이다.
 */
export function renderableLinks(links: MemberLink[]): MemberLink[] {
  return links.filter(
    (l) => l.isOfficial && (l.status === 'ok' || l.status === 'redirected' || l.status === 'dead'),
  );
}

/** 클릭 가능한 링크인가 (dead 는 표시하되 클릭 불가) */
export function isClickable(link: MemberLink): boolean {
  return link.status === 'ok' || link.status === 'redirected';
}
