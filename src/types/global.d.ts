export {};

declare global {
  interface Window {
    /** Set by the reCAPTCHA v3 script; absent until it has loaded. */
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}
