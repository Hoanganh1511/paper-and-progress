import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { HideOnRoutes } from "./HideOnRoutes";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

function setup() {
  render(
    <HideOnRoutes paths={["/devlog"]}>
      <footer>Footer</footer>
    </HideOnRoutes>,
  );
}

describe("HideOnRoutes", () => {
  it("renders its children on other routes", () => {
    pathname = "/bookmarks";
    setup();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("does not match a route that only starts with the same letters", () => {
    pathname = "/devlogs";
    setup();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("hides its children on the route and under it", () => {
    pathname = "/devlog";
    setup();
    expect(screen.queryByText("Footer")).not.toBeInTheDocument();
  });

  it("hides its children below the route too", () => {
    pathname = "/devlog/feed";
    setup();
    expect(screen.queryByText("Footer")).not.toBeInTheDocument();
  });
});
