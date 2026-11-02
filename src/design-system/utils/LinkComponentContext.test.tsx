import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { LinkButton } from "../components/actions/Button/LinkButton";
import { LinkComponentProvider } from "./LinkComponentContext";

function RouterLink({
  href,
  children,
  ...props
}: {
  href: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} data-router-link="" {...props}>
      {children}
    </a>
  );
}

describe("LinkComponentProvider", () => {
  it("makes a link button use the framework's link instead of a plain anchor", () => {
    render(
      <LinkComponentProvider component={RouterLink}>
        <LinkButton href="/learn">Học tập</LinkButton>
      </LinkComponentProvider>,
    );
    const link = screen.getByRole("link", { name: "Học tập" });
    expect(link).toHaveAttribute("href", "/learn");
    expect(link).toHaveAttribute("data-router-link");
  });

  it("is a plain anchor without a provider", () => {
    render(<LinkButton href="/learn">Học tập</LinkButton>);
    expect(screen.getByRole("link", { name: "Học tập" })).not.toHaveAttribute(
      "data-router-link",
    );
  });

  it("leaves a link to another site as a plain anchor that opens in a new tab", () => {
    render(
      <LinkComponentProvider component={RouterLink}>
        <LinkButton href="https://example.com" external>
          Trang ngoài
        </LinkButton>
      </LinkComponentProvider>,
    );
    const link = screen.getByRole("link", { name: /Trang ngoài/ });
    expect(link).not.toHaveAttribute("data-router-link");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("LinkButton on the server", () => {
  // A server page hands a link button an icon, which is a function. That only works while the
  // button is not a client component; jsdom cannot show the failure, so the files are checked.
  const read = (file: string) =>
    readFileSync(join(__dirname, file), "utf8").trimStart();

  it("is not a client component, so a server page can still give it an icon", () => {
    expect(read("../components/actions/Button/LinkButton.tsx")).not.toMatch(
      /^["']use client["']/,
    );
  });

  it("keeps the client part of a link in the small AppLink", () => {
    expect(read("./AppLink.tsx")).toMatch(/^["']use client["']/);
  });
});
