/**
 * Hesap sahibi (super-admin) — Arif. Rolü yalnız kendisi değiştirebilir;
 * başka bir yönetici (ör. Ahmet) Arif'in rolünü değiştiremez. Arif ise
 * herkesin rolünü değiştirebilir. Kimlik e-posta ile tanımlanır (prod + yerel).
 */
const OWNER_EMAILS: ReadonlySet<string> = new Set([
  "arif@dereceninruhu.com",
  "arifismailbayrak@gmail.com",
]);

/** Verilen e-posta hesap sahibine (Arif) mi ait? */
export function isOwnerEmail(email?: string | null): boolean {
  return !!email && OWNER_EMAILS.has(email.trim().toLowerCase());
}
