import { createRef } from "react";
import { Target } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LauncherModule } from "../../types";
import { ModuleGridItem } from "./ModuleGridItem";

expect.extend(toHaveNoViolations);

const item: LauncherModule = {
  id: "my-goals",
  label: "My Goals",
  href: "/goals",
  group: "core",
  icon: Target,
};

describe("ModuleGridItem", () => {
  it("is one link named by its label, with the label centered under the picture", () => {
    render(<ModuleGridItem item={item} />);
    const link = screen.getByRole("link", { name: "My Goals" });
    expect(link).toHaveAttribute("href", "/goals");
    expect(link).toHaveClass("flex-col", "items-center", "text-center");
    const label = screen.getByText("My Goals");
    expect(label).toHaveClass("font-medium");
    expect(label.previousElementSibling).toHaveClass("rounded-pill");
  });

  it("draws the icon in a round, decorative picture when there is no image", () => {
    const { container } = render(<ModuleGridItem item={item} />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("lucide-target", "size-1/2");
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("uses the image instead of the icon when given, as a decorative picture", () => {
    const { container } = render(
      <ModuleGridItem item={{ ...item, image: "/goals.png" }} />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/goals.png");
    expect(img).toHaveAttribute("alt", "");
    expect(
      container.querySelector("svg.lucide-target"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAccessibleName("My Goals");
  });

  it("clips the picture to a circle that is a little larger on desktop", () => {
    const { container } = render(<ModuleGridItem item={item} />);
    expect(container.querySelector(".rounded-pill")).toHaveClass(
      "overflow-hidden",
      "size-12",
      "sm:size-12",
      "lg:size-16",
    );
  });

  it("tints the circle by group, and says which group in data-group", () => {
    const tints = {
      core: "bg-accent-lime",
      practice: "bg-accent-blue",
      explore: "bg-accent-yellow",
      community: "bg-accent-pink",
      personal: "bg-accent-pink",
      system: "bg-surface-card",
    } as const;
    (Object.keys(tints) as (keyof typeof tints)[]).forEach((group) => {
      const { container, unmount } = render(
        <ModuleGridItem item={{ ...item, group }} />,
      );
      expect(container.querySelector(".rounded-pill")).toHaveClass(
        tints[group],
      );
      expect(screen.getByRole("link")).toHaveAttribute("data-group", group);
      unmount();
    });
  });

  it("gives the system module a themed icon color, since the tinted ones use fixed ink", () => {
    const { container, rerender } = render(<ModuleGridItem item={item} />);
    expect(container.querySelector(".rounded-pill")).toHaveClass("text-ink");
    rerender(<ModuleGridItem item={{ ...item, group: "system" }} />);
    const circle = container.querySelector(".rounded-pill");
    expect(circle).toHaveClass(
      "text-text-primary",
      "border",
      "border-border-default",
    );
    expect(circle).not.toHaveClass("text-ink");
  });

  it("has a focus ring, a 44px minimum height, and reduced-motion-safe hover", () => {
    const { container } = render(<ModuleGridItem item={item} />);
    expect(screen.getByRole("link")).toHaveClass(
      "min-h-11",
      "focus-visible:outline-2",
    );
    expect(container.querySelector(".rounded-pill")).toHaveClass(
      "group-hover:scale-105",
      "motion-reduce:group-hover:scale-100",
    );
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<ModuleGridItem item={item} ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("link"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <ModuleGridItem item={item} />
        <ModuleGridItem
          item={{ ...item, id: "x", label: "With image", image: "/x.png" }}
        />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
