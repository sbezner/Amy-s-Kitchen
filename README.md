# Amy's Kitchen

A small internal app for Amy to plan meals for the Energized Engines team and
for the team to rate them, upvote favourites, and add new ones to the library.

Built as a static React + Vite app hosted on **GitHub Pages**, with
**Firebase** (Auth + Firestore + Storage) as the backend.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (warm food palette)
- React Router (HashRouter — works under any GitHub Pages subpath)
- Firebase Auth: Google sign-in **and** email magic link
- Firestore + Cloud Storage
- GitHub Actions → GitHub Pages deploy

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the Firebase web config values in .env.local
npm run dev
```

Open the printed URL (usually <http://localhost:5173>).

## How it's organised

The app is **meal-centric** — every meal in the library has its own page that
holds the description, photos (up to 6), dietary tags, ratings & comments,
"make this again" upvotes, and the full list of dates it's been served.
Tapping any day on the calendar jumps straight to that meal's page.

- **Calendar** — month grid; tap a day with a meal to see that meal, tap an empty day to schedule one.
- **Meals** — full library as a single list. Each meal shows its serving count, rating, and upvote total. Anyone can add a meal; deletion is restricted (see permissions below).
- **Reports** — most-liked, least-liked, and most-frequent meals over the last 30 days and all time. CSV export.
- **Admin** (admin role only) — approve sign-ups, manage the roster, print the QR rollout poster.
- **Profile** — change your own display name. (Tap "Hi *name*" in the header.)

A meal is just a meal. Some have been served, some haven't. Anyone can add
one; the team can rate, upvote, and look forward to specific dates.

### Permissions summary

| Action | Approved member | Admin |
|---|:---:|:---:|
| Add/edit a meal | ✓ | ✓ |
| Schedule a meal on a date | ✓ | ✓ |
| Rate / comment on a meal | ✓ | ✓ |
| Upvote ("make this again") | ✓ | ✓ |
| Looking-forward reaction (per date) | ✓ | ✓ |
| Edit your own display name | ✓ | ✓ |
| Delete a meal you created that has never been scheduled | ✓ | ✓ |
| Approve new sign-ups | | ✓ |
| Delete a meal that's been scheduled | | ✓ |
| Remove a meal from a date | | ✓ |
| Hide/unhide a rating | | ✓ |

## One-time setup

### 1. Create the Firebase project

1. Go to <https://console.firebase.google.com/> and create a new project (e.g. **amys-kitchen**).
2. In **Authentication → Sign-in method**, enable:
   - **Google** (set the support email).
   - **Email link (passwordless sign-in)** via the Email/Password provider.
3. In **Authentication → Settings → Authorized domains**, add:
   - `localhost` (already there).
   - `<your-github-username>.github.io` (the host your Pages site will live on).
4. In **Firestore Database**, create a database in **production mode**, Standard edition.
5. In **Storage**, set up the default bucket. (Requires the Blaze plan; usage stays well within the free tier for an internal team app, but a budget alert is a good idea.)
6. In **Project settings → General → Your apps**, register a web app and copy the config values into `.env.local`.

### 2. Deploy Firestore + Storage security rules

The `firestore.rules` and `storage.rules` files at the repo root are the source
of truth. Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick your project
firebase deploy --only firestore:rules,storage
```

A minimal `firebase.json` (gitignored on purpose so you can use your own
project alias):

```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage":   { "rules": "storage.rules" }
}
```

### 3. Bootstrap admin accounts

There's a defensive `ADMIN_EMAILS` list in `src/lib/allowedDomains.ts` mirrored
in `firestore.rules`. Any user whose email is in that list will auto-bootstrap
as `role: 'amy', status: 'approved'` on first sign-in. Edit the list to match
your real admins, then commit and deploy rules.

### 4. GitHub Pages

1. Push this repo to GitHub.
2. In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add the same Firebase values from `.env.local` as repo secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys to Pages.

### 5. Email-link deliverability (optional polish)

Firebase's default auth emails sometimes land in spam on the first send. To
soften that:

- Customise the template (Firebase console → Authentication → Templates → Email address sign-in). Set sender name to your project, write a friendlier body, and use an HTML anchor tag for `%LINK%` so it tappable on iOS Mail/Gmail.
- Tell users to mark the first email "Not spam" — Gmail learns and routes future ones to the inbox.

## Data model

See `src/types.ts` for the full TypeScript types. Storage layout:

- `users/{uid}` — `email`, `displayName`, `role`, `status`, `createdAt`
- `mealLibrary/{mealId}` — `name`, `description`, `photos[]`, `dietaryTags[]`, `createdAt`, `createdBy?`
- `mealLibrary/{mealId}/ratings/{uid}` — `stars`, `comment?`, `hiddenByAmy?`, `updatedAt`
- `mealLibrary/{mealId}/upvotes/{uid}` — "make this again"
- `servings/{YYYY-MM-DD}` — `libraryId`, `servedDate`, `notes?`, `createdAt`
- `servings/{YYYY-MM-DD}/lookingForward/{uid}` — per-date anticipation

Servings use the date as their document id so concurrent schedules on the
same day collapse to one row instead of creating duplicates.

## Scripts

```bash
npm run dev         # local dev server
npm run build       # production build (typecheck + bundle)
npm run typecheck   # types only
npm run preview     # serve the built dist/
```
