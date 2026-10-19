import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeUpdate, type RecentUpdate } from './updates';
import { RecentUpdate as RecentUpdateSchema } from '../../src/lib/updates-schema';

const sample: RecentUpdate = {
  id: 'sample',
  groupId: 'nogizaka46',
  franchise: 'sakamichi',
  memberName: { ja: '乃木坂46', ko: '노기자카46', en: 'Nogizaka46' },
  memberGlyph: '乃',
  memberHueShift: 0,
  memberImage: null,
  title: '公式ブログ',
  publishedAt: '2026-10-18',
  url: 'https://www.nogizaka46.com/s/n46/diary/detail/123',
  type: 'official_blog',
};

test('long titles stay within the schema limit without splitting an emoji', () => {
  const result = normalizeUpdate({ ...sample, title: `${'あ'.repeat(199)}😀 extra` });
  assert.ok(result);
  assert.equal(result.title, 'あ'.repeat(199));
  assert.equal(RecentUpdateSchema.safeParse(result).success, true);
});

test('relative images resolve against the official post URL', () => {
  const result = normalizeUpdate({ ...sample, memberImage: '/images/member.jpg' });
  assert.ok(result);
  assert.equal(result.memberImage, 'https://www.nogizaka46.com/images/member.jpg');
  assert.equal(RecentUpdateSchema.safeParse(result).success, true);
});

test('malformed or non-web images use the existing empty-image state', () => {
  for (const memberImage of ['https://bad host/image.jpg', 'data:image/png;base64,aGVsbG8=', 'not a url', '']) {
    const result = normalizeUpdate({ ...sample, memberImage });
    assert.ok(result);
    assert.equal(result.memberImage, null);
    assert.equal(RecentUpdateSchema.safeParse(result).success, true);
  }
});
