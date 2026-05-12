import type { DietaryTag } from '../types'

export const ALL_TAGS: DietaryTag[] = [
  'dairy',
  'nuts',
  'gluten',
  'shellfish',
  'eggs',
  'soy',
  'vegetarian',
  'vegan',
  'gluten-free',
]

const CONTAINS: DietaryTag[] = ['dairy', 'nuts', 'gluten', 'shellfish', 'eggs', 'soy']

function isContains(tag: DietaryTag) {
  return CONTAINS.includes(tag)
}

function label(tag: DietaryTag): string {
  if (isContains(tag)) return `Contains ${tag}`
  if (tag === 'gluten-free') return 'Gluten-free'
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

export function DietaryTagChips({ tags }: { tags: DietaryTag[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            isContains(t) ? 'bg-terracotta-500/15 text-terracotta-700' : 'bg-sage-500/15 text-sage-600'
          }`}
        >
          {label(t)}
        </span>
      ))}
    </div>
  )
}

export function DietaryTagPicker({
  selected,
  onChange,
}: {
  selected: DietaryTag[]
  onChange: (tags: DietaryTag[]) => void
}) {
  function toggle(tag: DietaryTag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-ink-500 mb-1.5">Contains</div>
        <div className="flex flex-wrap gap-1.5">
          {CONTAINS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                selected.includes(t)
                  ? 'bg-terracotta-500 text-white'
                  : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-ink-500 mb-1.5">Suitable for</div>
        <div className="flex flex-wrap gap-1.5">
          {(['vegetarian', 'vegan', 'gluten-free'] as DietaryTag[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                selected.includes(t)
                  ? 'bg-sage-500 text-white'
                  : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
              }`}
            >
              {t === 'gluten-free' ? 'Gluten-free' : t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
