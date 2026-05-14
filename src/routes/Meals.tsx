import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useMealLibrary } from '../lib/db'
import type { MealLibraryEntry } from '../types'
import { DietaryTagChips } from '../components/DietaryTagChips'

type Filter = 'all' | 'active' | 'suggested' | 'declined'

interface MealStats {
  servingsCount: number
  avgStars: number
  ratingsCount: number
  upvotes: number
}

export function Meals() {
  const { library, loading } = useMealLibrary()
  const [filter, setFilter] = useState<Filter>('all')
  const [stats, setStats] = useState<Map<string, MealStats>>(new Map())

  // Load aggregate stats for every meal once. Small data set; live snapshots
  // per meal would be wasteful when most users just browse the list.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = new Map<string, MealStats>()
      const servingsSnap = await getDocs(collection(db, 'servings'))
      const servingsByMeal = new Map<string, number>()
      servingsSnap.docs.forEach((d) => {
        const lib = d.data().libraryId as string
        if (lib) servingsByMeal.set(lib, (servingsByMeal.get(lib) ?? 0) + 1)
      })

      await Promise.all(
        library.map(async (m) => {
          const [ratingsSnap, upvotesSnap] = await Promise.all([
            getDocs(collection(db, 'mealLibrary', m.id, 'ratings')),
            getDocs(collection(db, 'mealLibrary', m.id, 'upvotes')),
          ])
          const ratings = ratingsSnap.docs
            .map((r) => r.data())
            .filter((r) => !r.hiddenByAmy)
          const sum = ratings.reduce((acc, r) => acc + (r.stars as number ?? 0), 0)
          next.set(m.id, {
            servingsCount: servingsByMeal.get(m.id) ?? 0,
            ratingsCount: ratings.length,
            avgStars: ratings.length ? sum / ratings.length : 0,
            upvotes: upvotesSnap.size,
          })
        }),
      )

      if (!cancelled) setStats(next)
    })()
    return () => {
      cancelled = true
    }
  }, [library])

  const filtered = useMemo(() => {
    return library.filter((m) => {
      if (m.declinedReason) return filter === 'all' || filter === 'declined'
      const s = stats.get(m.id)
      const isActive = (s?.servingsCount ?? 0) > 0
      if (filter === 'active') return isActive
      if (filter === 'suggested') return !isActive
      if (filter === 'declined') return false
      return true
    })
  }, [library, filter, stats])

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Meals</h2>
        <Link to="/meals/new" className="btn-primary text-sm py-2 px-4">
          + New meal
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(
          [
            { v: 'all', label: 'All' },
            { v: 'active', label: 'Active' },
            { v: 'suggested', label: 'Suggested' },
            { v: 'declined', label: 'Declined' },
          ] as const
        ).map((tab) => {
          const active = filter === tab.v
          return (
            <button
              key={tab.v}
              onClick={() => setFilter(tab.v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                active ? 'bg-terracotta-500 text-white' : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading && <div className="card text-sm text-ink-500">Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <p className="text-ink-700">
            {filter === 'all'
              ? "No meals yet. Add the first one — anyone can."
              : `Nothing in this view.`}
          </p>
        </div>
      )}

      {filtered.map((entry) => (
        <MealCard key={entry.id} entry={entry} stats={stats.get(entry.id)} />
      ))}
    </div>
  )
}

function MealCard({ entry, stats }: { entry: MealLibraryEntry; stats: MealStats | undefined }) {
  const photo = entry.photos[0]
  return (
    <Link
      to={`/meals/${entry.id}`}
      className="card flex gap-4 hover:bg-cream-100/60 transition"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          className="w-20 h-20 object-cover rounded-2xl shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-cream-100 shrink-0 flex items-center justify-center text-3xl">
          🍽️
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-semibold text-lg truncate">{entry.name}</div>
          {entry.declinedReason && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-terracotta-700 bg-terracotta-500/20 px-2 py-0.5 rounded-full">
              Declined
            </span>
          )}
        </div>
        {entry.description && (
          <div className="text-sm text-ink-500 line-clamp-2">{entry.description}</div>
        )}
        {entry.dietaryTags.length > 0 && (
          <div className="mt-2">
            <DietaryTagChips tags={entry.dietaryTags} />
          </div>
        )}
        {stats && (
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
            {stats.ratingsCount > 0 && (
              <span>
                ★ {stats.avgStars.toFixed(1)} · {stats.ratingsCount}
              </span>
            )}
            {stats.servingsCount > 0 && (
              <span>
                Served {stats.servingsCount}×
              </span>
            )}
            {stats.upvotes > 0 && (
              <span>
                👍 {stats.upvotes}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
