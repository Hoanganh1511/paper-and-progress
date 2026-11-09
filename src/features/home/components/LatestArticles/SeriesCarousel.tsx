"use client";

import {
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/design-system";
import { SeriesCard, toneOfIndex } from "@/features/study-lists";
import { CarouselArrow, CarouselDots } from "./CarouselControls";
import {
  CARD_SCALE,
  cardHeightOf,
  cardWidthOf,
  modeOf,
  offsetOf,
  poseOf,
  radiusOf,
} from "./carouselLayout";
import { useElementWidth, useSeriesCarousel } from "./useSeriesCarousel";
import type { SeriesShowcase } from "./types";

/** A drag or a swipe this long (and mostly sideways) moves to the next or the previous series. */
const SWIPE_PX = 60;
const EASE = [0.22, 1, 0.36, 1] as const;
const MOVE_SECONDS = 0.65;

/**
 * A stacked hard shadow (ink slab, then a lighter one) that falls away from the
 * stage's centre, so a card behind looks like a thick slab turned in space.
 * The front card's falls straight down and to the right.
 */
function shadowOf(offset: number): string {
  // Whole class names, so Tailwind can see them.
  if (offset === 0)
    return "shadow-[8px_10px_0_0_var(--color-border-strong),16px_20px_0_0_rgba(23,23,23,0.16)] hover:shadow-[8px_10px_0_0_var(--color-border-strong),16px_20px_0_0_rgba(23,23,23,0.16)]";
  return offset > 0
    ? "shadow-[12px_8px_0_0_var(--color-border-strong),24px_16px_0_0_rgba(23,23,23,0.16)] hover:shadow-[12px_8px_0_0_var(--color-border-strong),24px_16px_0_0_rgba(23,23,23,0.16)]"
    : "shadow-[-12px_8px_0_0_var(--color-border-strong),-24px_16px_0_0_rgba(23,23,23,0.16)] hover:shadow-[-12px_8px_0_0_var(--color-border-strong),-24px_16px_0_0_rgba(23,23,23,0.16)]";
}

export interface SeriesCarouselProps {
  series: SeriesShowcase[];
}

/**
 * The series as cards standing in one 3D space: the active one in front and
 * whole, the next ones behind it, smaller, turned and partly hidden. Which
 * series is where follows from `active` alone. A card behind can be clicked to
 * bring it forward; the arrows, the dots, the arrow keys, a drag and a swipe
 * do the same. A card behind is inert, so only the front card's links can be
 * reached, and a drag never opens a lesson.
 */
export function SeriesCarousel({ series }: SeriesCarouselProps) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const isReduced = useReducedMotion();
  const { active, goTo, next, previous } = useSeriesCarousel(series.length);
  const mode = modeOf(width);
  const cardWidth = cardWidthOf(width);
  const cardHeight = cardHeightOf(mode);
  const radius = radiusOf(mode);
  const hasMany = series.length > 1;

  const drag = useRef<{ x: number; y: number } | undefined>(undefined);
  const wasDragged = useRef(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { x: event.clientX, y: event.clientY };
  }
  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    drag.current = undefined;
    if (!start || !hasMany) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // The click that follows the release is not a choice of a lesson.
    wasDragged.current = true;
    setTimeout(() => {
      wasDragged.current = false;
    }, 0);
    if (dx < 0) next();
    else previous();
  }
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!wasDragged.current) return;
    event.preventDefault();
    event.stopPropagation();
  }
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasMany || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previous();
    }
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label="Series mới nhất"
      onKeyDown={handleKeyDown}
      className="relative flex flex-col gap-2"
    >
      <div className="relative overflow-hidden">
        {hasMany && mode !== "narrow" && (
          <>
            <CarouselArrow
              direction="previous"
              onClick={previous}
              className="absolute top-1/2 left-1 z-40 -mt-[22px]"
            />
            <CarouselArrow
              direction="next"
              onClick={next}
              className="absolute top-1/2 right-1 z-40 -mt-[22px]"
            />
          </>
        )}
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            drag.current = undefined;
          }}
          onClickCapture={handleClickCapture}
          // A link dragged by the browser would cancel the drag of the cards.
          onDragStart={(event) => event.preventDefault()}
          style={{ height: Math.round(cardHeight * CARD_SCALE) + 64 }}
          className="relative touch-pan-y select-none [perspective-origin:50%_45%] [perspective:1400px]"
        >
          {series.map((item, index) => {
            const offset = offsetOf(index, active, series.length);
            // The spacing follows the width the card is drawn at, so smaller cards stand closer.
            const pose = poseOf(offset, cardWidth * CARD_SCALE, mode);
            const isActive = offset === 0;
            const isVisible = Math.abs(offset) <= radius;
            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  x: pose.x,
                  y: pose.y,
                  z: pose.z,
                  scale: pose.scale * CARD_SCALE,
                  rotateY: pose.rotateY,
                  rotateZ: pose.rotateZ,
                  opacity: pose.opacity,
                }}
                whileHover={
                  isReduced || isActive || !isVisible
                    ? undefined
                    : { y: pose.y - 8, transition: { duration: 0.2 } }
                }
                transition={{
                  duration: isReduced ? 0 : MOVE_SECONDS,
                  ease: EASE,
                }}
                // The card's own centre is the stage's: the width is set, and half of it pulled back.
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  marginLeft: -cardWidth / 2,
                  marginTop: -cardHeight / 2,
                  zIndex: pose.zIndex,
                  pointerEvents: isVisible ? "auto" : "none",
                }}
                aria-hidden={isVisible ? undefined : true}
                className="absolute top-1/2 left-1/2"
              >
                {/* Only the front card's links can be reached; the others are chosen as a whole. */}
                <div inert={!isActive} className="h-full w-full">
                  <SeriesCard
                    series={item}
                    tone={toneOfIndex(index)}
                    variant={isActive ? "full" : "compact"}
                    showCertificates={false}
                    className={cn(
                      "h-full w-full",
                      shadowOf(offset),
                      !isActive && "brightness-95",
                    )}
                  />
                </div>
                {isVisible && !isActive && (
                  <button
                    type="button"
                    aria-label={`Xem series ${item.title}`}
                    onClick={() => goTo(index)}
                    className="absolute inset-0 z-10 cursor-pointer rounded-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      <p role="status" className="sr-only">
        {hasMany
          ? `Series ${active + 1} trên ${series.length}: ${series[active].title}`
          : ""}
      </p>
      {mode === "narrow" ? (
        hasMany && (
          <div className="flex items-center justify-center gap-4">
            <CarouselArrow direction="previous" onClick={previous} />
            <span className="min-w-16 text-center font-display text-body-lg font-bold text-text-primary">
              {active + 1} / {series.length}
            </span>
            <CarouselArrow direction="next" onClick={next} />
          </div>
        )
      ) : (
        <div className="relative flex items-center justify-center">
          <CarouselDots
            count={series.length}
            current={active}
            onSelect={goTo}
          />
        </div>
      )}
    </div>
  );
}
