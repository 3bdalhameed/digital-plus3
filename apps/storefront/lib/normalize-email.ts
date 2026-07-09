/**
 * Canonical email normalization used site-wide.
 *
 * Every path that reads or writes an email-keyed row (customers,
 * abandoned_carts, ...) has to go through this function so the case
 * boundary in the code review can't reopen: mixed-case session emails
 * and lowercase guest emails both map to the same customers.id.
 *
 * Returns the trimmed lowercase form, or `null` when the input is
 * empty/whitespace-only/undefined — callers should treat null as
 * "no usable email" and refuse the operation.
 */
export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  if (!norm || !norm.includes("@")) return null;
  return norm;
}
