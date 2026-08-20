import { z } from 'zod';
import { HttpsUrl, IsoDate, LocalizedText, Slug } from './schema';

const CollectedFact = z.object({
  sourceUrl: HttpsUrl,
  checkedAt: IsoDate,
});

export const BrandAsset = z.object({
  id: Slug,
  groupId: Slug,
  kind: z.enum(['logo', 'group_photo']),
  imageUrl: HttpsUrl,
  fit: z.enum(['contain', 'cover']),
  canvasRatio: z.literal('4:3'),
  rightsStatus: z.enum(['official_embed', 'permission_confirmed', 'link_only']),
  provenance: CollectedFact,
});

export const Venue = z.object({
  id: Slug,
  name: LocalizedText,
  cityId: Slug,
  address: LocalizedText,
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  googleMapsUrl: HttpsUrl,
  provenance: CollectedFact,
});

export const PortalEvent = z.object({
  id: Slug,
  groupIds: z.array(Slug).min(1),
  title: LocalizedText,
  kind: z.enum(['concert', 'theater', 'release', 'appearance', 'notice']),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullable(),
  venueId: Slug.nullable(),
  posterUrl: HttpsUrl.nullable(),
  price: LocalizedText.nullable(),
  ticketUrl: HttpsUrl.nullable(),
  officialUrl: HttpsUrl,
  provenance: CollectedFact,
});

export const RankingSnapshot = z.object({
  id: Slug,
  scope: z.enum(['group', 'member']),
  metric: z.enum(['x_followers', 'instagram_followers', 'google_trends_index']),
  subjectId: Slug,
  value: z.number().nonnegative(),
  unit: z.enum(['followers', 'search_index']),
  platform: z.enum(['x', 'instagram', 'google_trends']),
  collectedOn: IsoDate,
  sourceUrl: HttpsUrl,
});
export type RankingSnapshot = z.infer<typeof RankingSnapshot>;

export const PortalDataset = z.object({
  schemaVersion: z.literal('1.0.0'),
  generatedAt: IsoDate,
  brandAssets: z.array(BrandAsset).default([]),
  venues: z.array(Venue),
  events: z.array(PortalEvent),
  rankings: z.array(RankingSnapshot),
});

export type PortalDataset = z.infer<typeof PortalDataset>;
