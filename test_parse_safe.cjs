function parseDateSafe(input) {
  if (!input) return null;
  const str = String(input).trim();
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hour = ymdMatch[4] !== undefined ? parseInt(ymdMatch[4], 10) : 0;
    const minute = ymdMatch[5] !== undefined ? parseInt(ymdMatch[5], 10) : 0;
    const second = ymdMatch[6] !== undefined ? parseInt(ymdMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, second);
  }
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}
console.log(parseDateSafe("2026-08-26").getTime());
console.log(parseDateSafe("26-08-2026").getTime());
console.log(parseDateSafe("2026-07-29").getTime());
