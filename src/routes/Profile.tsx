import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'

export function Profile() {
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const [displayName, setDisplayName] = useState(appUser?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (appUser) setDisplayName(appUser.displayName)
  }, [appUser])

  if (!appUser) return null

  const dirty = displayName.trim() !== appUser.displayName

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!appUser || !dirty) return
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        displayName: trimmed,
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="py-4 space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <button type="button" className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Your profile</h2>
        <span aria-hidden className="w-12" />
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="display-name">
            Display name
          </label>
          <input
            id="display-name"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="What should we call you?"
            required
          />
          <p className="mt-2 text-xs text-ink-500">
            Shown next to your ratings, comments, and any meals you add.
          </p>
        </div>

        <div className="border-t border-cream-200 pt-3 text-sm text-ink-500 space-y-1">
          <div>
            <span className="font-semibold text-ink-700">Email:</span> {appUser.email}
          </div>
          <div>
            <span className="font-semibold text-ink-700">Role:</span>{' '}
            {appUser.role === 'amy' ? 'Admin' : 'Member'}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!dirty && savedAt && (
        <p className="text-sm text-sage-600 font-semibold">Saved.</p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={!dirty || saving || !displayName.trim()}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
