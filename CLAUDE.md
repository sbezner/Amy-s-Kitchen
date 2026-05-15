# Amy's Kitchen — Claude notes

Internal meal app for Amy (and other admins) to log meals served to the
Energized Engines team and gather ratings, comments, "make this again"
upvotes, and "looking forward" reactions.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- React Router **HashRouter** (so it works under any GitHub Pages subpath — keep it this way)
- Firebase v11: Auth (Google + email magic link), Firestore, Storage
- `qrcode` for the rollout poster
- Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`)

## File layout

```
src/
  firebase.ts              # initializes app/auth/db/storage from VITE_FIREBASE_*
  types.ts                 # AppUser, MealLibraryEntry, Serving, Rating, DietaryTag
  App.tsx                  # HashRouter + Gate (auth → pending → app)
  auth/                    # SignIn, FinishSignIn, Pending, AuthProvider
  lib/
    allowedDomains.ts      # ALLOWED_DOMAINS + ADMIN_EMAILS lists
    users.ts               # UsersProvider + useDisplayName (live name lookup)
    db.ts                  # useMealLibrary, useLibraryEntry, useServingsInRange,
                           # useServingByDate, useServingsByMealId, useUpvotes
    dates.ts               # date key helpers + isValidDateKey
  routes/
    Calendar.tsx           # home — month calendar (reads ?d= hint)
    DayDetail.tsx          # per-day summary + LookingForward + schedule CTA
    Meals.tsx              # single list of every meal in the library
    MealDetail.tsx         # the central "everything about this meal" page
    EditMeal.tsx           # add/edit meal (photos, tags, description)
    ScheduleMeal.tsx       # pick a meal for a date
    Profile.tsx            # edit your own display name
    About.tsx              # what is this thing
    Admin.tsx + admin/     # role-gated routes: AdminHome, Employees, Poster, Reports
  components/
    StarRating, RatingForm, RatingsList,    # rating UI (per-meal now)
    LookingForwardButton,                   # per-serving anticipation
    MonthCalendar,                          # calendar grid, navigates to /meals/:id
    MultiPhotoUpload, PhotoGallery,         # multi-photo edit + display
    InstallBanner,                          # PWA install prompt
    Layout, Loading, DietaryTagChips        # shared chrome
```

Security rules live at the repo root (`firestore.rules`, `storage.rules`) and
are the source of truth — deployed via the Firebase CLI, not via the Pages
workflow.

## Data model (meal-centric)

The **Meal** is the central object. Ratings, comments, upvotes, and the list
of dates served all hang off a meal.

- `users/{uid}` — `email`, `displayName`, `role: 'amy' | 'employee'`, `status: 'pending' | 'approved' | 'deactivated'`, `createdAt`
- `mealLibrary/{mealId}` — `name`, `description`, `photos: string[]` (up to 6), `dietaryTags[]`, `createdAt`, `createdBy?`. Legacy single `photoUrl` is still read for display (backfilled into `photos[0]`) but no longer written.
- `mealLibrary/{mealId}/ratings/{uid}` — one rating per (meal, user). `stars` (1–5), `comment?`, `hiddenByAmy?`, `updatedAt`
- `mealLibrary/{mealId}/upvotes/{uid}` — "make this again" signal, one per user per meal
- `servings/{date}` — date → mealId mapping. **Doc id is the date** (`YYYY-MM-DD`) so concurrent schedules on the same day are race-free. Fields: `libraryId`, `servedDate`, `notes?`, `createdAt`
- `servings/{date}/lookingForward/{uid}` — per-date anticipation reactions

There is **no** `requests` collection anymore. A meal is a meal — either it's
been served (has servings) or it hasn't. The Meals page shows everything as a
single list; users see a meal's serving count, rating, and upvote total inline
on each card.

## Auth & authorization

Two sign-in methods, both gated by an email-domain allowlist
(`src/lib/allowedDomains.ts`):

- **Google sign-in** (`signInWithPopup` with redirect fallback for iOS PWAs / popup-blocked environments)
- **Email magic link** (`sendSignInLinkToEmail`)

Sign-in flow:

1. User authenticates → `AuthProvider` checks email domain → if not allowed, sign them out and show a "you're not on the list" screen.
2. If allowed, look up `users/{uid}`. If absent, auto-create:
   - If their email is in `ADMIN_EMAILS` (defensive bootstrap), create as `role: 'amy', status: 'approved'`.
   - Otherwise create as `role: 'employee', status: 'pending'`.
3. `App.tsx`'s `Gate` blocks routes until `status === 'approved'`.

The `ADMIN_EMAILS` defensive bootstrap exists because Firebase doesn't always
auto-link a new Google sign-in to an existing email-link UID. If linking fails
and a hardcoded admin email gets a fresh UID, this clause makes sure they
re-bootstrap as admin instead of getting stuck in the pending queue. **Keep
the list in `src/lib/allowedDomains.ts` in sync with the matching
`firestore.rules` clause** (the rule hard-codes the same two emails).

### Who can do what

| Action | Approved member | Admin (`role: 'amy'`) |
|---|:---:|:---:|
| Approve new sign-ups | | ✓ |
| Add/edit a meal | ✓ | ✓ |
| Schedule a meal on a date | ✓ | ✓ |
| Rate / comment on a meal | ✓ | ✓ |
| Upvote ("make this again") | ✓ | ✓ |
| Looking-forward reaction | ✓ | ✓ |
| Edit own profile / display name | ✓ | ✓ |
| Delete a meal | only if you created it AND it has zero servings | ✓ |
| Remove a meal from a specific date | | ✓ |
| Hide/unhide a rating | | ✓ |
| View Reports | ✓ | ✓ |

When a meal is deleted, the handler cascades: deletes the meal's ratings + upvotes, and also deletes any `servings/*` that reference it (and their `lookingForward` sub-collections) so the calendar doesn't end up with orphan "Unknown meal" rows.

## Commands

```bash
npm run dev         # vite dev server
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b --noEmit
npm run preview     # serve the built dist/

firebase deploy --only firestore:rules  # push security rules
firebase deploy --only storage          # push storage rules
```

## Env

`.env.local` (gitignored) holds the 6 `VITE_FIREBASE_*` keys from the Firebase
console. The same values must be added as GitHub repo secrets for the deploy
workflow.

`firebase.json` is also gitignored on purpose so each developer can use their
own project alias.

## Storage rules note

Cross-service security rules (Storage reading from Firestore) were unreliable
on the `.firebasestorage.app` bucket, so `storage.rules` requires only that
the writer be signed in — role-based gating is enforced client-side. Real
upload exposure is small because pending employees can't reach the upload UI
in the first place, and Firestore writes still go through the strict rules.

## What's been built

The app has gone through several reshapes since the initial 6-phase plan; the
current state is the meal-centric unified model:

- Auth: Google + email-link with domain allowlist and admin defensive bootstrap.
- Meal-centric model: one rating per (user, meal), multi-photo gallery, dates served list, upvote.
- Anyone-can-edit meal management — only admins can delete meals that have been scheduled.
- Calendar jumps straight to a meal page on tap. Empty days route to /day/:date for a Schedule CTA.
- Reports: most/least liked + most frequent, last-30-days + all-time, CSV export.
- PWA install banner, QR poster, print styles.
- Mobile-responsive header with top-nav.
- Profile page for changing your own display name.

All routes are live at `https://sbezner.github.io/Amy-s-Kitchen/`.
