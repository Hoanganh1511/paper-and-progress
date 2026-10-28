import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { HOME_RESOURCES } from "../../resources";
import { ResourcesCard } from "./ResourcesCard";

expect.extend(toHaveNoViolations);

describe("ResourcesCard", () => {
  it("links every resource in a new tab without leaking the opener", () => {
    render(<ResourcesCard resources={HOME_RESOURCES} />);
    const card = screen.getByRole("region", { name: "Tài nguyên" });
    const links = within(card).getAllByRole("link");
    expect(links).toHaveLength(HOME_RESOURCES.length);
    links.forEach((link, index) => {
      expect(link).toHaveAttribute("href", HOME_RESOURCES[index].href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
    expect(
      within(card).getByRole("link", { name: /Next\.js Docs/ }),
    ).toHaveAccessibleName(/mở trong tab mới/);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ResourcesCard resources={HOME_RESOURCES} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
