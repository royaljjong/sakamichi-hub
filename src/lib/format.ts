/**
 * Locale-aware Date and Count formatters
 */

export function formatDate(
  isoDate: string | null | undefined,
  locale: string,
): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate || '';
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;

  if (locale === 'ja') {
    return `${year}年${month}月${day}日`;
  }

  if (locale === 'ko') {
    return `${year}년 ${month}월 ${day}일`;
  }

  // English
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = months[month - 1] || `${month}`;
  return `${monthName} ${day}, ${year}`;
}

export function formatMemberCount(count: number, locale: string): string {
  if (locale === 'ja') return `${count}名`;
  if (locale === 'ko') return `${count}명`;
  return `${count} member${count === 1 ? '' : 's'}`;
}
