import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { AmbientBackground } from '@/components/background/AmbientBackground';
import { Navigation } from '@/components/ui/Navigation';
import { Footer } from '@/components/ui/Footer';

interface CreditsPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function CreditsPage({ params }: CreditsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const isJa = locale === 'ja';
  const isKo = locale === 'ko';

  const t = {
    pageTitle: isJa ? '出典と謝辞' : isKo ? '출처와 감사' : 'Credits & Attribution',
    intro: isJa
      ? '本サイトで使用しているデータの出典と、各ライセンスの表記を掲載します。'
      : isKo
        ? '본 사이트에서 사용하는 데이터의 출처와 각 라이선스 표기를 안내합니다.'
        : 'This page lists the data sources used on this site and the applicable license notices.',
    officialSitesHeading: isJa ? '公式サイト' : isKo ? '공식 사이트' : 'Official Sites',
    officialSitesBody: isJa
      ? '乃木坂46（nogizaka46.com）・櫻坂46（sakurazaka46.com）・日向坂46（hinatazaka46.com）の各公式サイト、およびAKB48グループ各公式サイト（akb48.co.jp、ske48.co.jp、nmb48.com、hkt48.co.jp、ngt48.jp、stu48.com）を参照しています。メンバー名、在籍状況、公式SNSリンクは各公式ページに基づきます。'
      : isKo
        ? '노기자카46(nogizaka46.com)·사쿠라자카46(sakurazaka46.com)·히나타자카46(hinatazaka46.com) 각 공식 사이트, 및 AKB48 그룹 각 공식 사이트(akb48.co.jp, ske48.co.jp, nmb48.com, hkt48.co.jp, ngt48.jp, stu48.com)를 참조합니다. 멤버 이름, 재적 상태, 공식 SNS 링크는 각 공식 페이지를 기준으로 합니다.'
        : 'Member names, active status, and official SNS links are sourced from the official sites of Nogizaka46 (nogizaka46.com), Sakurazaka46 (sakurazaka46.com), Hinatazaka46 (hinatazaka46.com), AKB48 (akb48.co.jp), SKE48 (ske48.co.jp), NMB48 (nmb48.com), HKT48 (hkt48.co.jp), NGT48 (ngt48.jp), and STU48 (stu48.com).',
    wikipediaHeading: 'Wikipedia (CC BY-SA 4.0)',
    wikipediaBody: isJa
      ? '一部のメンバープロフィールは、日本語版ウィキペディア（jawiki）の記事を出典としています。これらのデータはCC BY-SA 4.0ライセンスの下で提供されており、ハングルへの自動転写や表記調整を含む変更を加えています。著作権は各記事の編集者（ウィキペディア日本語版編集者の皆様）に帰属します。'
      : isKo
        ? '일부 멤버 프로필은 일본어 위키백과(jawiki) 문서를 출처로 합니다. 해당 데이터는 CC BY-SA 4.0 라이선스에 따라 제공되며, 한글 자동 전사 및 포맷 조정 등의 변경이 포함됩니다. 저작권은 각 문서 편집자(위키백과 jawiki 편집자 여러분)에게 귀속됩니다.'
        : 'Some member profiles include data derived from Japanese Wikipedia (jawiki) articles under CC BY-SA 4.0, with automatic transliteration to Korean hangul and formatting adjustments. Copyright belongs to the respective article authors (Wikipedia jawiki contributors).',
    wikimediaHeading: 'Wikimedia Commons',
    wikimediaBody: isJa
      ? '画像ファイルはWikimedia Commonsの各ファイルページにリンクしており、本サイト上にホスティングしていません。'
      : isKo
        ? '이미지 파일은 Wikimedia Commons의 각 파일 페이지로 링크되어 있으며, 본 사이트에서 직접 호스팅하지 않습니다.'
        : 'Image files are linked to their respective Wikimedia Commons file pages and are not hosted on this site.',
    changeIndicationHeading: isJa ? '変更の表示' : isKo ? '변경 표시' : 'Change Indication',
    changeIndicationBody: isJa
      ? 'ウィキペディア記事を出典とするメンバープロフィールには、ハングル転写・フォーマット調整等の変更が含まれます（CC BY-SA 4.0「改変配布」条件に基づき表示）。'
      : isKo
        ? '위키백과 문서를 출처로 하는 멤버 프로필에는 한글 전사·포맷 조정 등의 변경이 포함됩니다(CC BY-SA 4.0 개작 배포 조건에 따라 표시).'
        : 'Member profiles derived from Wikipedia articles include changes such as Korean transliteration and formatting adjustments, as required under CC BY-SA 4.0 ShareAlike terms.',
    disclaimerHeading: isJa ? '免責事項' : isKo ? '면책 사항' : 'Disclaimer',
    disclaimerBody: isJa
      ? '本サイトは非公式・非営利のファンサイトです。各アイドルグループおよびその運営会社とは一切関係がありません。'
      : isKo
        ? '본 사이트는 비공식·비영리 팬사이트입니다. 각 아이돌 그룹 및 운영사와 일체 관계가 없습니다.'
        : 'This is an unofficial, non-commercial fan site. It is not affiliated with any idol group or their management companies.',
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <AmbientBackground groupId="home" motif="mixed" />
      <Navigation />

      <main id="main-content" className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-[var(--g-brand)] font-semibold mb-2 block font-[family-name:var(--font-zen-kaku)]">
            Sources & Attribution
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] mb-3">
            {t.pageTitle}
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">{t.intro}</p>
        </div>

        <div className="space-y-8 bg-[var(--white-veil)] p-6 sm:p-10 rounded-[32px] border border-[color-mix(in_oklab,var(--g-ink)_12%,transparent)] shadow-[var(--shadow-soft)] backdrop-blur-md">

          {/* Official Sites */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.officialSitesHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.officialSitesBody}
            </p>
          </section>

          {/* Wikipedia */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.wikipediaHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.wikipediaBody}
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {isJa ? 'ライセンス全文: ' : isKo ? '라이선스 전문: ' : 'Full license text: '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors font-medium"
              >
                https://creativecommons.org/licenses/by-sa/4.0/
              </a>
            </p>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {isJa
                ? 'ウィキペディア日本語版へのリンク: '
                : isKo
                  ? '일본어 위키백과 링크: '
                  : 'Japanese Wikipedia: '}
              <a
                href="https://ja.wikipedia.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--g-brand)] transition-colors"
              >
                https://ja.wikipedia.org/
              </a>
            </p>
          </section>

          {/* Wikimedia Commons */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.wikimediaHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.wikimediaBody}
            </p>
          </section>

          {/* Change Indication */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.changeIndicationHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.changeIndicationBody}
            </p>
          </section>

          {/* Disclaimer */}
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--g-ink)] font-[family-name:var(--font-klee-one)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--g-brand)]" />
              {t.disclaimerHeading}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              {t.disclaimerBody}
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
