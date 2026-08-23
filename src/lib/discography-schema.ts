import { z } from 'zod';
import { HttpsUrl, IsoDate, Slug } from './schema';

export const Single = z.object({
  id: Slug,                       // e.g. 'nogi-single-035'
  groupId: Slug,
  number: z.number().int().positive(), // 1st single, 2nd, ...
  title: z.object({ ja: z.string().min(1), ko: z.string().optional(), en: z.string().optional() }),
  releaseDate: IsoDate,
  catalogNumber: z.string().nullable().optional(),
  coverUrl: HttpsUrl.nullable().optional(),
  wikipediaUrl: HttpsUrl.nullable().optional(),
  type: z.enum(['single', 'album', 'ep']).default('single'),
});
export type Single = z.infer<typeof Single>;

export const Discography = z.object({
  schemaVersion: z.literal('1.0.0'),
  generatedAt: IsoDate,
  singles: z.array(Single),
});
export type Discography = z.infer<typeof Discography>;
