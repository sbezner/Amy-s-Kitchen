import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'amys-kitchen:installDismissedAt'
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function wasRecentlyDismissed(): boolean {
  const ts = Number(window.localStorage.getItem(DISMISSED_KEY) ?? 0)
  return Date.now() - ts < COOLDOWN_MS
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    if (isIos()) {
      setShowIos(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setDeferred(null)
    setShowIos(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const result = await deferred.userChoice
    if (result.outcome === 'accepted') {
      setDeferred(null)
    } else {
      dismiss()
    }
  }

  if (deferred) {
    return (
      <BannerShell onDismiss={dismiss}>
        <div className="flex-1">
          <div className="font-semibold">Add Amy's Kitchen to your home screen</div>
          <div className="text-xs text-ink-500">
            Quick access, works like an app, no app-store download.
          </div>
        </div>
        <button className="btn-primary text-sm px-3 py-2 shrink-0" onClick={install}>
          Add
        </button>
      </BannerShell>
    )
  }

  if (showIos) {
    return (
      <BannerShell onDismiss={dismiss}>
        <div className="flex-1">
          <div className="font-semibold">Add to home screen</div>
          <div className="text-xs text-ink-500">
            Tap <span aria-label="Share">⬆️</span> then "Add to Home Screen" for one-tap access.
          </div>
        </div>
      </BannerShell>
    )
  }

  return null
}

function BannerShell({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <div className="mx-5 mt-3 rounded-2xl bg-white shadow-soft border border-cream-200 p-3 flex items-center gap-3">
      {children}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="shrink-0 text-ink-500 hover:text-ink-700 px-2"
      >
        ✕
      </button>
    </div>
  )
}
