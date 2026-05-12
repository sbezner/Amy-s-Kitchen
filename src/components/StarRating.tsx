interface Props {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  label?: string
}

const SIZES = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function StarRating({ value, onChange, size = 'md', disabled = false, label }: Props) {
  const interactive = Boolean(onChange) && !disabled
  return (
    <div role="radiogroup" aria-label={label ?? 'Rating'} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            className={`p-1 ${interactive ? 'active:scale-90 transition' : 'cursor-default'}`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`${SIZES[size]} ${filled ? 'text-terracotta-500' : 'text-cream-300'}`}
              fill="currentColor"
              stroke={filled ? 'none' : 'currentColor'}
              strokeWidth={filled ? 0 : 1.5}
            >
              <path d="M12 2.5l2.95 6.18 6.8.78-5.05 4.65 1.42 6.74L12 17.6l-6.12 3.25 1.42-6.74L2.25 9.46l6.8-.78L12 2.5z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
