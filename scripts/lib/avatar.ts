/**
 * Deterministic Avatar properties generator
 */

export function generateAvatar(id: string, kanjiName: string): { glyph: string; hueShift: number } {
  // Extract family name first character (e.g. 遠藤 -> 遠)
  const cleanName = kanjiName.replace(/\s+/g, '');
  const glyph = cleanName.charAt(0) || '坂';

  // Deterministic hash of id string to get hueShift between -40 and +40
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }

  // Map to [-40, 40]
  const normalized = Math.abs(hash % 81) - 40;

  return {
    glyph,
    hueShift: normalized,
  };
}
