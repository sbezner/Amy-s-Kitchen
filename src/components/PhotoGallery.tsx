import { useEffect, useState } from 'react'

interface Props {
  photos: string[]
  alt?: string
}

export function PhotoGallery({ photos, alt = '' }: Props) {
  const [active, setActive] = useState(0)

  // Reset active index when the photo set changes (e.g. add/remove on edit).
  useEffect(() => {
    if (active >= photos.length) setActive(0)
  }, [photos, active])

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-3xl bg-cream-100 flex items-center justify-center text-5xl">
        🍽️
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <img
        src={photos[active]}
        alt={alt}
        className="w-full aspect-[4/3] object-cover rounded-3xl shadow-soft"
      />
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden transition ring-2 ${
                i === active ? 'ring-terracotta-500' : 'ring-transparent'
              }`}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
