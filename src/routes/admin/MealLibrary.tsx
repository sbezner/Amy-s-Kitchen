import { Link } from 'react-router-dom'
import { useMealLibrary } from '../../lib/db'
import { DietaryTagChips } from '../../components/DietaryTagChips'

export function MealLibrary() {
  const { library, loading } = useMealLibrary()

  return (
    <div className="py-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Meal library</h2>
        <Link to="/meals/new" className="btn-primary text-sm py-2 px-4">
          + New meal
        </Link>
      </div>

      {loading && <div className="card text-sm text-ink-500">Loading…</div>}

      {!loading && library.length === 0 && (
        <div className="card">
          <p className="text-ink-700">
            No meals yet. Add your first one — it'll then be schedulable on any date.
          </p>
        </div>
      )}

      {library.map((entry) => (
        <Link
          key={entry.id}
          to={`/meals/${entry.id}`}
          className="card flex gap-4 hover:bg-cream-100/60 transition"
        >
          {entry.photoUrl ? (
            <img
              src={entry.photoUrl}
              alt=""
              className="w-20 h-20 object-cover rounded-2xl shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-cream-100 shrink-0 flex items-center justify-center text-3xl">
              🍽️
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-lg truncate">{entry.name}</div>
            {entry.description && (
              <div className="text-sm text-ink-500 line-clamp-2">{entry.description}</div>
            )}
            {entry.dietaryTags.length > 0 && (
              <div className="mt-2">
                <DietaryTagChips tags={entry.dietaryTags} />
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
