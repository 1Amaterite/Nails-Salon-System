/**
 * Converts 12-hour time format string (e.g. "09:00 AM") to 24-hour time format string (e.g. "09:00").
 */
export function time12to24(time12: string): string {
  if (!time12) return '09:00';
  const [time, period] = time12.split(' ');
  const [hourStr, minStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const hStr = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hStr}:${minStr}`;
}

/**
 * Converts 24-hour time format string (e.g. "09:00") to 12-hour time format string (e.g. "09:00 AM").
 */
export function time24to12(time24: string): string {
  if (!time24) return '09:00 AM';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hStr = hour12 < 10 ? `0${hour12}` : `${hour12}`;
  return `${hStr}:${minStr} ${period}`;
}

/**
 * Generates an array of all 15-minute interval time options in a 12-hour format string (e.g. ["12:00 AM", "12:15 AM", ...]).
 */
export function generateTimeOptions(): string[] {
  const options = [];
  const periods = ['AM', 'PM'];
  for (let p = 0; p < 2; p++) {
    const period = periods[p];
    for (let h = 0; h < 12; h++) {
      const hour = h === 0 ? 12 : h;
      const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
      for (let m = 0; m < 60; m += 15) {
        const minStr = m < 10 ? `0${m}` : `${m}`;
        options.push(`${hourStr}:${minStr} ${period}`);
      }
    }
  }
  return options;
}
