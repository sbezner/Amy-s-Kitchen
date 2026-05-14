import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../firebase'
import { useMealLibrary } from '../../lib/db'
import { useUsers } from '../../lib/users'
import { todayKey, toDateKey } from '../../lib/dates'
import { Loading } from '../../components/Loading'
import { StarRating } from '../../components/StarRating'
import type { MealLibraryEntry } from '../../types'

interface RatingRow {
  mealId: string
  uid: string
  stars: number
  comment: string
  hiddenByAmy: boolean
  updatedAt: number
}

interface MealAggregate {
  mealId: string
  servingsCount: number
  lastServedDate: string | null
  ratingsCount: number
  avgStars: number
}

function thirtyDaysAgoKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toDateKey(d)
}

async function fetchAll() {
  const [mealsSnap, servingsSnap] = await Promise.all([
    getDocs(collection(db, 'mealLibrary')),
    getDocs(collection(db, 'servings')),
  ])

  // Servings per meal id.
  const servingsByMeal = new Map<string, { count: number; lastDate: string | null }>()
  for (const d of servingsSnap.docs) {
    const data = d.data()
    const lib = data.libraryId as string | undefined
    const date = data.servedDate as string | undefined
    if (!lib || !date) continue
    const cur = servingsByMeal.get(lib) ?? { count: 0, lastDate: null as string | null }
    cur.count += 1
    if (!cur.lastDate || date > cur.lastDate) cur.lastDate = date
    servingsByMeal.set(lib, cur)
  }

  // All ratings, across all meals.
  const ratings: RatingRow[] = []
  const ratingsByMeal = new Map<string, RatingRow[]>()
  await Promise.all(
    mealsSnap.docs.map(async (mealDoc) => {
      const rSnap = await getDocs(collection(db, 'mealLibrary', mealDoc.id, 'ratings'))
      const rows = rSnap.docs.map((r) => ({
        mealId: mealDoc.id,
        uid: r.id,
        stars: (r.data().stars as number) ?? 0,
        comment: (r.data().comment as string) ?? '',
        hiddenByAmy: Boolean(r.data().hiddenByAmy),
        updatedAt: r.data().updatedAt?.toMillis?.() ?? 0,
      }))
      ratings.push(...rows)
      ratingsByMeal.set(mealDoc.id, rows)
    }),
  )

  return { ratings, ratingsByMeal, servingsByMeal }
}

function aggregate(
  mealIds: Iterable<string>,
  ratingsByMeal: Map<string, RatingRow[]>,
  servingsByMeal: Map<string, { count: number; lastDate: string | null }>,
): MealAggregate[] {
  const out: MealAggregate[] = []
  for (const id of mealIds) {
    const ratings = (ratingsByMeal.get(id) ?? []).filter((r) => !r.hiddenByAmy)
    const servings = servingsByMeal.get(id)
    out.push({
      mealId: id,
      servingsCount: servings?.count ?? 0,
      lastServedDate: servings?.lastDate ?? null,
      ratingsCount: ratings.length,
      avgStars: ratings.length ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length : 0,
    })
  }
  return out
}

export function Reports() {
  const navigate = useNavigate()
  const { library } = useMealLibrary()
  const { users } = useUsers()
  const [data, setData] = useState<{
    ratings: RatingRow[]
    ratingsByMeal: Map<string, RatingRow[]>
    servingsByMeal: Map<string, { count: number; lastDate: string | null }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await fetchAll()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const libraryById = useMemo(() => {
    const m = new Map<string, MealLibraryEntry>()
    for (const e of library) m.set(e.id, e)
    return m
  }, [library])

  if (loading) return <Loading label="Crunching the numbers…" />
  if (error || !data) {
    return (
      <div className="py-4">
        <div className="card text-terracotta-700">{error ?? 'No data.'}</div>
      </div>
    )
  }

  const thirty = thirtyDaysAgoKey()
  const allServedMealIds = new Set<string>()
  const recentMealIds = new Set<string>()
  for (const [mealId, info] of data.servingsByMeal) {
    if (info.count > 0) allServedMealIds.add(mealId)
    if (info.lastDate && info.lastDate >= thirty) recentMealIds.add(mealId)
  }

  const allAgg = aggregate(allServedMealIds, data.ratingsByMeal, data.servingsByMeal)
  const last30Agg = aggregate(recentMealIds, data.ratingsByMeal, data.servingsByMeal)

  return (
    <div className="py-4 space-y-6">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Reports</h2>
        <button
          className="btn-secondary text-sm px-3 py-2"
          onClick={() => downloadCsv(data.ratings, libraryById, users)}
        >
          Export CSV
        </button>
      </div>

      <Section
        title="Last 30 days"
        aggregates={last30Agg}
        libraryById={libraryById}
        emptyMsg="No meals served in the last 30 days."
      />

      <Section
        title="All time"
        aggregates={allAgg}
        libraryById={libraryById}
        emptyMsg="No meals served yet."
      />
    </div>
  )
}

function Section({
  title,
  aggregates,
  libraryById,
  emptyMsg,
}: {
  title: string
  aggregates: MealAggregate[]
  libraryById: Map<string, MealLibraryEntry>
  emptyMsg: string
}) {
  if (aggregates.length === 0) {
    return (
      <section>
        <h3 className="text-xl mb-2">{title}</h3>
        <div className="card text-sm text-ink-500">{emptyMsg}</div>
      </section>
    )
  }

  const eligible = aggregates.filter((a) => a.ratingsCount >= 2)
  const mostLiked = [...eligible].sort((a, b) => b.avgStars - a.avgStars).slice(0, 5)
  const leastLiked = [...eligible].sort((a, b) => a.avgStars - b.avgStars).slice(0, 5)
  const mostFrequent = [...aggregates].sort((a, b) => b.servingsCount - a.servingsCount).slice(0, 5)

  return (
    <section className="space-y-3">
      <h3 className="text-xl">{title}</h3>

      <SubBlock label="Most liked" empty="Need at least 2 ratings to rank.">
        {mostLiked.map((a) => (
          <AggregateRow key={a.mealId} a={a} libraryById={libraryById} />
        ))}
      </SubBlock>

      <SubBlock label="Least liked" empty="Need at least 2 ratings to rank.">
        {leastLiked.map((a) => (
          <AggregateRow key={a.mealId} a={a} libraryById={libraryById} />
        ))}
      </SubBlock>

      <SubBlock label="Most frequent" empty="Nothing on the calendar yet.">
        {mostFrequent.map((a) => (
          <AggregateRow key={a.mealId} a={a} libraryById={libraryById} />
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
  a: MealAggregate
  libraryById: Map<string, MealLibraryEntry>
}) {
  const entry = libraryById.get(a.mealId)
  const photo = entry?.photos[0]
  return (
    <div className="card flex items-center gap-3">
      {photo ? (
        <img src={photo} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-cream-100 shrink-0 flex items-center justify-center text-xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{entry?.name ?? 'Unknown meal'}</div>
        <div className="text-xs text-ink-500">
          {a.servingsCount > 0 && `served ${a.servingsCount}× · `}
          {a.ratingsCount} rating{a.ratingsCount === 1 ? '' : 's'}
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-display font-bold text-xl">
          {a.ratingsCount > 0 ? a.avgStars.toFixed(1) : '—'}
        </div>
        <StarRating value={Math.round(a.avgStars)} size="sm" />
      </div>
    </div>
  )
}

function downloadCsv(
  ratings: RatingRow[],
  libraryById: Map<string, MealLibraryEntry>,
  users: Map<string, { displayName: string }>,
) {
  const header = ['meal', 'employee', 'stars', 'comment', 'hidden', 'updated']
  const escape = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
  const rows = ratings
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((r) =>
      [
        libraryById.get(r.mealId)?.name ?? 'Unknown',
        users.get(r.uid)?.displayName || 'Member',
        String(r.stars),
        r.comment,
        r.hiddenByAmy ? 'yes' : 'no',
        r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
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
