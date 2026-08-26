/**
 * Utility functions for formatting academic scores and numbers
 */

/**
 * Rounds a score to maximum N decimal places (default 2)
 */
export function roundScore(val: number | string | null | undefined, decimals = 2): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a score with at most 2 decimal digits, using comma as decimal separator
 * Example: 257.519803251275 -> "257,52", 80 -> "80", 85.5 -> "85,5"
 */
export function formatScore(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return String(val);
  
  // Round to max 2 decimal places
  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  
  // Format with Indonesian decimal comma
  return rounded.toString().replace('.', ',');
}
