import { z } from 'zod';
import { HttpsUrl, LocalizedText, Slug } from './schema';

export const RecentUpdate = z.object({
  id: Slug,
  groupId: Slug,
  franchise: z.enum(['sakamichi', 'akb48g']).optional(),
  memberId: Slug.optional(),
  memberName: LocalizedText,
  memberGlyph: z.string().min(1),
  memberHueShift: z.number(),
  memberImage: z.string().url().nullable(),
  title: z.string().min(1).max(200)
    .refine((v) => !/^https?:\/\//i.test(v.replace(/&#x[0-9A-Fa-f]+;/g, '')), {
      message: 'title cannot be a bare URL',
    }),
  publishedAt: z.string().datetime({ offset: true }),
  url: HttpsUrl,
  type: z.literal('official_blog'),
});
export type RecentUpdate = z.infer<typeof RecentUpdate>;

export const RecentUpdates = z.array(RecentUpdate);
