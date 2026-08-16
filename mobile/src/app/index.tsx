import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../lib/auth-context";
import { auth } from "../lib/firebase";

export default function Index() {
  const { user, role, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user ? <SignedIn email={user.email} role={role} /> : <LoginForm />}
    </View>
  );
}

function SignedIn({ email, role }: { email: string | null; role: string | null }) {
  return (
    <View style={styles.form}>
      <Text style={styles.title}>Hello World</Text>
      <Text>Signed in as {email}</Text>
      <Text>Role: {role}</Text>
      <Button title="Sign out" onPress={() => signOut(auth)} />
    </View>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
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
    <View style={styles.form}>
      <Text style={styles.title}>Log in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {submitting ? (
        <ActivityIndicator />
      ) : (
        <Button title="Log in" onPress={handleSubmit} disabled={!email || !password} />
      )}
    </View>
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
  return "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: "#c0392b",
  },
});
