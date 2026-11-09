/** How many series the Dashboard asks for. */
export const MAX_SERIES = 9;

/** How much room the stage has decides how many cards stand on it. */
export type StageMode = "wide" | "medium" | "narrow";

const WIDE_MIN = 1000;
const MEDIUM_MIN = 640;

export const modeOf = (stageWidth: number): StageMode =>
  stageWidth >= WIDE_MIN
    ? "wide"
    : stageWidth >= MEDIUM_MIN
      ? "medium"
      : "narrow";

/** How many cards stand on each side of the active one. */
export const radiusOf = (mode: StageMode): number =>
  mode === "wide" ? 2 : mode === "medium" ? 1 : 0;

/** The width of a card, from the width of the stage. */
export function cardWidthOf(stageWidth: number): number {
  const mode = modeOf(stageWidth);
  if (mode === "wide") return 520;
  if (mode === "medium") return Math.min(480, Math.round(stageWidth * 0.64));
  return Math.max(260, Math.min(400, stageWidth - 64));
}

/** The height of a card, in px: a narrower card wraps its titles more, so it needs more. */
export const cardHeightOf = (mode: StageMode): number =>
  mode === "wide" ? 456 : mode === "medium" ? 464 : 488;

/**
 * How far a card is from the active one, going the short way round: 0 is the
 * active card, 1 the next one, -1 the previous one. With few cards the extra
 * place goes to the right, so two cards are the active one and its next.
 */
export function offsetOf(index: number, active: number, count: number): number {
  if (count <= 1) return 0;
  const ahead = (((index - active) % count) + count) % count;
  return ahead > count / 2 ? ahead - count : ahead;
}

/** Where a card stands in the space of the stage; each number is what the animation moves to. */
export interface CardPose {
  /** Sideways from the middle of the stage, in px. */
  x: number;
  /** Down from the line the cards stand on, in px. */
  y: number;
  /** Towards the reader (positive) or away, in px. */
  z: number;
  scale: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
  zIndex: number;
}

/** Sideways distance of the card at each place, as a share of the card's width. */
const SPREAD = [0, 0.74, 1.15, 1.5] as const;

/** Every card is drawn this much smaller than its box (the box keeps the room its content needs). */
export const CARD_SCALE = 0.8;

/**
 * The pose of the card that is `offset` places from the active one. It only
 * depends on that place, the width of a card and the room, never on chance:
 * the active card stands in front and flat, the ones beside it recede, turn
 * their inner edge away, fan out a little and sink; the ones past the room
 * wait outside, unseen.
 */
export function poseOf(
  offset: number,
  cardWidth: number,
  mode: StageMode,
): CardPose {
  const place = Math.abs(offset);
  const side = Math.sign(offset);
  const radius = radiusOf(mode);

  if (place > radius) {
    return {
      x: side * cardWidth * SPREAD[Math.min(place, 3)],
      y: 40,
      z: -150,
      scale: 0.7,
      rotateY: -side * 20,
      rotateZ: side * 5,
      opacity: 0,
      zIndex: 0,
    };
  }
  if (place === 0) {
    return {
      x: 0,
      y: 0,
      z: mode === "narrow" ? 0 : 100,
      scale: 1,
      rotateY: mode === "narrow" ? -4 : 0,
      rotateZ: 0,
      opacity: 1,
      zIndex: 30,
    };
  }
  if (place === 1) {
    const isNext = side > 0;
    return {
      x: side * cardWidth * SPREAD[1],
      y: 12,
      z: isNext ? -20 : -40,
      scale: 0.82,
      rotateY: -side * 30,
      rotateZ: side * 2.5,
      opacity: 1,
      zIndex: isNext ? 20 : 15,
    };
  }
  return {
    x: side * cardWidth * SPREAD[2],
    y: 36,
    z: -110,
    scale: 0.76,
    rotateY: -side * 40,
    rotateZ: side * 5,
    opacity: 0.92,
    zIndex: 10,
  };
}
