import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MonthCalendar } from '../components/MonthCalendar'
import { fromDateKey, isValidDateKey } from '../lib/dates'

export function Calendar() {
  const [params] = useSearchParams()
  const [{ year, month }, setCursor] = useState(() => {
    // Allow callers to land us on a specific month via ?d=YYYY-MM-DD
    // (e.g. after scheduling, jump back to the month of the date).
    const hint = params.get('d')
    if (hint && isValidDateKey(hint)) {
      const d = fromDateKey(hint)
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  return (
    <div className="py-4 space-y-4">
      <MonthCalendar
        year={year}
        month={month}
        onChangeMonth={(y, m) => setCursor({ year: y, month: m })}
      />
    </div>
  )
}
