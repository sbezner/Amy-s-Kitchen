import { useEffect, useState, type FormEvent } from 'react'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'

const PENDING_EMAIL_KEY = 'amys-kitchen:pendingEmail'

export function FinishSignIn() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [needEmail, setNeedEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      navigate('/', { replace: true })
      return
    }
    const stored = window.localStorage.getItem(PENDING_EMAIL_KEY)
    if (stored) {
      void finish(stored)
    } else {
      setNeedEmail(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function finish(emailToUse: string) {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithEmailLink(auth, emailToUse, window.location.href)
      window.localStorage.removeItem(PENDING_EMAIL_KEY)
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in link is invalid or expired.'
      setError(message)
      setSubmitting(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void finish(email.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {!needEmail && !error && <p className="text-ink-700">Signing you in…</p>}

        {needEmail && (
          <form className="card text-left" onSubmit={onSubmit}>
            <h2 className="text-2xl mb-2">Confirm your email</h2>
            <p className="text-ink-700 mb-4 text-sm">
              For your security, type the email you used to request this link.
            </p>
            <label className="label" htmlFor="confirm-email">
              Email
            </label>
            <input
              id="confirm-email"
              className="input"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full mt-4" disabled={submitting || !email}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {error && (
          <div className="card">
            <h2 className="text-xl mb-2">Couldn't sign you in</h2>
            <p className="text-ink-700 text-sm mb-4">{error}</p>
            <button className="btn-secondary w-full" onClick={() => navigate('/', { replace: true })}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
