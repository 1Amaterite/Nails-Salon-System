/**
 * Adds a given number of minutes to an HH:MM time string.
 *
 * @param timeStr - A 24-hour time string in "HH:MM" format.
 * @param minutes - Number of minutes to add.
 * @returns A new "HH:MM" string with the result, wrapping at midnight.
 *
 * @example
 * addMinutesToTime('14:45', 90) // => '16:15'
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

export function getStartOfTodayInPH(): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const month = parts.find((p) => p.type === 'month')!.value;
    const day = parts.find((p) => p.type === 'day')!.value;
    const year = parts.find((p) => p.type === 'year')!.value;
    return new Date(`${year}-${month}-${day}T00:00:00.000+08:00`);
}
