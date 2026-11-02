import { isSafeNext, loginHref, peekNext, rememberNext } from "./authRedirect";

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/login");
});

describe("isSafeNext", () => {
  it("accepts addresses inside the site", () => {
    expect(isSafeNext("/articles/hello")).toBe(true);
    expect(isSafeNext("/write/abc?x=1#top")).toBe(true);
    expect(isSafeNext("/")).toBe(true);
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "javascript:alert(1)",
    "articles/hello",
    "",
    "/a\nb",
    `/${"a".repeat(600)}`,
  ])("refuses %j", (value) => {
    expect(isSafeNext(value)).toBe(false);
  });

  it("refuses the sign-in pages themselves, which would loop", () => {
    for (const path of [
      "/login",
      "/login?x=1",
      "/register",
      "/mfa-challenge?ticket=1",
      "/auth/callback",
    ]) {
      expect(isSafeNext(path)).toBe(false);
    }
    expect(isSafeNext("/loginfo")).toBe(true);
  });
});

describe("loginHref", () => {
  it("encodes the page, and drops an unsafe one", () => {
    expect(loginHref("/articles/a b")).toBe("/login?next=%2Farticles%2Fa%20b");
    expect(loginHref("https://evil.example.com")).toBe("/login");
  });
});

describe("peekNext", () => {
  it("prefers ?next of this page, then the remembered one, then the fallback", () => {
    expect(peekNext()).toBe("/");
    rememberNext("/articles/remembered");
    expect(peekNext()).toBe("/articles/remembered");
    window.history.replaceState(null, "", "/login?next=%2Farticles%2Furl");
    expect(peekNext()).toBe("/articles/url");
  });

  it("ignores an unsafe ?next and an unsafe remembered value", () => {
    window.history.replaceState(
      null,
      "",
      "/login?next=https%3A%2F%2Fevil.example.com",
    );
    expect(peekNext("/home")).toBe("/home");
    sessionStorage.setItem("pp.next", "//evil.example.com");
    expect(peekNext("/home")).toBe("/home");
  });

  it("forgets with null", () => {
    rememberNext("/articles/a");
    rememberNext(null);
    expect(peekNext()).toBe("/");
  });
});
