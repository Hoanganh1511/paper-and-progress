import { vi } from "vitest";
import {
  getSocialLoginUrl,
  parseProviders,
  startSocialLogin,
} from "./socialAuth";

describe("getSocialLoginUrl", () => {
  it("points at the backend route that starts each provider's flow", () => {
    expect(getSocialLoginUrl("google")).toBe(
      "http://localhost:8000/api/v1/auth/google",
    );
    expect(getSocialLoginUrl("facebook")).toBe(
      "http://localhost:8000/api/v1/auth/facebook",
    );
    expect(getSocialLoginUrl("github")).toBe(
      "http://localhost:8000/api/v1/auth/github",
    );
  });
});

describe("startSocialLogin", () => {
  it("sends the browser to the backend route", () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });

    startSocialLogin("github");

    expect(assign).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/auth/github",
    );
  });
});

describe("parseProviders", () => {
  it("turns every provider on when nothing is configured", () => {
    expect(parseProviders(undefined)).toEqual(["google", "facebook", "github"]);
  });

  it("keeps only the listed providers, in a fixed order", () => {
    expect(parseProviders("google")).toEqual(["google"]);
    expect(parseProviders(" GitHub , Google ")).toEqual(["google", "github"]);
  });

  it("drops unknown names and repeats, and allows none at all", () => {
    expect(parseProviders("google,twitter,google")).toEqual(["google"]);
    expect(parseProviders("")).toEqual([]);
  });
});
