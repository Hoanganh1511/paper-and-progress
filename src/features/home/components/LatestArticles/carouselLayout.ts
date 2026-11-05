/** How many series the Dashboard asks for. */
export const MAX_SERIES = 9;

/** How many lessons of a series each card lists. */
export const STEPS_PER_SERIES = 3;

export type SeriesTone = "pink" | "lime" | "blue" | "yellow";

const TONES: SeriesTone[] = ["pink", "lime", "blue", "yellow"];

/** The colour of a card's offset shadow follows its place in the list, so neighbours differ. */
export const toneOfIndex = (index: number): SeriesTone =>
  TONES[index % TONES.length];

/** Groups into slides of `size`; the last slide may be shorter, none is empty. */
export function chunk<T>(items: T[], size: number): T[][] {
  const slides: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    slides.push(items.slice(i, i + size));
  }
  return slides;
}

export type Slot = "left" | "center" | "right" | "solo";

export interface Pose {
  rotate: number;
  scale: number;
  y: number;
  zIndex: number;
}

/** Tilt, height and depth of each place a card can take; a smaller screen tilts less. */
export function poseOf(slot: Slot, isCompact: boolean): Pose {
  const tilt = isCompact ? 0.6 : 1;
  switch (slot) {
    case "left":
      return { rotate: -4 * tilt, scale: 1, y: 16, zIndex: 1 };
    case "right":
      return { rotate: 4 * tilt, scale: 1, y: 16, zIndex: 1 };
    case "center":
      return { rotate: 0, scale: 1, y: 0, zIndex: 3 };
    case "solo":
      return { rotate: 0, scale: 1, y: 0, zIndex: 1 };
  }
}

/**
 * The places of the cards in a slide. Three fill left, centre and right; two
 * sit as a balanced pair; one stands alone in the middle.
 */
export function slotsFor(count: number): Slot[] {
  if (count >= 3) return ["left", "center", "right"];
  if (count === 2) return ["left", "right"];
  return ["solo"];
}
