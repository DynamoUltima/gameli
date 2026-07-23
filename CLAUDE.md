# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

There are no automated tests. Manual browser testing is required for UI changes.

## Architecture

This is a **Hospital Management System (HMS)** for St. Gamaliel's Hospital — a React 18 + Vite SPA with role-based access for patients, doctors, and admins. It was originally scaffolded with Supabase but has been **migrated to Firebase** on the `migration-firebase` branch.

### Firebase Migration Shim

The most important architectural detail: `src/integrations/supabase/client.ts` re-exports from `src/integrations/firebase/supabase-shim.ts`. All legacy Supabase-style calls (`supabase.from('table').select()...`) transparently route through a custom `QueryBuilder` class that translates them to Firestore SDK calls.

- **Real Firebase client**: `src/integrations/firebase/client.ts` — exports `auth`, `db`, `storage`
- **Shim**: `src/integrations/firebase/supabase-shim.ts` — emulates the Supabase JS client API on top of Firestore
- New code should prefer direct Firestore SDK calls over the shim where possible

### Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles + role (`patient` / `doctor` / `admin`) — also serves as the shim's `profiles` and `user_roles` virtual tables |
| `appointments` | Appointment records |
| `doctors` | Doctor profiles |
| `doctor_schedules` | Availability slots |

### Auth & Roles

- `useAuth` hook (`src/hooks/useAuth.tsx`) — wraps Firebase `onAuthStateChanged`, exposes `user`, `session`, `loading`, `signOut`
- `useUserRole` hook (`src/hooks/useUserRole.tsx`) — fetches `role` field from the `users` Firestore document
- `ProtectedRoute` component gates pages by role; roles are `patient`, `doctor`, `admin`

### Routing

React Router v6 in `src/App.tsx`. Main routes:

- `/` — Landing page (`Index`)
- `/auth` — Login/signup (`Auth`)
- `/book/:type` — Appointment booking
- `/payment` / `/payment-success` — Paystack payment flow
- `/dashboard/patient` — Patient dashboard (role-gated)
- `/dashboard/doctor` — Doctor dashboard (role-gated)
- `/dashboard/admin` — Admin dashboard (role-gated)
- `/admin/doctor-schedules` — Doctor schedule management (admin-gated)

### UI Stack

- **shadcn/ui** components in `src/components/ui/` — do not edit these directly; use the `components.json` config and shadcn CLI to add new components
- **Tailwind CSS** with `tailwind.config.ts`
- `@` alias maps to `src/`
- Toast notifications use both `sonner` and the shadcn `useToast` hook

### Firebase Cloud Functions

`functions/index.js` — Firebase Functions v2 (Node.js, `europe-west1` region):
- `sendSms` — sends SMS via Nalo Solutions API; uses `NALO_AUTH_KEY` env var
- `sendEmail` — sends transactional email via SendGrid; uses `SENDGRID_API_KEY` secret

### Payment

Paystack integration via `react-paystack`. Payment flow: `BookAppointment` → `Payment` → Paystack modal → `PaymentSuccess`. Live keys are configured via `VITE_PAYSTACK_PUBLIC_KEY`.

### Environment Variables

All client env vars are prefixed `VITE_` (Vite convention). Key vars:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GOOGLE_CLIENT_ID
VITE_PAYSTACK_PUBLIC_KEY
```

### Deployment

- `vercel.json` is present — the app deploys to Vercel as a static SPA
- Firebase Hosting config exists in `firebase.json` as an alternative
- `dist/` contains the last built output
