// Display formatting and <input type="datetime-local"> conversion, in Estonian locale.

const dateTimeFormat = new Intl.DateTimeFormat('et-EE', { dateStyle: 'medium', timeStyle: 'short' })
const priceFormat = new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' })

/** "23. nov 2026, 19:00" in the browser's time zone. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

const dayFormat = new Intl.DateTimeFormat('et-EE', { day: '2-digit' })
const monthShortFormat = new Intl.DateTimeFormat('et-EE', { month: 'short' })

/** "04" in the browser's time zone. */
export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso))
}

/** "dets" in the browser's time zone (shown in capitals with CSS). */
export function formatMonthShort(iso: string): string {
  return monthShortFormat.format(new Date(iso))
}

const timeFormat = new Intl.DateTimeFormat('et-EE', { timeStyle: 'short' })

/** "19:00" in the browser's time zone. */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

/** "15,00 €" */
export function formatPrice(price: number): string {
  return priceFormat.format(price)
}

/** Row number as shown in the hall: 1 → "A", 26 → "Z", 27 → "AA" (halls have up to 50 rows). */
export function rowLabel(row: number): string {
  let label = ''
  for (let n = row; n > 0; n = Math.floor((n - 1) / 26)) {
    label = String.fromCharCode(65 + ((n - 1) % 26)) + label
  }
  return label
}

const pad = (value: number) => String(value).padStart(2, '0')

/** UTC ISO string → "YYYY-MM-DDTHH:mm" in local time, the value format of datetime-local inputs. */
export function toDateTimeLocal(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** "YYYY-MM-DDTHH:mm" (local time, as datetime-local gives it) → UTC ISO string for the API. */
export function fromDateTimeLocal(value: string): string {
  // Date parses a date-time string without an offset as local time.
  return new Date(value).toISOString()
}
