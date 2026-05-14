import { useState, type FormEvent } from 'react'
import {
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from '../firebase'
import { useAuth } from './AuthProvider'
import { ALLOWED_DOMAINS_LABEL, isAllowedEmail } from '../lib/allowedDomains'

const PENDING_EMAIL_KEY = 'amys-kitchen:pendingEmail'

export function SignIn() {
  const { rejected, clearRejected } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (rejected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">Amy's Kitchen</h1>
            <p className="text-ink-700">Daily meals for Energized Engines.</p>
          </div>
          <div className="card text-center">
            <h2 className="text-2xl mb-3">Sorry, you're not on the list</h2>
            <p className="text-ink-700 mb-4">
              <strong className="break-all">{rejected.email}</strong> isn't allowed to sign in.
              Only {ALLOWED_DOMAINS_LABEL} addresses can join.
            </p>
            <button type="button" className="btn-primary w-full" onClick={clearRejected}>
              Try a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function signInWithGoogle() {
    setError(null)
    setSubmitting(true)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      await signInWithPopup(auth, provider)
      // AuthProvider takes it from here (domain check, doc create, gate)
    } catch (err) {
      // Popups don't work in iOS PWAs, some in-app browsers, and a few
      // privacy modes. Fall back to redirect for the known cases.
      const code = err instanceof FirebaseError ? err.code : ''
      const popupFailed =
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/web-storage-unsupported'
      if (popupFailed) {
        try {
          await signInWithRedirect(auth, provider)
          // Page navigates away; nothing more to do here.
          return
        } catch (redirectErr) {
          setError(
            redirectErr instanceof Error
              ? redirectErr.message
              : 'Could not sign in with Google',
          )
        }
      } else {
        setError(err instanceof Error ? err.message : 'Could not sign in with Google')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!isAllowedEmail(trimmed)) {
      setError(`Only ${ALLOWED_DOMAINS_LABEL} addresses can sign in.`)
      return
    }
    setSubmitting(true)
    try {
      const url = `${window.location.origin}${window.location.pathname}#/finish-signin`
      await sendSignInLinkToEmail(auth, trimmed, {
        url,
        handleCodeInApp: true,
      })
      window.localStorage.setItem(PENDING_EMAIL_KEY, trimmed)
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
          <div className="card">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-cream-300 bg-white rounded-2xl py-3 font-semibold hover:bg-cream-50 transition disabled:opacity-50"
              onClick={signInWithGoogle}
              disabled={submitting}
            >
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-cream-200" />
              <span className="text-xs text-ink-500 uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-cream-200" />
            </div>

            <form onSubmit={submit}>
              <label className="label" htmlFor="email">
                Your email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                className="input"
                placeholder="you@energizedengines.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-2 text-sm text-ink-500">
                We'll email you a one-tap sign-in link. {ALLOWED_DOMAINS_LABEL} addresses only.
              </p>

              {error && (
                <div className="mt-4 rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full mt-5"
                disabled={submitting || !email}
              >
                {submitting ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8c1.8-4.4 6.1-7.5 11.1-7.5 3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16 4 9.1 8.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.6 2.4-7.2 2.4-5.2 0-9.7-3.4-11.3-8L6.2 32.6C9 38.7 15.9 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  )
}
