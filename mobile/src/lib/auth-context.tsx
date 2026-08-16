import { onIdTokenChanged, type User } from "firebase/auth";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { auth } from "./firebase";

type AuthState = {
  user: User | null;
  /** The "role" custom claim from the user's ID token, e.g. "admin" or "user". */
  role: string | null;
  /** True until the initial auth state has been resolved. */
  initializing: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  initializing: true,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // onIdTokenChanged fires on sign-in/sign-out *and* whenever the ID
    // token is refreshed - which is when a just-changed role claim
    // actually shows up on the client.
    return onIdTokenChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const { claims } = await nextUser.getIdTokenResult();
        setRole(typeof claims.role === "string" ? claims.role : "user");
      } else {
        setRole(null);
      }
      setInitializing(false);
    });
  }, []);

  const value = useMemo(() => ({ user, role, initializing }), [user, role, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
