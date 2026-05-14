# Amy's Kitchen — Claude notes

Small catering app for Amy to log meals served to Energized Engines employees and
collect ratings, comments, "looking forward" reactions, and meal requests.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- React Router **HashRouter** (so it works under any GitHub Pages subpath — keep it this way)
- Firebase v11: Auth (email magic link), Firestore, Storage
- `qrcode` for the rollout poster
- Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`)

## Layout

```
src/
  firebase.ts              # initializes app/auth/db/storage from VITE_FIREBASE_*
  types.ts                 # AppUser, MealLibraryEntry, Serving, Rating, Request, DietaryTag
  App.tsx                  # HashRouter + Gate (auth → pending → app)
  auth/                    # SignIn, FinishSignIn, Pending, AuthProvider
  routes/
    Calendar.tsx           # home — month calendar
    DayDetail.tsx          # per-day meal + ratings
    Requests.tsx           # employee-facing request list
    Admin.tsx + admin/*    # MealLibrary, EditMeal, ScheduleMeal, Employees,
                           # RequestsAdmin, Reports, Poster, AdminHome
  components/              # StarRating, RatingForm, RatingsList,
                           # LookingForwardButton, MonthCalendar, PhotoUpload,
                           # InstallBanner, Layout, Loading, DietaryTagChips,
                           # RequestCard
  lib/                     # db.ts, dates.ts, requests.ts
```

Security rules live at the repo root (`firestore.rules`, `storage.rules`) and are
the source of truth — deployed via the Firebase CLI, not via the Pages workflow.

## Data model

- `users/{uid}` — `email`, `displayName`, `role: 'amy' | 'employee'`, `status: 'pending' | 'approved' | 'deactivated'`
- `mealLibrary/{libId}` — `name`, `description`, `photoUrl?`, `dietaryTags[]`, `createdAt`
- `servings/{servingId}` — `libraryId`, `servedDate` (YYYY-MM-DD), `notes?`, `createdAt`
- `servings/{servingId}/ratings/{uid}` — `stars` (1–5), `comment?`, `hiddenByAmy?`, `updatedAt`
- `servings/{servingId}/lookingForward/{uid}` — reaction on planned meals
- `requests/{id}` — `requestedBy`, `mealName`, `notes?`, `status`, `scheduledServingId?`
- `requests/{id}/upvotes/{uid}` — one doc per upvoter

## Auth flow

- First sign-up self-creates `users/{uid}` with `role: 'employee'`, `status: 'pending'`. Rules block clients from setting any other role/status.
- Amy is bootstrapped **once** by manually editing her user doc in the Firestore console (role → `amy`, status → `approved`). After that she approves everyone else from inside the app.
- `App.tsx`'s `Gate` blocks the app on loading → no Firebase user → no app user → not-approved status before rendering routes.

## Commands

```bash
npm run dev         # vite dev server
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b --noEmit
npm run preview     # serve the built dist/
```

## Env

`.env.local` (gitignored) holds the 6 `VITE_FIREBASE_*` keys from the Firebase
console. The same values must be added as GitHub repo secrets for the deploy
workflow.

## Current status

All 6 build phases are coded (foundation → meal library → ratings → requests →
reports → PWA/poster polish). **No Google/Firebase/Pages setup has been done
yet** — the active task list tracks the remaining bootstrap steps.
