import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  type FormEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";

import { listUsers, setRole, type UserSummary } from "./lib/api";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { auth } from "./lib/firebase";

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

/** Routes between the login form, an "access denied" state, and the console, based on auth state. */
function Gate() {
  const { user, role, initializing } = useAuth();

  if (initializing) {
    return <Centered>Loading…</Centered>;
  }

  if (!user) {
    return (
      <Centered>
        <LoginForm />
      </Centered>
    );
  }

  if (role !== "admin") {
    return (
      <Centered>
        <p>
          Signed in as {user.email}, but this account isn't an admin.
        </p>
        <button type="button" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </Centered>
    );
  }

  return <AdminConsole email={user.email} />;
}

function Centered({ children }: PropsWithChildren) {
  return <div className="centered">{children}</div>;
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h1>tabletalk admin</h1>
      <input
        type="email"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={submitting || !email || !password}>
        {submitting ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}

function AdminConsole({ email }: { email: string | null }) {
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(toErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRoleChange(uid: string, nextRole: "admin" | "user") {
    setUpdatingUid(uid);
    setError(null);
    try {
      await setRole(uid, nextRole);
      await refresh();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setUpdatingUid(null);
    }
  }

  return (
    <div className="admin-console">
      <header>
        <h1>Users</h1>
        <div className="whoami">
          <span>{email}</span>
          <button type="button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {users === null ? (
        <p>Loading users…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.disabled ? "Disabled" : "Active"}</td>
                <td>
                  <button
                    type="button"
                    disabled={updatingUid === u.uid}
                    onClick={() => handleRoleChange(u.uid, u.role === "admin" ? "user" : "admin")}
                  >
                    {updatingUid === u.uid
                      ? "Updating…"
                      : u.role === "admin"
                        ? "Demote to user"
                        : "Promote to admin"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function toErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "That email address looks invalid.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      default:
        return err.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
