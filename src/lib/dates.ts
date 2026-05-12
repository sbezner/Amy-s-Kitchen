export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function monthRange(year: number, month0: number): { start: string; end: string } {
  return {
    start: toDateKey(new Date(year, month0, 1)),
    end: toDateKey(new Date(year, month0 + 1, 0)),
  }
}

export function buildMonthGrid(year: number, month0: number): Date[] {
  const first = new Date(year, month0, 1)
  const startOffset = first.getDay()
  const start = new Date(year, month0, 1 - startOffset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return days
}

export function isSameMonth(d: Date, year: number, month0: number): boolean {
  return d.getFullYear() === year && d.getMonth() === month0
}

function startOfToday(): Date {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export function isPastDay(d: Date): boolean {
  return d.getTime() < startOfToday().getTime()
}

export function isToday(d: Date): boolean {
  return d.getTime() === startOfToday().getTime()
}

export function isFuture(d: Date): boolean {
  return d.getTime() > startOfToday().getTime()
}

export function isPastOrToday(d: Date): boolean {
  return !isFuture(d)
}

export function formatDateHeading(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMonthLabel(year: number, month0: number): string {
  return new Date(year, month0, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function addMonths(year: number, month0: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month0 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}
