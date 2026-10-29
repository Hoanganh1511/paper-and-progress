export type SocialProvider = "google" | "facebook" | "github";

const ALL_PROVIDERS: SocialProvider[] = ["google", "facebook", "github"];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Reads a comma-separated list such as "google,github". Unknown names and
 * repeats are dropped; with no value every provider is on. A provider also
 * needs its credentials on the backend, or its button would lead to an error,
 * so deployments list only the ones that are set up.
 */
export function parseProviders(value: string | undefined): SocialProvider[] {
  if (value === undefined) return ALL_PROVIDERS;
  const wanted = value.split(",").map((name) => name.trim().toLowerCase());
  return ALL_PROVIDERS.filter((provider) => wanted.includes(provider));
}

/** The buttons the auth pages show: `NEXT_PUBLIC_SOCIAL_PROVIDERS`, e.g. "google". */
export const ENABLED_SOCIAL_PROVIDERS = parseProviders(
  process.env.NEXT_PUBLIC_SOCIAL_PROVIDERS,
);

/**
 * Where the backend starts the provider's OAuth flow. It sends the visitor to
 * the provider, and afterwards back to `/auth/callback` here with the tokens.
 */
export function getSocialLoginUrl(provider: SocialProvider): string {
  return `${API_URL}/api/v1/auth/${provider}`;
}

/** Leaves the page for the provider's sign-in, through the backend. */
export function startSocialLogin(provider: SocialProvider): void {
  window.location.assign(getSocialLoginUrl(provider));
}
