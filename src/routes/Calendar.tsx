import { useState } from 'react'
import { MonthCalendar } from '../components/MonthCalendar'

export function Calendar() {
  const [{ year, month }, setCursor] = useState(() => {
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
