import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../auth/AuthProvider'
import { DietaryTagPicker } from '../../components/DietaryTagChips'
import { PhotoUpload } from '../../components/PhotoUpload'
import { Loading } from '../../components/Loading'
import type { DietaryTag } from '../../types'

export function EditMeal() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'
  const isNew = !id

  // For new meals we pre-generate an ID so the photo upload has a stable path.
  const [docId] = useState(() => id ?? doc(collection(db, 'mealLibrary')).id)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)
  const [tags, setTags] = useState<DietaryTag[]>([])

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const snap = await getDoc(doc(db, 'mealLibrary', docId))
      if (snap.exists()) {
        const d = snap.data()
        setName(d.name ?? '')
        setDescription(d.description ?? '')
        setPhotoUrl(d.photoUrl)
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
        {
          name: name.trim(),
          description: description.trim(),
          photoUrl: photoUrl ?? null,
          dietaryTags: tags,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      )
      navigate('/meals', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this meal from the library? Past servings of it will show "Unknown meal".')) {
      return
    }
    try {
      await deleteDoc(doc(db, 'mealLibrary', docId))
      navigate('/meals', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete meal')
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
          <div className="label">Photo</div>
          <PhotoUpload libraryId={docId} currentUrl={photoUrl} onChange={setPhotoUrl} />
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

      {!isNew && isAmy && (
        <button
          type="button"
          className="btn-ghost w-full text-terracotta-700"
          onClick={handleDelete}
        >
          Delete from library
        </button>
      )}
    </form>
  )
}
