import { useRef, useState } from 'react'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

interface Props {
  libraryId: string
  currentUrl?: string
  onChange: (url: string | undefined) => void
}

export function PhotoUpload({ libraryId, currentUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `meals/${libraryId}/${Date.now()}.${ext}`
      const r = storageRef(storage, path)
      await uploadBytes(r, file)
      const url = await getDownloadURL(r)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    if (!currentUrl) return
    try {
      // Best-effort delete; ignore errors (file may already be gone).
      const r = storageRef(storage, currentUrl)
      await deleteObject(r).catch(() => undefined)
    } finally {
      onChange(undefined)
    }
  }

  return (
    <div>
      {currentUrl ? (
        <div className="relative">
          <img
            src={currentUrl}
            alt=""
            className="w-full aspect-[4/3] object-cover rounded-2xl"
          />
          <button
            type="button"
            className="absolute top-2 right-2 btn-secondary text-sm px-3 py-1.5"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 text-ink-500 flex flex-col items-center justify-center gap-2 hover:bg-cream-100 transition"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="13" r="3" />
            <path d="M8 5l1.5-2h5L16 5" />
          </svg>
          <span className="text-sm font-semibold">
            {uploading ? 'Uploading…' : 'Add a photo (optional)'}
          </span>
        </button>
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
      {error && <p className="mt-2 text-sm text-terracotta-700">{error}</p>}
    </div>
  )
}
