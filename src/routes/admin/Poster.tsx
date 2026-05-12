import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

export function Poster() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [url, setUrl] = useState(() => `${window.location.origin}${window.location.pathname}`)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toCanvas(canvas, url, {
      width: 360,
      margin: 1,
      color: { dark: '#2A2018', light: '#FBF7F0' },
    }).then(() => setDrawn(true)).catch(() => setDrawn(false))
  }, [url])

  function printPage() {
    window.print()
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Rollout poster</h2>
        <button className="btn-primary text-sm px-3 py-2" onClick={printPage} disabled={!drawn}>
          Print
        </button>
      </div>

      <div className="card print:shadow-none print:bg-white print:border-0">
        <div className="text-center py-6 px-4">
          <h1 className="text-4xl mb-2">Amy's Kitchen</h1>
          <p className="text-ink-700 text-lg mb-6">
            Rate the meals Amy makes for Energized Engines — and suggest your favourites.
          </p>

          <div className="inline-block bg-cream-50 p-4 rounded-3xl shadow-soft print:shadow-none">
            <canvas ref={canvasRef} aria-label="Sign-in QR code" />
          </div>

          <p className="text-sm text-ink-500 mt-3">Scan with your phone camera, or visit:</p>
          <p className="text-ink-900 font-semibold break-all">{url}</p>

          <ol className="text-left mt-8 max-w-md mx-auto space-y-3 text-ink-700">
            <li>
              <span className="font-bold">1.</span> Scan the code on your phone.
            </li>
            <li>
              <span className="font-bold">2.</span> Enter your work email — we'll send you a one-tap
              sign-in link.
            </li>
            <li>
              <span className="font-bold">3.</span> Amy approves new sign-ups personally, so you'll
              wait a moment.
            </li>
            <li>
              <span className="font-bold">4.</span> Once you're in, tap any day on the calendar to
              rate that meal.
            </li>
          </ol>
        </div>
      </div>

      <div className="card print:hidden">
        <label className="label" htmlFor="url">
          URL on the poster
        </label>
        <input
          id="url"
          className="input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <p className="text-xs text-ink-500 mt-2">
          Defaults to this page's URL. Override if you've got a custom domain or you want to send
          people to a different path.
        </p>
      </div>
    </div>
  )
}
