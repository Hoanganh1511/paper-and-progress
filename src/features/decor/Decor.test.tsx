import { render } from "@testing-library/react";
import { BrowserCode, PandaCoder, PandaPeek, Star, Ticks } from "./Decor";

describe("Decor", () => {
  it.each([
    ["Ticks", Ticks, "ticks"],
    ["Star", Star, "star"],
    ["PandaCoder", PandaCoder, "panda-coder"],
    ["BrowserCode", BrowserCode, "browser-code"],
    ["PandaPeek", PandaPeek, "panda-peek"],
  ])(
    "draws %s as decoration, hidden from assistive technology",
    (_, Drawing, name) => {
      const { container } = render(<Drawing />);
      const svg = container.querySelector(`[data-decor='${name}']`);
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("focusable", "false");
    },
  );

  it("passes a class on, to size the drawing", () => {
    const { container } = render(<PandaCoder className="h-24" />);
    expect(container.querySelector("svg")).toHaveClass("h-24");
  });

  describe("Ticks", () => {
    /** The two ends of each ray, read from the dash paths (each is drawn twice: edge and yellow). */
    function rays(corner?: "top-left" | "top-right") {
      const { container } = render(<Ticks corner={corner} />);
      const paths = [...container.querySelectorAll("path")].map((path) =>
        (path.getAttribute("d") as string).match(/-?\d+(\.\d+)?/g)!.map(Number),
      );
      // Every second path repeats the one before it.
      return paths
        .filter((_, index) => index % 2 === 0)
        .map(([x1, y1, x2, y2]) => ({ x1, y1, x2, y2 }));
    }

    it("fans out three rays from the bottom-right corner for a top-left fan", () => {
      const found = rays("top-left");
      expect(found).toHaveLength(3);
      for (const { x1, y1, x2, y2 } of found) {
        // From the corner (46, 38) each ray leaves it: the end is farther away than the start.
        const start = Math.hypot(46 - x1, 38 - y1);
        const end = Math.hypot(46 - x2, 38 - y2);
        expect(end).toBeGreaterThan(start);
        // And never towards the right or down, i.e. into the text.
        expect(x2).toBeLessThanOrEqual(x1 + 0.001);
        expect(y2).toBeLessThanOrEqual(y1 + 0.001);
      }
    });

    it("goes up, up and outwards, and straight outwards", () => {
      const [up, diagonal, side] = rays("top-left");
      expect(up.x2).toBeCloseTo(up.x1);
      expect(up.y2).toBeLessThan(up.y1);
      expect(diagonal.x2).toBeLessThan(diagonal.x1);
      expect(diagonal.y2).toBeLessThan(diagonal.y1);
      expect(side.x2).toBeLessThan(side.x1);
      // Nearly level: it climbs less than a quarter as much as it goes out.
      expect(Math.abs(side.y2 - side.y1)).toBeLessThan(
        Math.abs(side.x2 - side.x1) / 4,
      );
    });

    it("is the mirror image for a top-right fan", () => {
      const left = rays("top-left");
      const right = rays("top-right");
      right.forEach((ray, index) => {
        expect(ray.y1).toBeCloseTo(left[index].y1);
        expect(ray.y2).toBeCloseTo(left[index].y2);
        // 46 and 2 are the two origins, 48 apart: mirrored across the middle of the box (x = 24).
        expect(ray.x1).toBeCloseTo(48 - left[index].x1);
        expect(ray.x2).toBeCloseTo(48 - left[index].x2);
      });
    });

    it("says which corner it fans from", () => {
      const { container } = render(<Ticks corner="top-right" />);
      expect(container.querySelector("svg")).toHaveAttribute(
        "data-corner",
        "top-right",
      );
    });

    it("fans from the top left by default", () => {
      const { container } = render(<Ticks />);
      expect(container.querySelector("svg")).toHaveAttribute(
        "data-corner",
        "top-left",
      );
    });
  });
});
