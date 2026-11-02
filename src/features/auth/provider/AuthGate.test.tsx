import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const replace = vi.fn();
let pathname = "/write/abc";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

let status = "unauthenticated";
vi.mock("../hooks", () => ({
  useAuth: () => ({ status, isAuthenticated: status === "authenticated" }),
}));

import { AuthGate } from "./AuthGate";
import { GuestGate } from "./GuestGate";

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  status = "unauthenticated";
  pathname = "/write/abc";
});

describe("AuthGate", () => {
  it("sends a signed-out visitor to sign in and remembers the page they wanted", () => {
    window.history.replaceState(null, "", "/write/abc?tab=1");
    render(<AuthGate>secret</AuthGate>);
    expect(replace).toHaveBeenCalledWith(
      "/login?next=%2Fwrite%2Fabc%3Ftab%3D1",
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("does not add a return address for the home page", () => {
    pathname = "/";
    render(<AuthGate>secret</AuthGate>);
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows the page to a signed-in user and redirects no one", () => {
    status = "authenticated";
    render(<AuthGate>secret</AuthGate>);
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("GuestGate", () => {
  it("sends a signed-in visitor back to the page that asked for the sign-in", () => {
    status = "authenticated";
    pathname = "/login";
    window.history.replaceState(null, "", "/login?next=%2Farticles%2Fhello");
    render(<GuestGate>form</GuestGate>);
    expect(replace).toHaveBeenCalledWith("/articles/hello");
  });

  it("goes home when there is none, and ignores an address outside the site", () => {
    status = "authenticated";
    pathname = "/login";
    window.history.replaceState(
      null,
      "",
      "/login?next=https%3A%2F%2Fevil.example.com",
    );
    render(<GuestGate>form</GuestGate>);
    expect(replace).toHaveBeenCalledWith("/");
  });
});
