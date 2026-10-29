const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
/** Longest we hold up a submit waiting for reCAPTCHA. */
const TIMEOUT_MS = 5000;

/**
 * Gets a reCAPTCHA v3 token for `action` ("login", "register"...). Never
 * rejects and never blocks for long: without a site key, before the script
 * has loaded, or on any error it returns "" and the request goes out without
 * a token.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (!SITE_KEY || typeof window === "undefined" || !window.grecaptcha) {
    return "";
  }
  const { grecaptcha } = window;
  const token = new Promise<string>((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(SITE_KEY, { action }).then(resolve, () => resolve(""));
    });
  });
  const timeout = new Promise<string>((resolve) =>
    setTimeout(() => resolve(""), TIMEOUT_MS),
  );
  try {
    return await Promise.race([token, timeout]);
  } catch {
    return "";
  }
}
