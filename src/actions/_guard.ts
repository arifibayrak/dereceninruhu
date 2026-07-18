import { getSession, type Role } from "@/lib/session";

/** Uniform Server Action result — forms read this instead of catching throws. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function actionError(
  error: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Zod issue listesini alan-bazlı hata haritasına çevirir (formlar için). */
export function fieldErrorsOf(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.join(".")] = i.message;
  return out;
}

export type SessionUser = {
  id: string;
  role: Role;
  name: string;
  email: string;
};

function toSessionUser(user: unknown): SessionUser {
  const u = user as { id: string; name: string; email: string; role?: Role };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? "student",
  };
}

/** Throws "Yetkisiz" if not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s?.user) throw new Error("Yetkisiz");
  return toSessionUser(s.user);
}

/** Coach or admin only. */
export async function requireCoach(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "coach" && u.role !== "admin") {
    throw new Error("Bu işlem için koç yetkisi gerekli");
  }
  return u;
}

/** Admin only. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("Bu işlem için yönetici yetkisi gerekli");
  return u;
}

/** Wrap an action body; converts thrown errors into an ActionResult. */
export async function guarded<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return actionError(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu");
  }
}
