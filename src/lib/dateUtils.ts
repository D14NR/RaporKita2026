export const MONTHS_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAYS_INDO = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Parses a date input safely into a Date object without timezone offset bugs for YYYY-MM-DD.
 */
export function parseDateSafe(input: string | Date | number | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(input).trim();
  if (!str || str === 'No Date' || str === '-') return null;

  // Handle YYYY-MM-DD or YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss
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

  // Handle DD-MM-YYYY or DD/MM/YYYY
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

/**
 * Formats any date into Indonesian date string format.
 * Examples:
 * - "2026-08-03" -> "3 Agustus 2026"
 * - "2026-08-03" (withDayName: true) -> "Senin, 3 Agustus 2026"
 * - "2026-08-03 14:30" (withTime: true) -> "3 Agustus 2026, 14.30 WIB"
 */
export function formatTanggalIndo(
  input: string | Date | number | null | undefined,
  options?: {
    withDayName?: boolean;
    withTime?: boolean;
    shortMonth?: boolean;
    uppercase?: boolean;
  }
): string {
  if (!input) return '-';
  const strInput = String(input).trim();
  if (!strInput || strInput === 'No Date' || strInput === '-') return strInput || '-';

  const d = parseDateSafe(input);
  if (!d) return strInput;

  const { withDayName = false, withTime = false, shortMonth = false, uppercase = false } = options || {};

  const dayName = DAYS_INDO[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS_INDO[d.getMonth()];
  const displayMonth = shortMonth ? monthName.substring(0, 3) : monthName;
  const year = d.getFullYear();

  let formatted = `${dayNum} ${displayMonth} ${year}`;
  if (withDayName) {
    formatted = `${dayName}, ${formatted}`;
  }

  if (withTime) {
    const hasExplicitTime = strInput.includes(':') || input instanceof Date || typeof input === 'number';
    if (hasExplicitTime) {
      const hour = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      formatted = `${formatted}, ${hour}.${min} WIB`;
    }
  }

  if (uppercase) {
    return formatted.toUpperCase();
  }

  return formatted;
}

/**
 * Returns current date in formatted Indonesian e.g. "Senin, 3 Agustus 2026"
 */
export function getTodayIndoString(withDayName: boolean = true): string {
  return formatTanggalIndo(new Date(), { withDayName });
}

/**
 * Checks if a date falls within the current month or the next month.
 */
export function isThisOrNextMonth(input: string | Date | number | null | undefined): boolean {
  if (!input) return true; // Keep items without explicit date
  const strInput = String(input).trim();
  if (!strInput || strInput === 'No Date' || strInput === '-') return true;

  const d = parseDateSafe(input);
  if (!d) return true;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0..11

  // Calculate next month
  const nextMonthObj = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthYear = nextMonthObj.getFullYear();
  const nextMonth = nextMonthObj.getMonth();

  const itemYear = d.getFullYear();
  const itemMonth = d.getMonth();

  const isCurrentMonth = itemYear === currentYear && itemMonth === currentMonth;
  const isNextMonth = itemYear === nextMonthYear && itemMonth === nextMonth;

  return isCurrentMonth || isNextMonth;
}

/**
 * Checks if a schedule item falls on today's date or today's day of week.
 */
export function isScheduleForToday(item: { tanggal?: string | null; day?: string | null } | null | undefined): boolean {
  if (!item) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0..11
  const currentDate = now.getDate();
  const todayYMD = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDate).padStart(2, '0')}`;
  const todayDayName = DAYS_INDO[now.getDay()];

  const cleanTanggal = item.tanggal ? String(item.tanggal).trim() : '';

  if (cleanTanggal) {
    // 1. Direct YYYY-MM-DD match or prefix (e.g. "2026-08-24" or "2026-08-24 00:00:00")
    if (cleanTanggal === todayYMD || cleanTanggal.startsWith(todayYMD)) {
      return true;
    }

    // 2. Parsed Date object check
    const parsed = parseDateSafe(cleanTanggal);
    if (parsed) {
      // If it's a valid date, it MUST match today's YYYY-MM-DD to be for today.
      return (
        parsed.getFullYear() === currentYear &&
        parsed.getMonth() === currentMonth &&
        parsed.getDate() === currentDate
      );
    } else {
      // 3. String might be Indonesian day name e.g. "Senin"
      if (cleanTanggal.toLowerCase() === todayDayName.toLowerCase()) {
        return true;
      }
    }
  }

  // 4. Day property match e.g. item.day === "Senin" (only if no specific invalid/different date was provided)
  if (item.day) {
    const cleanDay = String(item.day).trim();
    if (cleanDay.toLowerCase() === todayDayName.toLowerCase()) {
      return true;
    }
  }

  return false;
}

export interface ScheduleTimeStatus {
  isToday: boolean;
  isActiveNow: boolean;
  isUpcomingSoon: boolean;
  minutesRemaining: number;
  minutesUntilStart: number;
  startMin: number | null;
  endMin: number | null;
}

export function parseTimeInMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const clean = String(timeStr).trim().replace('.', ':');
  const parts = clean.split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function getScheduleTimeStatus(
  item: { tanggal?: string | null; day?: string | null; time_start?: string | null; time_end?: string | null } | null | undefined,
  simulatedTimeMinutes?: number | null
): ScheduleTimeStatus {
  const result: ScheduleTimeStatus = {
    isToday: false,
    isActiveNow: false,
    isUpcomingSoon: false,
    minutesRemaining: 0,
    minutesUntilStart: 0,
    startMin: null,
    endMin: null,
  };

  if (!item) return result;
  result.isToday = isScheduleForToday(item);
  if (!result.isToday) return result;

  const startMin = parseTimeInMinutes(item.time_start);
  const endMin = parseTimeInMinutes(item.time_end);
  result.startMin = startMin;
  result.endMin = endMin;

  if (startMin === null || endMin === null) return result;

  const now = new Date();
  const currentMin = simulatedTimeMinutes !== undefined && simulatedTimeMinutes !== null
    ? simulatedTimeMinutes
    : (now.getHours() * 60 + now.getMinutes());

  if (currentMin >= startMin && currentMin < endMin) {
    result.isActiveNow = true;
    result.minutesRemaining = endMin - currentMin;
  } else if (currentMin < startMin && (startMin - currentMin) <= 60) {
    result.isUpcomingSoon = true;
    result.minutesUntilStart = startMin - currentMin;
  }

  return result;
}

/**
 * Checks if a schedule item has finished (either date is in the past, or date is today and end-time has passed, or status is marked 'Selesai').
 */
export function isScheduleFinished(
  item: {
    tanggal?: string | null;
    day?: string | null;
    time_start?: string | null;
    time_end?: string | null;
    status?: string | null;
  } | null | undefined,
  simulatedTimeMinutes?: number | null
): boolean {
  if (!item) return false;

  // 1. Check if status explicitly says 'Selesai'
  if (item.status && String(item.status).trim().toLowerCase() === 'selesai') {
    return true;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const todayMidnight = new Date(currentYear, currentMonth, currentDate).getTime();

  const currentMin = simulatedTimeMinutes !== undefined && simulatedTimeMinutes !== null
    ? simulatedTimeMinutes
    : (now.getHours() * 60 + now.getMinutes());

  const endMin = parseTimeInMinutes(item.time_end);

  // 2. Check if tanggal is provided
  const cleanTanggal = item.tanggal ? String(item.tanggal).trim() : '';
  if (cleanTanggal && cleanTanggal !== 'No Date' && cleanTanggal !== '-') {
    const parsed = parseDateSafe(cleanTanggal);
    if (parsed) {
      const itemMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
      if (itemMidnight < todayMidnight) {
        // Date is strictly in the past
        return true;
      }
      if (itemMidnight > todayMidnight) {
        // Date is in the future
        return false;
      }
      // Date is TODAY: check time_end
      if (endMin !== null) {
        return currentMin >= endMin;
      }
      return false;
    }
  }

  // 3. If no explicit valid date, check day match (recurring schedule)
  if (isScheduleForToday(item)) {
    if (endMin !== null) {
      return currentMin >= endMin;
    }
  }

  return false;
}

