import { safeFetch } from '../lib/fetcher';
import * as fs from 'fs';
import * as path from 'path';
import type { Member } from '../../src/lib/schema';

export interface RecentUpdate {
  id: string;
  groupId: string;
  franchise: 'sakamichi' | 'akb48g';
  memberId?: string;
  memberName: {
    ja: string;
    ko: string;
    en: string;
  };
  memberGlyph: string;
  memberHueShift: number;
  memberImage: string | null;
  title: string;
  publishedAt: string;
  url: string;
  type: 'official_blog';
}

export async function fetchLatestUpdates(providedMembers?: Member[]): Promise<RecentUpdate[]> {
  let members: Member[] = providedMembers || [];

  if (members.length === 0) {
    try {
      const p1 = path.join(process.cwd(), 'data', 'members.json');
      if (fs.existsSync(p1)) {
        members = JSON.parse(fs.readFileSync(p1, 'utf-8'));
      } else {
        const p2 = path.join(__dirname, '..', '..', 'data', 'members.json');
        if (fs.existsSync(p2)) {
          members = JSON.parse(fs.readFileSync(p2, 'utf-8'));
        }
      }
    } catch (e) {
      console.warn('Could not read members.json from filesystem:', e);
    }
  }

  const memberNameMap = new Map<string, Member>();
  for (const m of members) {
    memberNameMap.set(m.name.ja.kanji.replace(/\s+/g, ''), m);
  }

  const sakamichiUpdates: RecentUpdate[] = [];
  const akbUpdates: RecentUpdate[] = [];

  // 1. Nogizaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Nogizaka46 latest blogs...');
    const n = await safeFetch('https://www.nogizaka46.com/s/n46/diary/MEMBER/list?ima=0000');
    if (n.ok) {
      const cards = Array.from(n.text.matchAll(/<a [^>]*href="(\/s\/n46\/diary\/detail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      for (const card of cards.slice(0, 15)) {
        const linkPath = card[1] || '';
        const html = card[2] || '';

        const titleMatch = html.match(/<p class="bl--card__ttl">([\s\S]*?)<\/p>/) || html.match(/<h4 class="bl--card__ttl">([\s\S]*?)<\/h4>/);
        const nameMatch = html.match(/<p class="bl--card__name"[^>]*>([\s\S]*?)<\/p>/);
        const dateMatch = html.match(/<p class="bl--card__date">([\s\S]*?)<\/p>/);
        const imgMatch = html.match(/data-src="([^"]+)"/);

        const title = titleMatch ? titleMatch[1]!.replace(/<[^>]+>/g, '').trim() : 'ブログ更新';
        const name = nameMatch ? nameMatch[1]!.replace(/<[^>]+>/g, '').trim() : '乃木坂46';
        const date = dateMatch ? dateMatch[1]!.replace(/<[^>]+>/g, '').trim() : new Date().toISOString().slice(0, 10);
        const img = imgMatch && imgMatch[1] ? imgMatch[1] : null;

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));

        sakamichiUpdates.push({
          id: `nogi-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'nogizaka46',
          franchise: 'sakamichi',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '乃',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || img,
          title,
          publishedAt: date,
          url: `https://www.nogizaka46.com${linkPath}`,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Nogizaka blogs:', err);
  }

  // 2. Sakurazaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Sakurazaka46 latest blogs...');
    const s = await safeFetch('https://sakurazaka46.com/s/s46/diary/blog/list?ima=0000');
    if (s.ok) {
      const titles = Array.from(s.text.matchAll(/<h3 class="title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(s.text.matchAll(/<p class="name">([^<]+)<\/p>/g));
      const dates = Array.from(s.text.matchAll(/<p class="date wf-a">([^<]+)<\/p>/g));

      for (let i = 0; i < Math.min(titles.length, 15); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '櫻坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://sakurazaka46.com${linkPath}`;

        sakamichiUpdates.push({
          id: `saku-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'sakurazaka46',
          franchise: 'sakamichi',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '櫻',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || null,
          title,
          publishedAt: date,
          url: blogUrl,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Sakurazaka blogs:', err);
  }

  // 3. Hinatazaka46 Blogs (Up to 15)
  try {
    console.log('Fetching Hinatazaka46 latest blogs...');
    const h = await safeFetch('https://www.hinatazaka46.com/s/official/diary/member/list?ima=0000');
    if (h.ok) {
      const titles = Array.from(h.text.matchAll(/<div class="c-blog-article__title">[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g));
      const names = Array.from(h.text.matchAll(/<div class="c-blog-article__name">([^<]+)<\/div>/g));
      const dates = Array.from(h.text.matchAll(/<div class="c-blog-article__date">([^<]+)<\/div>/g));

      for (let i = 0; i < Math.min(titles.length, 15); i++) {
        const linkPath = titles[i]?.[1] || '';
        const title = titles[i]?.[2]?.replace(/<[^>]+>/g, '').trim() || 'ブログ更新';
        const name = names[i]?.[1]?.trim() || '日向坂46';
        const date = dates[i]?.[1]?.trim() || new Date().toISOString().slice(0, 10);

        const matchedMember = memberNameMap.get(name.replace(/\s+/g, ''));
        const blogUrl = linkPath.startsWith('http') ? linkPath : `https://www.hinatazaka46.com${linkPath}`;

        sakamichiUpdates.push({
          id: `hina-${linkPath.replace(/[^a-zA-Z0-9]/g, '')}`,
          groupId: 'hinatazaka46',
          franchise: 'sakamichi',
          memberId: matchedMember?.id,
          memberName: {
            ja: name,
            ko: matchedMember?.name.ko.hangul || name,
            en: matchedMember?.name.en.romaji || name,
          },
          memberGlyph: matchedMember?.avatar.glyph || name[0] || '日',
          memberHueShift: matchedMember?.avatar.hueShift || 0,
          memberImage: matchedMember?.imageUrl || null,
          title,
          publishedAt: date,
          url: blogUrl,
          type: 'official_blog',
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch Hinatazaka blogs:', err);
  }

  // 4. AKB48 Group Official Updates (30 members feed)
  const akbPostsRaw = [
    {
      id: 'akb-oguri-yui',
      groupId: 'akb48',
      memberId: 'akb48-oguri-yui',
      name: { ja: '小栗 有以', ko: '오구리 유이', en: 'Yui Oguri' },
      glyph: '小',
      hueShift: 24,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100622.jpg',
      title: 'AKB48 劇場公演 & 最新シングルのお知らせ',
      publishedAt: '2026.8.16 12:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-kuranoo-narumi',
      groupId: 'akb48',
      memberId: 'akb48-kuranoo-narumi',
      name: { ja: '倉野尾 成美', ko: '쿠라노오 나루미', en: 'Narumi Kuranoo' },
      glyph: '倉',
      hueShift: -18,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100609.jpg',
      title: '総監督よりファンの皆様へメッセージ',
      publishedAt: '2026.8.16 11:30',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-mukaichi-mion',
      groupId: 'akb48',
      memberId: 'akb48-mukaichi-mion',
      name: { ja: '向井地 美音', ko: '무카이치 미온', en: 'Mion Mukaichi' },
      glyph: '向',
      hueShift: 10,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100588.jpg',
      title: '夏のツアーリハーサル真っ最中です！',
      publishedAt: '2026.8.16 10:15',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-murayama-yuiri',
      groupId: 'akb48',
      memberId: 'akb48-murayama-yuiri',
      name: { ja: '村山 彩希', ko: '무라야마 유이리', en: 'Yuiri Murayama' },
      glyph: '村',
      hueShift: -5,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100547.jpg',
      title: '劇場公演の感想と最近の出来事 🍎',
      publishedAt: '2026.8.15 22:40',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-chiba-erii',
      groupId: 'akb48',
      memberId: 'akb48-chiba-erii',
      name: { ja: '千葉 恵里', ko: '치바 에리이', en: 'Erii Chiba' },
      glyph: '千',
      hueShift: 30,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100645.jpg',
      title: 'お気に入りの夏服コーデ紹介 👗',
      publishedAt: '2026.8.15 21:15',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-yamauchi-mizuki',
      groupId: 'akb48',
      memberId: 'akb48-yamauchi-mizuki',
      name: { ja: '山内 瑞葵', ko: '야마우치 미즈키', en: 'Mizuki Yamauchi' },
      glyph: '山',
      hueShift: 18,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100669.jpg',
      title: 'ラッキーずっきーラジオの裏話 🎀',
      publishedAt: '2026.8.15 20:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-sato-airi',
      groupId: 'akb48',
      memberId: 'akb48-sato-airi',
      name: { ja: '佐藤 綺星', ko: '사토 아이리', en: 'Airi Sato' },
      glyph: '佐',
      hueShift: -12,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100790.jpg',
      title: '17期生公演、ありがとうございました！',
      publishedAt: '2026.8.15 19:30',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'akb-yagi-azuki',
      groupId: 'akb48',
      memberId: 'akb48-yagi-azuki',
      name: { ja: '八木 愛月', ko: '야기 아즈키', en: 'Azuki Yagi' },
      glyph: '八',
      hueShift: 8,
      image: 'https://d2r1lkk9i7row.cloudfront.net/mobile/member/83100816.jpg',
      title: '先輩方とのステージで学んだこと',
      publishedAt: '2026.8.15 18:00',
      url: 'https://ameblo.jp/akihabara48/',
    },
    {
      id: 'ske-kumazaki-haruka',
      groupId: 'ske48',
      memberId: 'ske48-kumazaki-haruka',
      name: { ja: '熊崎 晴香', ko: '쿠마자키 하루카', en: 'Haruka Kumazaki' },
      glyph: '熊',
      hueShift: 15,
      image: 'https://ske48.co.jp/img/profile/detail/kumazaki_haruka.jpg',
      title: 'SKE48 劇場公演と夏のライブツアー！',
      publishedAt: '2026.8.15 17:45',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'ske-suenaga-ouka',
      groupId: 'ske48',
      memberId: 'ske48-suenaga-ouka',
      name: { ja: '末永 桜花', ko: '수에나가 오우카', en: 'Ouka Suenaga' },
      glyph: '末',
      hueShift: -20,
      image: 'https://ske48.co.jp/img/profile/detail/suenaga_ouka.jpg',
      title: 'おーちゃんわーるどへようこそ 🌸',
      publishedAt: '2026.8.15 16:30',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'ske-nomura-miyo',
      groupId: 'ske48',
      memberId: 'ske48-nomura-miyo',
      name: { ja: '野村 実代', ko: '노무라 미요', en: 'Miyo Nomura' },
      glyph: '野',
      hueShift: 5,
      image: 'https://ske48.co.jp/img/profile/detail/nomura_miyo.jpg',
      title: 'みよまるの日常と最近のハマりもの',
      publishedAt: '2026.8.15 15:10',
      url: 'https://ske48.co.jp/blog',
    },
    {
      id: 'nmb-kojima-karin',
      groupId: 'nmb48',
      memberId: 'nmb48-kojima-karin',
      name: { ja: '小嶋 花梨', ko: '코지마 카린', en: 'Karin Kojima' },
      glyph: '小',
      hueShift: 32,
      image: 'https://www.nmb48.com/images/member/kojima_karin.jpg',
      title: 'NMB48 ここにだって天使はある公演',
      publishedAt: '2026.8.15 14:20',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'nmb-shiotsuki-keito',
      groupId: 'nmb48',
      memberId: 'nmb48-shiotsuki-keito',
      name: { ja: '塩月 希依音', ko: '시오츠키 케이트', en: 'Keito Shiotsuki' },
      glyph: '塩',
      hueShift: -14,
      image: 'https://www.nmb48.com/images/member/shiotsuki_keito.jpg',
      title: 'けいとの笑顔をお届けします ☀️',
      publishedAt: '2026.8.15 13:00',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'nmb-sakata-misaki',
      groupId: 'nmb48',
      memberId: 'nmb48-sakata-misaki',
      name: { ja: '坂田 心咲', ko: '사카타 미사키', en: 'Misaki Sakata' },
      glyph: '坂',
      hueShift: 22,
      image: 'https://www.nmb48.com/images/member/sakata_misaki.jpg',
      title: 'みちゃぴーの全力パフォーマンス！',
      publishedAt: '2026.8.15 12:10',
      url: 'https://ameblo.jp/nmb48/',
    },
    {
      id: 'hkt-toyonaga-aki',
      groupId: 'hkt48',
      memberId: 'hkt48-toyonaga-aki',
      name: { ja: '豊永 阿紀', ko: '토요нага 아키', en: 'Aki Toyonaga' },
      glyph: '豊',
      hueShift: -8,
      image: 'https://www.hkt48.jp/files/99/profile/toyonaga_aki.jpg',
      title: 'HKT48 劇場公演、最高の一日でした！',
      publishedAt: '2026.8.14 21:10',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'hkt-ishibashi-ibuki',
      groupId: 'hkt48',
      memberId: 'hkt48-ishibashi-ibuki',
      name: { ja: '石橋 颯', ko: '이시바시 이부키', en: 'Ibuki Ishibashi' },
      glyph: '石',
      hueShift: 16,
      image: 'https://www.hkt48.jp/files/99/profile/ishibashi_ibuki.jpg',
      title: 'いぶいぶの元気パワーチャージ ⚡',
      publishedAt: '2026.8.14 20:25',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'hkt-takemoto-kurumi',
      groupId: 'hkt48',
      memberId: 'hkt48-takemoto-kurumi',
      name: { ja: '竹本 くるみ', ko: '타케모토 쿠루미', en: 'Kurumi Takemoto' },
      glyph: '竹',
      hueShift: -24,
      image: 'https://www.hkt48.jp/files/99/profile/takemoto_kurumi.jpg',
      title: 'くるみたんの日常ブログ 🐾',
      publishedAt: '2026.8.14 19:40',
      url: 'https://ameblo.jp/hkt48/',
    },
    {
      id: 'ngt-fujisaki-miyu',
      groupId: 'ngt48',
      memberId: 'ngt48-fujisaki-miyu',
      name: { ja: '藤崎 未夢', ko: '후지사키 미유', en: 'Miyu Fujisaki' },
      glyph: '藤',
      hueShift: 12,
      image: 'https://ngt48.jp/profile/fujisaki_miyu.jpg',
      title: '新潟からの爽やかな風 🌾',
      publishedAt: '2026.8.14 18:50',
      url: 'https://ngt48.jp/profile/detail/fujisaki_miyu',
    },
    {
      id: 'ngt-nishigata-marina',
      groupId: 'ngt48',
      memberId: 'ngt48-nishigata-marina',
      name: { ja: '西潟 茉莉奈', ko: '니시가타 마리나', en: 'Marina Nishigata' },
      glyph: '西',
      hueShift: -16,
      image: 'https://ngt48.jp/profile/nishigata_marina.jpg',
      title: 'ファンのみなさんへの感謝のメッセージ',
      publishedAt: '2026.8.14 18:00',
      url: 'https://ngt48.jp/profile/detail/nishigata_marina',
    },
    {
      id: 'stu-okada-azumi',
      groupId: 'stu48',
      memberId: 'stu48-okada-azumi',
      name: { ja: '岡田 あずみ', ko: '오카다 아즈미', en: 'Azumi Okada' },
      glyph: '岡',
      hueShift: -6,
      image: 'https://sp.stu48.com/img/profile/okada_azumi.jpg',
      title: 'キャプテン就任後の日々と意気込み ⚓',
      publishedAt: '2026.8.14 17:15',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'stu-nakamura-mai',
      groupId: 'stu48',
      memberId: 'stu48-nakamura-mai',
      name: { ja: '中村 舞', ko: '나카무라 마이', en: 'Mai Nakamura' },
      glyph: '中',
      hueShift: -25,
      image: 'https://sp.stu48.com/img/profile/nakamura_mai.jpg',
      title: '瀬戸内からの風をお届けします 🌊',
      publishedAt: '2026.8.14 16:30',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'stu-ishida-chiho',
      groupId: 'stu48',
      memberId: 'stu48-ishida-chiho',
      name: { ja: '石田 千穂', ko: '이시다 치호', en: 'Chiho Ishida' },
      glyph: '石',
      hueShift: 28,
      image: 'https://sp.stu48.com/img/profile/ishida_chiho.jpg',
      title: 'ちほちゃんのキラキラ瀬戸内便り ✨',
      publishedAt: '2026.8.14 15:40',
      url: 'https://sp.stu48.com/blog/',
    },
    {
      id: 'jkt-shani',
      groupId: 'jkt48',
      memberId: 'jkt48-shani-indira-natio',
      name: { ja: 'シャニ', ko: '샤니', en: 'Shani Indira Natio' },
      glyph: 'シ',
      hueShift: 14,
      image: 'https://jkt48.com/images/member/shani_indira_natio.jpg',
      title: 'Salam hangat dari Jakarta! 🇮🇩',
      publishedAt: '2026.8.14 14:00',
      url: 'https://jkt48.com/member/detail/id/shani_indira_natio',
    },
    {
      id: 'jkt-feni',
      groupId: 'jkt48',
      memberId: 'jkt48-feni-fitriyanti',
      name: { ja: 'フェニ', ko: '페니', en: 'Feni Fitriyanti' },
      glyph: 'フ',
      hueShift: -18,
      image: 'https://jkt48.com/images/member/feni_fitriyanti.jpg',
      title: 'Semangat theater hari ini ✨',
      publishedAt: '2026.8.14 13:00',
      url: 'https://jkt48.com/member/detail/id/feni_fitriyanti',
    },
    {
      id: 'jkt-freya',
      groupId: 'jkt48',
      memberId: 'jkt48-freya-jayawardana',
      name: { ja: 'フレヤ', ko: '프레야', en: 'Freya Jayawardana' },
      glyph: 'フ',
      hueShift: 20,
      image: 'https://jkt48.com/images/member/freya_jayawardana.jpg',
      title: 'Freya daily vlog update 🎬',
      publishedAt: '2026.8.14 12:00',
      url: 'https://jkt48.com/member/detail/id/freya_jayawardana',
    },
    {
      id: 'bnk-hoop',
      groupId: 'bnk48',
      memberId: 'bnk48-patalee-prasertteerachai',
      name: { ja: 'フープ', ko: '후프', en: 'Patalee Prasertteerachai' },
      glyph: 'フ',
      hueShift: -10,
      image: 'https://www.bnk48.com/images/members/hoop.jpg',
      title: 'BNK48 Captain message from Bangkok 🇹🇭',
      publishedAt: '2026.8.14 11:00',
      url: 'https://www.bnk48.com/bnk48-members/detail/hoop',
    },
    {
      id: 'cgm-aom',
      groupId: 'cgm48',
      memberId: 'cgm48-manichar-aimdilokwong',
      name: { ja: 'オーム', ko: '아옴', en: 'Manichar Aimdilokwong' },
      glyph: 'オ',
      hueShift: 26,
      image: 'https://cgm48official.com/images/members/aom.jpg',
      title: 'CGM48 Chiang Mai theater show recap',
      publishedAt: '2026.8.14 10:00',
      url: 'https://cgm48official.com/members/aom',
    },
    {
      id: 'mnl-sheki',
      groupId: 'mnl48',
      memberId: 'mnl48-shekinah-arzaga',
      name: { ja: 'シェキ', ko: '셰키', en: 'Shekinah Arzaga' },
      glyph: 'シ',
      hueShift: -12,
      image: 'https://mnl48.ph/images/members/sheki.jpg',
      title: 'Mabuhay! Music updates from Manila 🇵🇭',
      publishedAt: '2026.8.14 09:00',
      url: 'https://mnl48.ph/members/sheki',
    },
    {
      id: 'tp-liu-yu-ching',
      groupId: 'akb48-team-tp',
      memberId: 'akb48-team-tp-liu-yu-ching',
      name: { ja: '劉語晴', ko: '류위칭', en: 'Liu Yu-ching' },
      glyph: '劉',
      hueShift: 8,
      image: 'https://www.akb48teamtp.com/upload/members/77_yuqing.jpg',
      title: 'Taipei stage performance memo 🇹🇼',
      publishedAt: '2026.8.14 08:30',
      url: 'https://www.akb48teamtp.com/members/77_yuqing',
    },
    {
      id: 'klp-gyoten-yurina',
      groupId: 'klp48',
      memberId: 'klp48-yurina-gyoten',
      name: { ja: '行天 優莉奈', ko: '교텐 유리나', en: 'Yurina Gyoten' },
      glyph: '行',
      hueShift: -22,
      image: 'https://klp48.my/img/members/yurina_gyoten.jpg',
      title: 'KLP48 クアラルンプールでの新たな挑戦！🇲🇾',
      publishedAt: '2026.8.14 08:00',
      url: 'https://klp48.my/members/yurina_gyoten',
    },
  ];

  for (const p of akbPostsRaw) {
    const matchedMember = memberNameMap.get(p.name.ja.replace(/\s+/g, ''));
    akbUpdates.push({
      id: p.id,
      groupId: p.groupId,
      franchise: 'akb48g',
      memberId: matchedMember?.id || p.memberId,
      memberName: {
        ja: p.name.ja,
        ko: matchedMember?.name.ko.hangul || p.name.ko,
        en: matchedMember?.name.en.romaji || p.name.en,
      },
      memberGlyph: matchedMember?.avatar.glyph || p.glyph,
      memberHueShift: matchedMember?.avatar.hueShift || p.hueShift,
      memberImage: matchedMember?.imageUrl || p.image,
      title: p.title,
      publishedAt: p.publishedAt,
      url: p.url,
      type: 'official_blog',
    });
  }

  // Sort both by publishedAt descending
  const sortByDate = (a: RecentUpdate, b: RecentUpdate) => {
    const timeA = new Date(a.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    const timeB = new Date(b.publishedAt.replace(/\./g, '-').replace(/\//g, '-')).getTime() || 0;
    return timeB - timeA;
  };

  sakamichiUpdates.sort(sortByDate);
  akbUpdates.sort(sortByDate);

  // Take top 30 each
  const finalSakamichi = sakamichiUpdates.slice(0, 30);
  // The legacy AKB entries above are editorial fixtures, not live-collected
  // facts. Keep them out of the published feed until each 48-group adapter
  // reads an official news/blog endpoint and records its source timestamp.
  const finalAkb: RecentUpdate[] = [];

  const combined = [...finalSakamichi, ...finalAkb];

  try {
    const outPath = path.join(process.cwd(), 'data', 'latest-updates.json');
    fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
    console.log(`✅ Successfully saved ${finalSakamichi.length} Sakamichi & ${finalAkb.length} AKB48G updates to data/latest-updates.json`);
  } catch (e) {
    // Read-only serverless environment fallback
  }

  return combined;
}

if (require.main === module) {
  fetchLatestUpdates().catch(console.error);
}
