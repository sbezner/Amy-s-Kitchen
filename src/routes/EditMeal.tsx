import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { DietaryTagPicker } from '../components/DietaryTagChips'
import { MultiPhotoUpload } from '../components/MultiPhotoUpload'
import { Loading } from '../components/Loading'
import type { DietaryTag } from '../types'

export function EditMeal() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const isNew = !id

  const [docId] = useState(() => id ?? doc(collection(db, 'mealLibrary')).id)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [tags, setTags] = useState<DietaryTag[]>([])

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const snap = await getDoc(doc(db, 'mealLibrary', docId))
      if (snap.exists()) {
        const d = snap.data()
        setName(d.name ?? '')
        setDescription(d.description ?? '')
        // Backfill from legacy photoUrl if photos[] is absent.
        const next: string[] = Array.isArray(d.photos)
          ? d.photos.filter((p: unknown): p is string => typeof p === 'string')
          : d.photoUrl
            ? [d.photoUrl as string]
            : []
        setPhotos(next)
        setTags((d.dietaryTags ?? []) as DietaryTag[])
      }
      setLoading(false)
    })()
  }, [isNew, docId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'mealLibrary', docId),
        isNew
          ? {
              name: name.trim(),
              description: description.trim(),
              photos,
              dietaryTags: tags,
              createdAt: serverTimestamp(),
              createdBy: appUser?.uid ?? null,
              // Explicit null clears legacy photoUrl on any future writes.
              photoUrl: null,
            }
          : {
              name: name.trim(),
              description: description.trim(),
              photos,
              dietaryTags: tags,
              photoUrl: null,
            },
        { merge: true },
      )
      navigate(`/meals/${docId}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <form onSubmit={submit} className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">{isNew ? 'New meal' : 'Edit meal'}</h2>
        <span aria-hidden className="w-12" />
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lasagna, Pad Thai, Sunday Roast…"
            maxLength={120}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short note about this dish, what's in it, why people might love it."
            maxLength={2000}
          />
        </div>

        <div>
          <div className="label">Photos</div>
          <p className="text-xs text-ink-500 mb-2">
            Up to 6. The first one is the primary — it shows up on the calendar and meal lists.
          </p>
          <MultiPhotoUpload libraryId={docId} photos={photos} onChange={setPhotos} />
        </div>

        <div>
          <div className="label">Dietary tags</div>
          <DietaryTagPicker selected={tags} onChange={setTags} />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={saving || !name.trim()}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
