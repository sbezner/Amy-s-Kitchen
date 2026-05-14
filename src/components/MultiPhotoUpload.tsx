import { useRef, useState } from 'react'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase'

interface Props {
  libraryId: string
  photos: string[]
  onChange: (photos: string[]) => void
  max?: number
}

export function MultiPhotoUpload({ libraryId, photos, onChange, max = 6 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const atMax = photos.length >= max

  async function handleFile(file: File) {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Each photo must be under 5 MB.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `meals/${libraryId}/${Date.now()}.${ext}`
      const r = storageRef(storage, path)
      await uploadBytes(r, file)
      const url = await getDownloadURL(r)
      onChange([...photos, url])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function move(index: number, delta: number) {
    const next = [...photos]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  async function remove(index: number) {
    const url = photos[index]
    const next = photos.filter((_, i) => i !== index)
    onChange(next)
    // Best-effort delete from storage; ignore errors (file may already be gone).
    try {
      await deleteObject(storageRef(storage, url))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-cream-100">
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-terracotta-500 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              <div className="absolute bottom-1 right-1 flex gap-1">
                <button
                  type="button"
                  className="bg-white/90 hover:bg-white rounded-full w-7 h-7 text-sm font-bold shadow"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="bg-white/90 hover:bg-white rounded-full w-7 h-7 text-sm font-bold shadow"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label="Move later"
                >
                  →
                </button>
                <button
                  type="button"
                  className="bg-white/90 hover:bg-white rounded-full w-7 h-7 text-sm font-bold text-terracotta-700 shadow"
                  onClick={() => remove(i)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!atMax && (
        <button
          type="button"
          className="w-full rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 text-ink-500 py-4 flex flex-col items-center gap-1 hover:bg-cream-100 transition disabled:opacity-60"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="13" r="3" />
            <path d="M8 5l1.5-2h5L16 5" />
          </svg>
          <span className="text-sm font-semibold">
            {uploading ? 'Uploading…' : photos.length === 0 ? 'Add a photo' : `Add another (${photos.length}/${max})`}
          </span>
        </button>
      )}
      {atMax && (
        <p className="text-xs text-ink-500 text-center">Maximum {max} photos.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          e.target.value = ''
        }}
      />
      {error && <p className="text-sm text-terracotta-700">{error}</p>}
    </div>
  )
}
