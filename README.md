# tabletalk

Monorepo for tabletalk.

## Structure

- `backend/` - Go API server; verifies Firebase ID tokens and manages user roles
- `frontend/` - Web frontend (not yet set up)
- `mobile/` - React Native mobile app, built with [Expo](https://expo.dev)

## Auth

Identity is handled by Firebase Authentication (email/password). Roles
(`admin` / `user`) are stored as custom claims on the Firebase user and
travel inside the ID token the mobile app gets on sign-in - the backend
reads the role straight off the verified token, no separate roles table.
See `backend/README.md` for how to bootstrap the first admin.

## Mobile

The `mobile/` app is an Expo project (Expo SDK 57, Expo Router, React
Native 0.86, React 19, TypeScript) with a Firebase email/password login
screen.

```bash
cd mobile
cp .env.example .env   # fill in your Firebase web app config
npm install
npm run start   # then press i (iOS), a (Android), or w (web)
```

## Backend

The `backend/` app is a Go server (`net/http`, no framework) that verifies
Firebase ID tokens and exposes a role-assignment endpoint for admins.

```bash
cd backend
cp .env.example .env   # fill in your Firebase Admin SDK credentials
go run .
```
