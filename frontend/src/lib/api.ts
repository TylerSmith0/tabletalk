import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type UserSummary = {
  uid: string;
  email: string;
  role: string;
  disabled: boolean;
  createdAt: number;
};

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new Error("Not signed in.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return response;
}

export async function listUsers(): Promise<UserSummary[]> {
  const response = await authedFetch("/api/admin/users");
  return response.json();
}

export async function setRole(uid: string, role: "admin" | "user"): Promise<void> {
  await authedFetch("/api/admin/set-role", {
    method: "POST",
    body: JSON.stringify({ uid, role }),
  });
}
