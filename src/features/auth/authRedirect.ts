/**
 * Where to go after signing in. A page that needs an account sends the visitor
 * to `/login?next=/where/they/were`; once they are in, they land there instead
 * of on the home page. Only addresses inside this site are accepted, so the
 * parameter cannot be used to send someone to another site.
 */
const KEY = "pp.next";
const MAX_LENGTH = 500;

/** Pages of the sign-in flow itself: returning to one would loop. */
const AUTH_PREFIXES = [
  "/login",
  "/register",
  "/mfa-challenge",
  "/auth",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/account-suspended",
];

export function isSafeNext(value: string | null | undefined): value is string {
  if (!value || value.length > MAX_LENGTH) return false;
  // One leading slash only: "//host" and "/\host" are read by browsers as another site.
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return false;
  }
  if (/[\u0000-\u001f]/.test(value)) return false;
  return !AUTH_PREFIXES.some(
    (prefix) =>
      value === prefix ||
      value.startsWith(`${prefix}/`) ||
      value.startsWith(`${prefix}?`),
  );
}

/** `/login?next=...` for a page that wants the visitor back after signing in. */
export const loginHref = (next: string) =>
  isSafeNext(next) ? `/login?next=${encodeURIComponent(next)}` : "/login";

/** Keeps `next` for the steps after the sign-in form (two-factor, a social provider). `null` forgets it. */
export function rememberNext(next: string | null) {
  try {
    if (isSafeNext(next)) sessionStorage.setItem(KEY, next);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage blocked: the visitor just lands on the fallback
  }
}

/** The address to go to after signing in: `?next` of this page, else the remembered one, else `fallback`. */
export function peekNext(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  const fromUrl = new URLSearchParams(window.location.search).get("next");
  if (isSafeNext(fromUrl)) return fromUrl;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (isSafeNext(stored)) return stored;
  } catch {
    // ignore
  }
  return fallback;
}
