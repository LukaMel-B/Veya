/**
 * Date Formatting Utilities
 * All user-facing dates inside the app are formatted as "DD mmm yy" (e.g., "12 Oct 26").
 */

/**
 * Formats a date string (YYYY-MM-DD, ISO, or Date) into "DD mmm yy" format.
 * E.g., "2026-10-12" -> "12 Oct 26"
 */
export function formatDateDDmmmYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  let date: Date;
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    if (!cleanStr) return '';
    // Handle YYYY-MM-DD explicitly to prevent local timezone offset skew
    const parts = cleanStr.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      date = new Date(year, month, day);
    } else {
      date = new Date(cleanStr);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${day} ${month} ${year}`;
}

/**
 * Formats a date range into "DD mmm yy – DD mmm yy"
 */
export function formatDateRangeDDmmmYY(start?: string | null, end?: string | null): string {
  if (!start && !end) return '';
  if (start && !end) return formatDateDDmmmYY(start);
  if (!start && end) return formatDateDDmmmYY(end);

  const formattedStart = formatDateDDmmmYY(start);
  const formattedEnd = formatDateDDmmmYY(end);

  if (formattedStart === formattedEnd) return formattedStart;
  return `${formattedStart} – ${formattedEnd}`;
}
