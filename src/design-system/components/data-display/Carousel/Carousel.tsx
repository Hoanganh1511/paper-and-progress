"use client";

import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { IconButton } from "../../actions/Button/IconButton";

export interface CarouselLabels {
  previous: string;
  next: string;
  /** Name of each slide: `{current}` and `{total}` are replaced. */
  slide: string;
}

export const defaultCarouselLabels: CarouselLabels = {
  previous: "Previous",
  next: "Next",
  slide: "{current} of {total}",
};

export interface CarouselProps extends Omit<ComponentProps<"section">, "ref"> {
  /** Accessible name of the carousel, e.g. "Certificates". Required. */
  "aria-label": string;
  /** One slide per child. Give a child its own width (e.g. `w-60`). */
  children: ReactNode;
  /** Previous / next buttons on both sides, from `md` up. Touch screens just swipe. */
  showArrows?: boolean;
  /** Replace any of the texts (translations). */
  labels?: Partial<CarouselLabels>;
  /** Class for the scrolling row; `className` styles the outer section. */
  trackClassName?: string;
  ref?: ComponentProps<"section">["ref"];
}

/**
 * A row of slides that scrolls sideways and snaps each one to the start edge.
 * It scrolls with a swipe or wheel, with the arrow keys once the row has focus
 * (it is a tab stop), and with the optional buttons, which step one slide and
 * disable themselves at either end. Slides are announced as "n of N". The
 * arrow buttons only show while there is more to scroll to.
 */
export function Carousel({
  children,
  showArrows = true,
  labels: labelOverrides,
  className,
  trackClassName,
  ref,
  "aria-label": ariaLabel,
  ...props
}: CarouselProps) {
  const labels = { ...defaultCarouselLabels, ...labelOverrides };
  const trackRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(ref), [ref]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const slides = Children.toArray(children);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrevious(track.scrollLeft > 1);
    setCanScrollNext(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateScrollState, slides.length]);

  function scrollByOneSlide(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = (slide?.offsetWidth ?? track.clientWidth) + gap;
    track.scrollBy({
      left: direction * step,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  const hasArrows = showArrows && (canScrollPrevious || canScrollNext);

  return (
    <section
      ref={mergedRef}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={cn("relative", className)}
      {...props}
    >
      <div
        ref={trackRef}
        role="group"
        tabIndex={0}
        aria-label={ariaLabel}
        onScroll={updateScrollState}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth rounded-standard pb-3 motion-reduce:scroll-auto",
          focusRingClasses,
          trackClassName,
        )}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide
              .replace("{current}", String(index + 1))
              .replace("{total}", String(slides.length))}
            className="shrink-0 snap-start"
          >
            {slide}
          </div>
        ))}
      </div>

      {hasArrows && (
        <>
          <IconButton
            icon={ChevronLeft}
            aria-label={labels.previous}
            variant="secondary"
            disabled={!canScrollPrevious}
            className="absolute top-1/2 left-0 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-pill shadow-floating md:inline-flex"
            onClick={() => scrollByOneSlide(-1)}
          />
          <IconButton
            icon={ChevronRight}
            aria-label={labels.next}
            variant="secondary"
            disabled={!canScrollNext}
            className="absolute top-1/2 right-0 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-pill shadow-floating md:inline-flex"
            onClick={() => scrollByOneSlide(1)}
          />
        </>
      )}
    </section>
  );
}
