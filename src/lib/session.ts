import { headers } from "next/headers";
import { cache } from "react";
import { getAuth } from "@/lib/auth";

export type Role = "admin" | "coach" | "student";

/**
 * Current session (user + session) or null. Memoized per request via React cache
 * so multiple calls in one render don't re-hit the store.
 */
export const getSession = cache(async () => {
  const auth = getAuth();
  return auth.api.getSession({ headers: await headers() });
});

/** The signed-in user or null. `role` is included via additionalFields. */
export async function getCurrentUser() {
  const s = await getSession();
  return s?.user ?? null;
}

/** True if the current user has any of the given roles. */
export async function hasRole(...roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && roles.includes((user as { role?: Role }).role ?? "student");
}

/** Rol-bazlı sorgular için asgari kimlik: kim + hangi rol. */
export type SessionViewer = { id: string; role: Role };

/** Oturumdaki kullanıcıyı {id, role} olarak çözer — sayfalar sorgulara geçirir. */
export async function getViewer(): Promise<SessionViewer | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return { id: user.id, role: (user as { role?: Role }).role ?? "student" };
}
