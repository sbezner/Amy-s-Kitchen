import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useMealLibrary } from '../../lib/db'
import { todayKey, toDateKey, fromDateKey, formatDateHeading } from '../../lib/dates'
import { Loading } from '../../components/Loading'
import { StarRating } from '../../components/StarRating'
import type { MealLibraryEntry } from '../../types'

interface RatingRow {
  servingId: string
  servingDate: string
  libraryId: string
  uid: string
  raterDisplayName: string
  stars: number
  comment: string
  hiddenByAmy: boolean
}

interface ServingMeta {
  id: string
  date: string
  libraryId: string
  ratingsCount: number
  avgStars: number
}

interface LibraryAggregate {
  libraryId: string
  count: number
  avgStars: number
}

function thirtyDaysAgoKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toDateKey(d)
}

async function fetchAllPastData() {
  const today = todayKey()
  const servingsSnap = await getDocs(
    query(collection(db, 'servings'), where('servedDate', '<=', today)),
  )

  const ratingsPromises = servingsSnap.docs.map(async (servingDoc) => {
    const ratingsSnap = await getDocs(collection(db, 'servings', servingDoc.id, 'ratings'))
    return { servingDoc, ratingsSnap }
  })

  const results = await Promise.all(ratingsPromises)

  const ratings: RatingRow[] = []
  const servings: ServingMeta[] = []

  for (const { servingDoc, ratingsSnap } of results) {
    const sData = servingDoc.data()
    const libraryId = sData.libraryId
    const date = sData.servedDate
    const servingRatings = ratingsSnap.docs.map((d) => {
      const data = d.data()
      return {
        servingId: servingDoc.id,
        servingDate: date,
        libraryId,
        uid: d.id,
        raterDisplayName: data.raterDisplayName ?? 'Member',
        stars: data.stars ?? 0,
        comment: data.comment ?? '',
        hiddenByAmy: Boolean(data.hiddenByAmy),
      }
    })
    ratings.push(...servingRatings)
    const sum = servingRatings.reduce((a, r) => a + r.stars, 0)
    servings.push({
      id: servingDoc.id,
      date,
      libraryId,
      ratingsCount: servingRatings.length,
      avgStars: servingRatings.length ? sum / servingRatings.length : 0,
    })
  }

  return { ratings, servings }
}

async function fetchActiveEmployeeCount(): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'users'), where('status', '==', 'approved')),
  )
  // Active employees who can rate = approved users who aren't Amy.
  return snap.docs.filter((d) => d.data().role !== 'amy').length
}

function aggregateByLibrary(rows: RatingRow[]): LibraryAggregate[] {
  const map = new Map<string, { count: number; sum: number }>()
  for (const r of rows) {
    const cur = map.get(r.libraryId) ?? { count: 0, sum: 0 }
    cur.count += 1
    cur.sum += r.stars
    map.set(r.libraryId, cur)
  }
  return Array.from(map.entries()).map(([libraryId, v]) => ({
    libraryId,
    count: v.count,
    avgStars: v.sum / v.count,
  }))
}

export function Reports() {
  const navigate = useNavigate()
  const { library } = useMealLibrary()
  const [data, setData] = useState<{ ratings: RatingRow[]; servings: ServingMeta[] } | null>(null)
  const [activeCount, setActiveCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [{ ratings, servings }, count] = await Promise.all([
          fetchAllPastData(),
          fetchActiveEmployeeCount(),
        ])
        if (cancelled) return
        setData({ ratings, servings })
        setActiveCount(count)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const libraryById = useMemo(() => {
    const map = new Map<string, MealLibraryEntry>()
    for (const e of library) map.set(e.id, e)
    return map
  }, [library])

  if (loading) return <Loading label="Crunching the numbers…" />
  if (error || !data) {
    return (
      <div className="py-4">
        <div className="card text-terracotta-700">{error ?? 'No data.'}</div>
      </div>
    )
  }

  const thirtyDaysAgo = thirtyDaysAgoKey()
  // Aggregates exclude hidden ratings so they don't skew the report
  // averages the way they would if we just counted everything.
  const countable = data.ratings.filter((r) => !r.hiddenByAmy)
  const countable30 = countable.filter((r) => r.servingDate >= thirtyDaysAgo)
  const servings30 = data.servings.filter((s) => s.date >= thirtyDaysAgo)

  const allTime = aggregateByLibrary(countable)
  const last30 = aggregateByLibrary(countable30)

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Reports</h2>
        <button
          className="btn-secondary text-sm px-3 py-2"
          onClick={() => downloadCsv(data.ratings, libraryById)}
        >
          Export CSV
        </button>
      </div>

      <ReportSection
        title="Last 30 days"
        aggregates={last30}
        servings={servings30}
        activeCount={activeCount}
        libraryById={libraryById}
      />

      <ReportSection
        title="All time"
        aggregates={allTime}
        servings={data.servings}
        activeCount={activeCount}
        libraryById={libraryById}
      />
    </div>
  )
}

function ReportSection({
  title,
  aggregates,
  servings,
  activeCount,
  libraryById,
}: {
  title: string
  aggregates: LibraryAggregate[]
  servings: ServingMeta[]
  activeCount: number
  libraryById: Map<string, MealLibraryEntry>
}) {
  const eligible = aggregates.filter((a) => a.count >= 2)
  const mostLiked = [...eligible].sort((a, b) => b.avgStars - a.avgStars).slice(0, 5)
  const leastLiked = [...eligible].sort((a, b) => a.avgStars - b.avgStars).slice(0, 5)
  const threshold = Math.max(1, Math.ceil(activeCount * 0.5))
  const needsAttention = activeCount > 0
    ? servings.filter((s) => s.ratingsCount < threshold).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
    : []

  return (
    <section className="space-y-3">
      <h3 className="text-xl">{title}</h3>

      <SubBlock label="Most liked" empty="Not enough ratings yet (need 2+ per meal).">
        {mostLiked.map((a) => (
          <AggregateRow key={a.libraryId} a={a} libraryById={libraryById} />
        ))}
      </SubBlock>

      <SubBlock label="Least liked" empty="Not enough ratings yet (need 2+ per meal).">
        {leastLiked.map((a) => (
          <AggregateRow key={a.libraryId} a={a} libraryById={libraryById} />
        ))}
      </SubBlock>

      <SubBlock
        label={`Needs attention · fewer than ${threshold} ratings`}
        empty={activeCount === 0 ? 'No active employees on the roster yet.' : 'Every meal got a good response.'}
      >
        {needsAttention.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {libraryById.get(s.libraryId)?.name ?? 'Unknown meal'}
              </div>
              <div className="text-xs text-ink-500">
                {formatDateHeading(fromDateKey(s.date))} ·{' '}
                {s.ratingsCount === 0
                  ? 'no ratings'
                  : `${s.ratingsCount} / ${activeCount} employees rated`}
              </div>
            </div>
          </div>
        ))}
      </SubBlock>
    </section>
  )
}

function SubBlock({
  label,
  empty,
  children,
}: {
  label: string
  empty: string
  children: React.ReactNode
}) {
  const has = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 px-1">
        {label}
      </div>
      {has ? children : <div className="card text-sm text-ink-500">{empty}</div>}
    </div>
  )
}

function AggregateRow({
  a,
  libraryById,
}: {
  a: LibraryAggregate
  libraryById: Map<string, MealLibraryEntry>
}) {
  const entry = libraryById.get(a.libraryId)
  return (
    <div className="card flex items-center gap-3">
      {entry?.photoUrl ? (
        <img src={entry.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-cream-100 shrink-0 flex items-center justify-center text-xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{entry?.name ?? 'Unknown meal'}</div>
        <div className="text-xs text-ink-500">
          {a.count} rating{a.count === 1 ? '' : 's'}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-display font-bold text-xl">{a.avgStars.toFixed(1)}</div>
        <StarRating value={Math.round(a.avgStars)} size="sm" />
      </div>
    </div>
  )
}

function downloadCsv(ratings: RatingRow[], libraryById: Map<string, MealLibraryEntry>) {
  const header = ['date', 'meal', 'employee', 'stars', 'comment', 'hidden']
  const escape = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
  const rows = ratings
    .slice()
    .sort((a, b) => a.servingDate.localeCompare(b.servingDate))
    .map((r) =>
      [
        r.servingDate,
        libraryById.get(r.libraryId)?.name ?? 'Unknown',
        r.raterDisplayName,
        String(r.stars),
        r.comment,
        r.hiddenByAmy ? 'yes' : 'no',
      ]
        .map(escape)
        .join(','),
    )
  const csv = [header.map(escape).join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `amys-kitchen-ratings-${todayKey()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
