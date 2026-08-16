# backend

The tabletalk API server. Go, `net/http` only (no framework), backed by
Firebase Auth for identity and roles.

## What it does

- Verifies Firebase ID tokens sent by the mobile app and admin console
  (`Authorization: Bearer <idToken>`).
- Reads the caller's `role` custom claim straight off the verified token -
  no separate users/roles table to keep in sync.
- Lets an admin list every user (`GET /api/admin/users`) and promote/demote
  one (`POST /api/admin/set-role`) - what the `frontend/` admin console
  runs on.

## Setup

1. Copy `.env.example` to `.env` and fill in Firebase Admin SDK credentials
   (Firebase console → Project settings → Service accounts → Generate new
   private key). Either paste the JSON into `FIREBASE_SERVICE_ACCOUNT_JSON`
   or point `GOOGLE_APPLICATION_CREDENTIALS` at the downloaded file - pick
   one, not both. **Never commit this file or the key JSON** - both are
   gitignored already.

2. Run it:

   ```bash
   go run .
   ```

   Listens on `:8080` by default (override with `PORT`). Requests from the
   browser-based admin console need `ALLOWED_ORIGIN` set to that console's
   origin - defaults to Vite's dev server origin, `http://localhost:5173`.

## Bootstrapping the first admin

Nobody starts out as an admin, and `/api/admin/set-role` requires an admin
caller - so the very first one has to be set directly with the Admin SDK,
bypassing the HTTP layer:

```bash
go run ./cmd/setrole <uid> admin
```

Find `<uid>` in the Firebase console under Authentication → Users, after
that user has signed up once through the mobile app. After this, that user
can promote/demote others through the API instead of the CLI.

## Endpoints

| Method | Path                    | Auth              | Description                                   |
|--------|-------------------------|-------------------|------------------------------------------------|
| GET    | `/healthz`               | none              | Liveness check                                 |
| GET    | `/api/me`                 | any signed-in user | Returns `{ uid, email, role }` for the caller |
| GET    | `/api/admin/users`        | admin only        | Returns every user: `{ uid, email, role, disabled, createdAt }[]` |
| POST   | `/api/admin/set-role`     | admin only        | Body: `{ "uid": "...", "role": "admin"\|"user" }` |

Example, once you have an ID token from the mobile app:

```bash
curl http://localhost:8080/api/me \
  -H "Authorization: Bearer <idToken>"

curl http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer <adminIdToken>"

curl -X POST http://localhost:8080/api/admin/set-role \
  -H "Authorization: Bearer <adminIdToken>" \
  -H "Content-Type: application/json" \
  -d '{"uid": "someOtherUsersUid", "role": "admin"}'
```

## Layout

```
main.go                      # route wiring + HTTP server
cmd/setrole/                 # CLI for bootstrapping the first admin
internal/firebaseapp/        # Firebase Admin SDK initialization
internal/authmw/             # token verification + role-check middleware
internal/handlers/           # HTTP handlers
```
