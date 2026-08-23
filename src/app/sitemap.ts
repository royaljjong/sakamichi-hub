import type { MetadataRoute } from 'next';
import { getGroups, getMembers } from '@/lib/data';
import { routing } from '@/i18n/routing';

const BASE_URL = 'https://sakamichi-hub.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const groups = getGroups();
  const members = getMembers();
  const today = new Date();

  const entries: MetadataRoute.Sitemap = [];

  // Home
  for (const locale of routing.locales) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${BASE_URL}/${l}`]),
        ),
      },
    });
  }

  // Groups
  for (const group of groups) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/g/${group.id}`,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${BASE_URL}/${l}/g/${group.id}`]),
          ),
        },
      });

      // Generations
      for (const gen of group.generations) {
        entries.push({
          url: `${BASE_URL}/${locale}/g/${group.id}/gen/${gen.id}`,
          lastModified: today,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [
                l,
                `${BASE_URL}/${l}/g/${group.id}/gen/${gen.id}`,
              ]),
            ),
          },
        });
      }

      // Archives
      if (group.id === 'sakurazaka46' || group.id === 'hinatazaka46') {
        entries.push({
          url: `${BASE_URL}/${locale}/g/${group.id}/archive`,
          lastModified: today,
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [
                l,
                `${BASE_URL}/${l}/g/${group.id}/archive`,
              ]),
            ),
          },
        });
      }
    }
  }

  // Members
  for (const member of members) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/m/${member.id}`,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${BASE_URL}/${l}/m/${member.id}`]),
          ),
        },
      });
    }
  }

  // Search, About, Credits, Compare, Privacy Policy, Terms & Contact
  for (const staticPath of ['search', 'about', 'credits', 'compare', 'privacy-policy', 'terms', 'contact']) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/${staticPath}`,
        lastModified: today,
        changeFrequency: 'monthly',
        priority: 0.5,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [
              l,
              `${BASE_URL}/${l}/${staticPath}`,
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
