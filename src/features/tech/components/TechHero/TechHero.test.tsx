import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { TechHero } from "./TechHero";

expect.extend(toHaveNoViolations);

const props = {
  breadcrumbs: [
    { label: "Mục tiêu của tôi", href: "/goals" },
    { label: "Công nghệ thông tin" },
  ],
  title: "Công nghệ thông tin",
  description: "Chọn một nhóm kiến thức.",
};

describe("TechHero", () => {
  it("has the path, the title and the line on what to do", () => {
    render(<TechHero {...props} />);
    expect(
      screen.getByRole("navigation", { name: "Đường dẫn" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Mục tiêu của tôi" }),
    ).toHaveAttribute("href", "/goals");
    expect(
      screen.getByRole("heading", { level: 1, name: "Công nghệ thông tin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chọn một nhóm kiến thức.")).toBeInTheDocument();
  });

  it("fans flicks off the end of the title, and draws the panda as decoration", () => {
    const { container } = render(<TechHero {...props} />);
    const ticks = container.querySelector("[data-decor='ticks']");
    expect(ticks).toHaveAttribute("data-corner", "top-right");
    expect(
      container
        .querySelector("[data-decor='panda-coder']")
        ?.closest("[aria-hidden='true']"),
    ).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TechHero {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
