import { useState, type FormEvent } from 'react'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '../firebase'

const PENDING_EMAIL_KEY = 'amys-kitchen:pendingEmail'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const url = `${window.location.origin}${window.location.pathname}#/finish-signin`
      await sendSignInLinkToEmail(auth, email.trim(), {
        url,
        handleCodeInApp: true,
      })
      window.localStorage.setItem(PENDING_EMAIL_KEY, email.trim())
      setSent(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Amy's Kitchen</h1>
          <p className="text-ink-700">Daily meals for Energized Engines.</p>
        </div>

        {sent ? (
          <div className="card text-center">
            <h2 className="text-2xl mb-3">Check your inbox</h2>
            <p className="text-ink-700 mb-4">
              We sent a sign-in link to <strong>{email}</strong>. Tap it on the same device to come in.
            </p>
            <p className="text-sm text-ink-500 mb-4">
              Don't see it? Check your spam folder.
            </p>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="card" onSubmit={submit}>
            <label className="label" htmlFor="email">
              Your work email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              inputMode="email"
              className="input"
              placeholder="you@energizedengines.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="mt-2 text-sm text-ink-500">
              We'll email you a one-tap sign-in link. No password to remember.
            </p>

            {error && (
              <div className="mt-4 rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-5" disabled={submitting || !email}>
              {submitting ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
