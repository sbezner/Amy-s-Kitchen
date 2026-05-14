export function About() {
  return (
    <div className="py-4 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-3xl mb-2">About Amy's Kitchen</h2>
        <p className="text-ink-700">
          A little app to help Amy plan meals for the Energized Engines team, and to give the
          team a place to say what they liked, what they're looking forward to, and what they'd
          love to see on the menu next.
        </p>
      </div>

      <section className="card space-y-3">
        <h3 className="text-xl">For employees</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Calendar.</strong> See what's been served and what's coming up. Tap a day to
            open the meal details.
          </li>
          <li>
            <strong>Rate a meal.</strong> After a meal has been served, leave a 1–5 star rating and
            an optional comment. You can edit your own rating any time.
          </li>
          <li>
            <strong>Looking forward.</strong> See a meal on the calendar you're excited about? Tap
            the heart on the day's page so Amy knows.
          </li>
          <li>
            <strong>Requests.</strong> Suggest a meal you'd love to see. Upvote other people's
            requests to push your favorites up the list.
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">For Amy</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Meal library.</strong> Save meals once with a name, description, photo, and
            dietary tags — then schedule them onto the calendar whenever you make them.
          </li>
          <li>
            <strong>Schedule a meal.</strong> Tap any date on the calendar and pick from the
            library. Same meal can be scheduled as many times as you make it.
          </li>
          <li>
            <strong>Employees.</strong> Approve new sign-ups, deactivate people who leave, see who
            has access.
          </li>
          <li>
            <strong>Requests.</strong> See what the team is asking for, sorted by upvotes. Mark
            requests as scheduled, made, or declined — or just leave them open.
          </li>
          <li>
            <strong>Reports.</strong> See top-rated meals, average ratings, and meal frequency over
            the last 30 days or all time. Export to CSV anytime.
          </li>
          <li>
            <strong>Moderation.</strong> Any comment can be hidden if it's unkind or off-topic.
            Hidden comments only stay visible to you.
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">Tips</h3>
        <ul className="space-y-2 text-ink-700 text-sm">
          <li>
            <strong>Add it to your home screen.</strong> On a phone, "Add to Home Screen" makes the
            app feel native — full-screen, fast, and one tap away.
          </li>
          <li>
            <strong>Two ways to sign in.</strong> Tap "Sign in with Google" for one-tap access, or
            request an email link if you'd rather. Only @energizedengines.com and @gmail.com
            addresses are allowed.
          </li>
          <li>
            <strong>Sign-in emails sometimes land in spam.</strong> The first time you get one,
            mark it as "Not spam" so future ones come straight to your inbox.
          </li>
          <li>
            <strong>One device per session.</strong> Tap the sign-in link on the same device you
            requested it on. If you can't, the app will prompt for your email when you click the
            link.
          </li>
        </ul>
      </section>
    </div>
  )
}
