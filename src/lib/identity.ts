import type { Group, Member } from './schema';

function splitName(value: string): string[] {
  return value
    .split(/[\s・·_-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);
}

export function buildMemberDiscoveryTerms(member: Member, group?: Group | null): string[] {
  const officialNames = [
    member.name.ja.kanji,
    member.name.ja.kana,
    member.name.ko.hangul,
    member.name.en.romaji,
  ];
  const groupNames = group
    ? [
        group.name.ja,
        group.name.ko,
        group.name.en,
        group.shortName.ja,
        group.shortName.ko,
        group.shortName.en,
      ]
    : [];

  return Array.from(
    new Set(
      [
        ...officialNames,
        ...officialNames.flatMap(splitName),
        ...(member.name.aliases ?? []),
        ...groupNames,
      ]
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  );
}

export function visibleMemberAliases(member: Member): string[] {
  const official = new Set([
    member.name.ja.kanji,
    member.name.ja.kana,
    member.name.ko.hangul,
    member.name.en.romaji,
  ]);
  return (member.name.aliases ?? []).filter((alias) => !official.has(alias));
}
