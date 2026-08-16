# frontend

A simple admin console for managing tabletalk users - view every Firebase
user and their role, and promote/demote between `admin` and `user`.

Vite + React + TypeScript. No UI library, no router, no state management
library - one page is all this needs right now.

## Setup

1. Copy `.env.example` to `.env` and fill in your Firebase web app config
   (Firebase console → Project settings → General → Your apps → Web app),
   plus the backend's URL if it's not running on the default
   `http://localhost:8080`.

2. Make sure `backend/` is running (see `../backend/README.md`) with its
   `ALLOWED_ORIGIN` set to wherever this dev server runs (defaults to Vite's
   own default, `http://localhost:5173`, on both sides).

3. Run it:

   ```bash
   npm install
   npm run dev
   ```

Sign in with an account that already has the `admin` role (see
`../backend/README.md` for how to bootstrap the first one) - anyone signed
in without that role sees an "access denied" screen instead of the console.

## Layout

```
src/App.tsx           # login form -> access-denied -> user table, in one file
src/lib/firebase.ts    # Firebase app/Auth client init
src/lib/auth-context.tsx  # useAuth() - current user + role
src/lib/api.ts          # calls the Go backend's /api/admin/* endpoints
```
