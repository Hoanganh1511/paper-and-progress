import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  FacebookIcon,
  PandaIcon,
  UnitedKingdomFlagIcon,
  VietnamFlagIcon,
} from "./icons";

expect.extend(toHaveNoViolations);

const icons = {
  PandaIcon,
  FacebookIcon,
  VietnamFlagIcon,
  UnitedKingdomFlagIcon,
};

describe("header icons", () => {
  it.each(Object.entries(icons))(
    "%s is a decorative, unfocusable svg",
    (_name, Icon) => {
      const { container } = render(<Icon className="size-6" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
      expect(svg).toHaveClass("size-6");
    },
  );

  it("outlines the panda with the theme's text color so its ears show in dark mode", () => {
    const { container } = render(<PandaIcon />);
    const outlined = container.querySelectorAll("circle[style]");
    // Both ears and the face.
    expect(outlined).toHaveLength(3);
    outlined.forEach((shape) =>
      expect((shape as SVGElement).style.stroke).toBe(
        "var(--color-text-primary)",
      ),
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <PandaIcon />
        <FacebookIcon />
        <VietnamFlagIcon />
        <UnitedKingdomFlagIcon />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
