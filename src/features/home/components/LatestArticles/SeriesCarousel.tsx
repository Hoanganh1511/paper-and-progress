"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CarouselControls } from "./CarouselControls";
import { SeriesCard } from "./SeriesCard";
import { chunk, poseOf, slotsFor, toneOfIndex } from "./carouselLayout";
import type { SeriesShowcase } from "./types";

/** Wide enough for three cards side by side. */
const THREE_UP_MIN = 1000;
/** Wide enough for two cards; below it one card fills the slide. */
const TWO_UP_MIN = 600;
/** Below this the tilt is softened. */
const FULL_TILT_MIN = 1100;
const SWIPE_PX = 60;
/** A change of slide is an exit and an entrance, so each takes half of ~500ms. */
const LEG_SECONDS = 0.25;

/**
 * The width of the element, so the number of cards follows the room the module
 * has and not the screen. It starts wide, so the server and the first paint
 * agree on three cards.
 */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FULL_TILT_MIN);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export interface SeriesCarouselProps {
  series: SeriesShowcase[];
}

/**
 * The series cards in slides of three (two, or one, when the module is
 * narrow). All the cards of a slide change together. Next and previous wrap
 * round; the dots jump to a slide; on a one-card slide the card can be swiped.
 */
export function SeriesCarousel({ series }: SeriesCarouselProps) {
  const { ref, width } = useWidth();
  const isReduced = useReducedMotion();
  const perSlide = width >= THREE_UP_MIN ? 3 : width >= TWO_UP_MIN ? 2 : 1;
  const isCompact = width < FULL_TILT_MIN;
  const slides = chunk(series, perSlide);
  const [requested, setRequested] = useState(0);
  const [direction, setDirection] = useState(1);
  // The number of slides can shrink when the module is resized.
  const current = Math.min(requested, slides.length - 1);

  function go(next: number, by: number) {
    setDirection(by);
    setRequested((next + slides.length) % slides.length);
  }
  const previous = () => go(current - 1, -1);
  const next = () => go(current + 1, 1);

  const slide = slides[current];
  const slots = slotsFor(slide.length);
  const leg = isReduced ? 0 : LEG_SECONDS;

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="carousel"
      aria-label="Series nổi bật"
      className="flex flex-col gap-3"
    >
      <div className="flex min-h-[28rem] items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${perSlide}-${current}`}
            custom={direction}
            variants={{
              enter: (by: number) => ({ opacity: 0, x: by * 80 }),
              center: { opacity: 1, x: 0 },
              exit: (by: number) => ({ opacity: 0, x: by * -80 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: leg, ease: "easeInOut" }}
            drag={perSlide === 1 && slides.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x <= -SWIPE_PX) next();
              else if (info.offset.x >= SWIPE_PX) previous();
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${current + 1} trên ${slides.length}`}
            className="flex items-center justify-center -space-x-12 px-4 xl:-space-x-28 pt-6 pb-8"
          >
            {slide.map((item, index) => (
              <SeriesCard
                key={item.id}
                series={item}
                tone={toneOfIndex(current * perSlide + index)}
                pose={poseOf(slots[index], isCompact)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <p role="status" className="sr-only">
        {slides.length > 1
          ? `Nhóm series ${current + 1} trên ${slides.length}`
          : ""}
      </p>
      <CarouselControls
        count={slides.length}
        current={current}
        onPrevious={previous}
        onNext={next}
        onSelect={(index) => go(index, index > current ? 1 : -1)}
      />
    </div>
  );
}
