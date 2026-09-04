import { z } from 'zod';
import { HttpsUrl, LocalizedText, Slug } from './schema';

export const MemberVideo = z.object({
  id: z.string().min(3),
  platform: z.enum(['youtube', 'tiktok']),
  videoId: z.string().min(1),
  memberId: Slug,
  memberName: LocalizedText,
  memberGlyph: z.string().min(1),
  memberHueShift: z.number(),
  memberImage: z.string().url().nullable(),
  groupId: Slug,
  franchise: z.enum(['sakamichi', 'akb48g']),
  title: z.string().min(1).max(300),
  publishedAt: z.string().datetime({ offset: true }),
  url: HttpsUrl,
  thumbnailUrl: HttpsUrl,
  channelUrl: HttpsUrl,
});
export type MemberVideo = z.infer<typeof MemberVideo>;

export const MemberVideos = z.array(MemberVideo);
