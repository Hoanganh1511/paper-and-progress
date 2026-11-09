import { toneOfIndex } from "@/features/study-lists";
import {
  cardWidthOf,
  modeOf,
  offsetOf,
  poseOf,
  radiusOf,
} from "./carouselLayout";

describe("toneOfIndex", () => {
  it("gives neighbours different colours and starts over after the last", () => {
    expect(toneOfIndex(0)).not.toBe(toneOfIndex(1));
    expect(toneOfIndex(4)).toBe(toneOfIndex(0));
  });
});

describe("modeOf, radiusOf and cardWidthOf", () => {
  it("puts five cards on a wide stage, three on a medium one and one on a narrow one", () => {
    expect(modeOf(1100)).toBe("wide");
    expect(modeOf(800)).toBe("medium");
    expect(modeOf(400)).toBe("narrow");
    expect(radiusOf("wide")).toBe(2);
    expect(radiusOf("medium")).toBe(1);
    expect(radiusOf("narrow")).toBe(0);
  });

  it("keeps a card readable: wide at the top, never wider than the stage when narrow", () => {
    expect(cardWidthOf(1400)).toBe(520);
    expect(cardWidthOf(800)).toBeLessThanOrEqual(480);
    expect(cardWidthOf(375)).toBeLessThan(375);
    expect(cardWidthOf(300)).toBeGreaterThanOrEqual(260);
  });
});

describe("offsetOf", () => {
  it("is 0 for the active card, and counts the short way round", () => {
    expect(offsetOf(2, 2, 6)).toBe(0);
    expect(offsetOf(3, 2, 6)).toBe(1);
    expect(offsetOf(1, 2, 6)).toBe(-1);
    // wraps: after the last comes the first
    expect(offsetOf(0, 5, 6)).toBe(1);
    expect(offsetOf(5, 0, 6)).toBe(-1);
    expect(offsetOf(4, 0, 6)).toBe(-2);
  });

  it("works with one, two and three cards", () => {
    expect(offsetOf(0, 0, 1)).toBe(0);
    expect(offsetOf(1, 0, 2)).toBe(1);
    expect(offsetOf(0, 1, 2)).toBe(1);
    expect(offsetOf(1, 0, 3)).toBe(1);
    expect(offsetOf(2, 0, 3)).toBe(-1);
  });
});

describe("poseOf", () => {
  const wide = (offset: number) => poseOf(offset, 420, "wide");

  it("puts the active card in front, whole, flat and at the middle", () => {
    const active = wide(0);
    expect(active).toMatchObject({ x: 0, scale: 1, rotateZ: 0, opacity: 1 });
    expect(active.z).toBeGreaterThan(wide(1).z);
    expect(active.zIndex).toBeGreaterThan(wide(1).zIndex);
  });

  it("sends the cards further from the active one smaller, deeper, lower and behind", () => {
    for (const side of [1, -1]) {
      const first = wide(side);
      const second = wide(side * 2);
      expect(second.scale).toBeLessThan(first.scale);
      expect(second.z).toBeLessThan(first.z);
      expect(second.y).toBeGreaterThan(first.y);
      expect(second.zIndex).toBeLessThan(first.zIndex);
      expect(Math.abs(second.x)).toBeGreaterThan(Math.abs(first.x));
      expect(Math.abs(second.rotateY)).toBeGreaterThan(Math.abs(first.rotateY));
    }
  });

  it("turns the inner edge of both sides away, and mirrors the sides", () => {
    expect(wide(1).rotateY).toBeLessThan(0);
    expect(wide(-1).rotateY).toBeGreaterThan(0);
    expect(wide(-1).x).toBe(-wide(1).x);
    expect(wide(-2).rotateZ).toBe(-wide(2).rotateZ);
  });

  it("leaves the cards past the room outside and unseen", () => {
    expect(wide(3).opacity).toBe(0);
    expect(poseOf(2, 420, "medium").opacity).toBe(0);
    expect(poseOf(1, 420, "medium").opacity).toBe(1);
    expect(poseOf(1, 300, "narrow").opacity).toBe(0);
  });

  it("depends on nothing but its arguments", () => {
    expect(wide(1)).toEqual(wide(1));
  });
});
