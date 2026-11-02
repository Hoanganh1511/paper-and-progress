import type { ArticleCardData } from "@/features/articles";
import {
  categoryOf,
  chunk,
  formatViews,
  poseOf,
  slotsFor,
  toneOf,
} from "./carouselLayout";

const withTags = (...slugs: string[]) =>
  ({
    tags: slugs.map((slug) => ({ slug, name: slug })),
  }) as ArticleCardData;

describe("formatViews", () => {
  it.each([
    [956, "956"],
    [1000, "1k"],
    [2100, "2.1k"],
    [9990, "10k"],
    [12000, "12k"],
    [12400, "12k"],
  ])("writes %i as %s", (count, text) => {
    expect(formatViews(count)).toBe(text);
  });

  it.each([[0], [undefined], [null], [-5]])(
    "has nothing to show for %s",
    (count) => {
      expect(formatViews(count)).toBeNull();
    },
  );
});

describe("chunk", () => {
  it("groups in threes and never leaves an empty slide", () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7],
    ]);
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

describe("category colour", () => {
  it("follows the first tag, not the article", () => {
    expect(toneOf(withTags("react", "backend"))).toBe("lime");
    expect(toneOf(withTags("backend", "react"))).toBe("blue");
    expect(toneOf(withTags("english"))).toBe("yellow");
    expect(toneOf(withTags("productivity"))).toBe("pink");
  });

  it("is white for an unknown topic or no tag", () => {
    expect(toneOf(withTags("gardening"))).toBe("white");
    expect(toneOf(withTags())).toBe("white");
    expect(categoryOf(withTags())).toBeNull();
  });
});

describe("slotsFor and poseOf", () => {
  it("places three, two and one cards", () => {
    expect(slotsFor(3)).toEqual(["left", "center", "right"]);
    expect(slotsFor(2)).toEqual(["left", "right"]);
    expect(slotsFor(1)).toEqual(["solo"]);
  });

  it("tilts the sides in opposite ways, smaller and lower, and keeps the centre straight and in front", () => {
    const left = poseOf("left", false);
    const right = poseOf("right", false);
    const center = poseOf("center", false);
    expect(left.rotate).toBeLessThan(0);
    expect(right.rotate).toBe(-left.rotate);
    expect(center.rotate).toBe(0);
    expect(center.scale).toBe(1);
    expect(left.scale).toBeLessThan(center.scale);
    expect(left.y).toBeGreaterThan(center.y);
    expect(center.zIndex).toBeGreaterThan(left.zIndex);
  });

  it("tilts less on a smaller module", () => {
    expect(Math.abs(poseOf("right", true).rotate)).toBeLessThan(
      Math.abs(poseOf("right", false).rotate),
    );
  });
});
