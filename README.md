# Amy's Kitchen

A small catering app for Amy to record meals, collect ratings and comments from
Energized Engines employees, manage meal requests, and review what's working.

Built as a static React + Vite app hosted on **GitHub Pages**, with **Firebase**
(Auth + Firestore + Storage) as the backend.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (warm food palette)
- React Router (HashRouter — works under any GitHub Pages subpath)
- Firebase: Auth (magic-link email), Firestore, Cloud Storage
- GitHub Actions → GitHub Pages deploy

## Local development

```bash
npm install
cp .env.example .env.local
# fill in the Firebase web config values in .env.local
npm run dev
```

Open the printed URL (usually <http://localhost:5173>).

## One-time setup

### 1. Create the Firebase project

1. Go to <https://console.firebase.google.com/> and create a new project (e.g.
   **amys-kitchen**).
2. In **Authentication → Sign-in method**, enable **Email Link (passwordless
   sign-in)**.
3. In **Authentication → Settings → Authorized domains**, add:
   - `localhost` (already there)
   - `<your-github-username>.github.io` (the domain your Pages site will be on)
4. In **Firestore Database**, create a database in **production mode**.
5. In **Storage**, set up the default bucket.
6. In **Project settings → General → Your apps**, register a web app and copy
   the config values into `.env.local`.

### 2. Deploy Firestore security rules

The `firestore.rules` file in this repo is the source of truth. Deploy it with
the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # pick your project
firebase deploy --only firestore:rules,storage
```

Both `firestore.rules` and `storage.rules` live at the repo root. A minimal
`firebase.json` you can add locally (it's gitignored on purpose so you can use
your own project alias):

```json
{
  "firestore": { "rules": "firestore.rules" },
  "storage":   { "rules": "storage.rules" }
}
```

### 3. Bootstrap Amy's account

The first sign-up sits in `pending` status with role `employee`. Promote Amy
manually one time:

1. Have Amy sign in once via the live app (she'll land on the "You're on the
   list" screen).
2. In the Firebase console, go to **Firestore → users → {her uid}** and edit:
   - `role`: `amy`
   - `status`: `approved`

From that point on, Amy approves every new sign-up from inside the app.

### 4. GitHub Pages

1. Push this repo to GitHub.
2. In the repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add the same Firebase
   values from `.env.local` as repo secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and
   deploys to Pages.

## Build phases

- **Phase 1 (current):** Foundation — auth, pending/approved flow, security
  rules, Pages deploy, placeholder routes.
- **Phase 2:** Meal library + servings + calendar view, Amy's add/edit/delete
  with optional photo upload.
- **Phase 3:** Ratings, comments, "looking forward" reactions, Amy's comment
  moderation.
- **Phase 4:** Meal requests + upvotes, Amy's request management.
- **Phase 5:** Reports — all-time + last 30 days, CSV export.
- **Phase 6:** Polish — PWA install prompt, empty/loading/error states, QR
  poster for first rollout.

## Data model

- `users/{uid}` — `email`, `displayName`, `role: 'amy' | 'employee'`,
  `status: 'pending' | 'approved' | 'deactivated'`
- `mealLibrary/{libId}` — `name`, `description`, `photoUrl?`,
  `dietaryTags[]`, `createdAt`
- `servings/{servingId}` — `libraryId`, `servedDate`, `notes?`, `createdAt`
- `servings/{servingId}/ratings/{uid}` — `stars (1–5)`, `comment?`,
  `hiddenByAmy?`, `updatedAt`
- `servings/{servingId}/lookingForward/{uid}` — reaction on planned meals
- `requests/{id}` — `requestedBy`, `mealName`, `notes?`, `status`,
  `scheduledServingId?`
- `requests/{id}/upvotes/{uid}` — one doc per upvoter
