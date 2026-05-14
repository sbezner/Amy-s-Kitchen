export function About() {
  return (
    <div className="py-4 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl mb-2">About Amy's Kitchen</h2>
        <p className="text-ink-700">
          A little app to help Amy plan meals for the Energized Engines team, and to give the
          team one place to say what they liked, what they're looking forward to, and what they'd
          love to see on the menu next.
        </p>
      </div>

      <section className="card space-y-3">
        <h3 className="text-xl">Everything happens on a meal</h3>
        <p className="text-sm text-ink-700">
          Each meal — lasagna, butter chicken, whatever — has its own page. That page is the one
          place for the description, photos, dietary tags, ratings, comments, and the history of
          every date it's been served. Tap any meal on the calendar to jump straight to it.
        </p>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">Everyone can</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Add a meal.</strong> Anyone can create a meal entry with photos, dietary tags,
            and a description. New meals that haven't been served yet show up under "Suggested".
          </li>
          <li>
            <strong>Schedule a meal.</strong> Tap any date on the calendar to pick a meal for that
            day. Same meal can be scheduled as many times as it's made.
          </li>
          <li>
            <strong>Rate a meal.</strong> One rating per person per meal, 1–5 stars plus an optional
            comment. Change your mind any time and the rating updates.
          </li>
          <li>
            <strong>Looking forward.</strong> On any future date with a meal, tap the heart to let
            the team know you're excited.
          </li>
          <li>
            <strong>"Make this again".</strong> On a meal page, hit the upvote to say you'd love
            this on the menu more often.
          </li>
          <li>
            <strong>Reports.</strong> See top-rated meals, least-liked meals, and most-frequent
            meals across the last 30 days or all time. Export to CSV anytime.
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">Admin only</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Approve sign-ups.</strong> New people land in a pending queue. Admin approves
            or deactivates from the Employees admin.
          </li>
          <li>
            <strong>Moderate comments.</strong> Any rating can be hidden — its stars stop counting
            toward the average too.
          </li>
          <li>
            <strong>Delete meals & servings.</strong> The person who suggested a meal can delete it
            while it's still un-scheduled. Once it's been on the calendar, only an admin can.
          </li>
          <li>
            <strong>Decline a suggestion.</strong> When a suggested meal isn't going to happen,
            admin can mark it Declined with a short reason — visible to everyone so the suggester
            knows it was considered. Reversible.
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">Tips</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Two ways to sign in.</strong> Tap "Sign in with Google" for one-tap access, or
            request an email link. Only @energizedengines.com and @gmail.com addresses are
            allowed.
          </li>
          <li>
            <strong>Sign-in emails sometimes land in spam.</strong> The first time you get one,
            mark it as "Not spam" so future ones come straight to your inbox.
          </li>
          <li>
            <strong>Add it to your home screen.</strong> On a phone, "Add to Home Screen" makes it
            feel native — full-screen, fast, one tap away.
          </li>
        </ul>
      </section>
    </div>
  )
}
