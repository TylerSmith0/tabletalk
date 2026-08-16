import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// @react-native-async-storage/async-storage isn't imported here directly,
// but must stay a dependency: Metro auto-selects Firebase's React Native
// build of `firebase/auth` (via the package's "react-native" export
// condition), and that build imports AsyncStorage itself to persist
// sessions across app restarts.

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredEnvVars = {
  apiKey: "EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  appId: "EXPO_PUBLIC_FIREBASE_APP_ID",
} as const;

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([configKey]) => !firebaseConfig[configKey as keyof typeof firebaseConfig])
  .map(([, envVar]) => envVar);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing Firebase config: ${missingEnvVars.join(", ")}. Copy .env.example to .env and fill in your project's values.`,
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
