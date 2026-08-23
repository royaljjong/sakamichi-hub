export interface MemberVideo {
  id: string;              // e.g. "yt-VIDEOID" or "tt-VIDEOID"
  platform: 'youtube' | 'tiktok';
  videoId: string;         // YouTube video ID or TikTok video ID
  memberId: string;        // members.json id
  memberName: { ja: string; ko: string; en: string };
  memberGlyph: string;
  memberHueShift: number;
  memberImage: string | null;
  groupId: string;
  franchise: 'sakamichi' | 'akb48g';
  title: string;
  publishedAt: string;     // ISO
  url: string;
  thumbnailUrl: string;
  channelUrl: string;
}
