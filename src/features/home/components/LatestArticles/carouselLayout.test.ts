import { chunk, poseOf, slotsFor, toneOfIndex } from "./carouselLayout";

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

describe("toneOfIndex", () => {
  it("gives neighbours different colours and starts over after the last", () => {
    expect(toneOfIndex(0)).not.toBe(toneOfIndex(1));
    expect(toneOfIndex(4)).toBe(toneOfIndex(0));
  });
});

describe("slotsFor and poseOf", () => {
  it("places three, two and one cards", () => {
    expect(slotsFor(3)).toEqual(["left", "center", "right"]);
    expect(slotsFor(2)).toEqual(["left", "right"]);
    expect(slotsFor(1)).toEqual(["solo"]);
  });

  it("tilts the sides in opposite ways, lower, and keeps the centre straight and in front", () => {
    const left = poseOf("left", false);
    const right = poseOf("right", false);
    const center = poseOf("center", false);
    expect(left.rotate).toBeLessThan(0);
    expect(right.rotate).toBe(-left.rotate);
    expect(center.rotate).toBe(0);
    expect(center.scale).toBe(1);
    expect(left.scale).toBe(center.scale);
    expect(left.y).toBeGreaterThan(center.y);
    expect(center.zIndex).toBeGreaterThan(left.zIndex);
  });

  it("tilts less on a smaller module", () => {
    expect(Math.abs(poseOf("right", true).rotate)).toBeLessThan(
      Math.abs(poseOf("right", false).rotate),
    );
  });
});
