import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildMonthGrid,
  formatMonthLabel,
  isSameMonth,
  isToday,
  isPastDay,
  toDateKey,
  addMonths,
} from '../lib/dates'
import { useServingsInRange, useMealLibrary } from '../lib/db'
import type { MealLibraryEntry, Serving } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  year: number
  month: number // 0-indexed
  onChangeMonth: (year: number, month: number) => void
}

export function MonthCalendar({ year, month, onChangeMonth }: Props) {
  const navigate = useNavigate()
  const days = useMemo(() => buildMonthGrid(year, month), [year, month])

  // Query a wide range covering the visible grid (some days fall outside the month).
  const rangeStart = toDateKey(days[0])
  const rangeEnd = toDateKey(days[days.length - 1])
  const { servings } = useServingsInRange(rangeStart, rangeEnd)
  const { library } = useMealLibrary()

  const libraryById = useMemo(() => {
    const map = new Map<string, MealLibraryEntry>()
    for (const e of library) map.set(e.id, e)
    return map
  }, [library])

  const servingByDate = useMemo(() => {
    const map = new Map<string, Serving>()
    for (const s of servings) map.set(s.servedDate, s)
    return map
  }, [servings])

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between px-2 py-1">
        <button
          className="btn-ghost px-3 py-2"
          onClick={() => {
            const next = addMonths(year, month, -1)
            onChangeMonth(next.year, next.month)
          }}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="text-lg">{formatMonthLabel(year, month)}</h2>
        <button
          className="btn-ghost px-3 py-2"
          onClick={() => {
            const next = addMonths(year, month, 1)
            onChangeMonth(next.year, next.month)
          }}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mt-2 mb-1 text-center text-xs font-semibold text-ink-500">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = toDateKey(d)
          const inMonth = isSameMonth(d, year, month)
          const today = isToday(d)
          const past = isPastDay(d)
          const serving = servingByDate.get(key)
          const entry = serving ? libraryById.get(serving.libraryId) : undefined

          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/day/${key}`)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-start p-1 text-sm transition relative ${
                inMonth ? 'bg-cream-50' : 'bg-transparent text-ink-500/40'
              } ${today ? 'ring-2 ring-terracotta-500' : ''} active:scale-95`}
            >
              <span className={`mt-0.5 ${today ? 'font-bold text-terracotta-600' : ''}`}>
                {d.getDate()}
              </span>
              {entry && (
                <div className="flex-1 w-full mt-0.5 flex items-end justify-center overflow-hidden">
                  {entry.photoUrl ? (
                    <img
                      src={entry.photoUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span
                      className={`w-full truncate rounded-lg px-1 py-0.5 text-[10px] font-semibold ${
                        past ? 'bg-sage-500/15 text-sage-600' : 'bg-terracotta-500/15 text-terracotta-700'
                      }`}
                    >
                      {entry.name}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
