"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ArticleCardData } from "@/features/articles";
import { CarouselControls } from "./CarouselControls";
import { LatestArticleCard } from "./LatestArticleCard";
import { chunk, poseOf, slotsFor } from "./carouselLayout";

/** Wide enough for three cards side by side. */
const THREE_UP_MIN = 900;
/** Wide enough for two cards; below it one card fills the slide. */
const TWO_UP_MIN = 600;
/** Below this the tilt is softened. */
const FULL_TILT_MIN = 1000;
const SWIPE_PX = 60;
/** A change of slide is an exit and an entrance, so each takes half of ~500ms. */
const LEG_SECONDS = 0.25;

/**
 * The width of the element, so the number of cards follows the room the module
 * has (the Dashboard column is narrow beside the side panels) and not the screen.
 * It starts wide, so the server and the first paint agree on three cards.
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

export interface ArticleCarouselProps {
  articles: ArticleCardData[];
}

/**
 * The cards in slides of three (two, or one, when the module is narrow). All
 * the cards of a slide change together. Next and previous wrap round; the dots
 * jump to a slide; on a one-card slide the card can also be swiped.
 */
export function ArticleCarousel({ articles }: ArticleCarouselProps) {
  const { ref, width } = useWidth();
  const isReduced = useReducedMotion();
  const perSlide = width >= THREE_UP_MIN ? 3 : width >= TWO_UP_MIN ? 2 : 1;
  const isCompact = width < FULL_TILT_MIN;
  const slides = chunk(articles, perSlide);
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
      aria-label="Bài viết mới nhất"
      className="flex flex-col gap-3"
    >
      <div className="flex min-h-[24rem] items-center justify-center overflow-hidden sm:min-h-[27rem]">
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
            className="flex items-center justify-center -space-x-4 px-4 pt-6 pb-8 xl:-space-x-6"
          >
            {slide.map((article, index) => (
              <LatestArticleCard
                key={article.id}
                article={article}
                pose={poseOf(slots[index], isCompact)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <p role="status" className="sr-only">
        {slides.length > 1
          ? `Nhóm bài viết ${current + 1} trên ${slides.length}`
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
