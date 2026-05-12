import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from './AuthProvider'

export function Pending() {
  const { appUser } = useAuth()
  const deactivated = appUser?.status === 'deactivated'

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md card text-center">
        {deactivated ? (
          <>
            <h2 className="text-2xl mb-3">Your account is inactive</h2>
            <p className="text-ink-700 mb-5">
              Amy has deactivated your account. If this is a mistake, please reach out to her directly.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl mb-3">You're on the list</h2>
            <p className="text-ink-700 mb-5">
              Thanks{appUser?.displayName ? `, ${appUser.displayName}` : ''}! Amy needs to approve
              new sign-ups. You'll be in as soon as she does — feel free to close this and check
              back later.
            </p>
          </>
        )}
        <button className="btn-secondary w-full" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </div>
    </div>
  )
}
