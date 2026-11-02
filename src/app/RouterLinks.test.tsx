import { render, screen } from "@testing-library/react";
import { LinkButton } from "@/design-system";
import { RouterLinks } from "./RouterLinks";

describe("RouterLinks", () => {
  it("lets a link button below it render as an internal link", () => {
    render(
      <RouterLinks>
        <LinkButton href="/learn">Học tập</LinkButton>
      </RouterLinks>,
    );
    expect(screen.getByRole("link", { name: "Học tập" })).toHaveAttribute(
      "href",
      "/learn",
    );
  });

  it("keeps a link to another site as an anchor that opens in a new tab", () => {
    render(
      <RouterLinks>
        <LinkButton href="https://example.com" external>
          Trang ngoài
        </LinkButton>
      </RouterLinks>,
    );
    expect(screen.getByRole("link", { name: /Trang ngoài/ })).toHaveAttribute(
      "target",
      "_blank",
    );
  });
});
