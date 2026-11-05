import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/design-system";

export interface CarouselArrowProps {
  direction: "previous" | "next";
  onClick: () => void;
  className?: string;
}

/** A round button at the side of the cards; a hard shadow that sinks when pressed. */
export function CarouselArrow({
  direction,
  onClick,
  className,
}: CarouselArrowProps) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={
        direction === "previous" ? "Nhóm series trước" : "Nhóm series tiếp theo"
      }
      onClick={onClick}
      className={cn(
        "inline-flex size-11 cursor-pointer items-center justify-center rounded-pill border-2 border-border-strong bg-surface-card text-ink shadow-floating transition-[translate,box-shadow,background-color] duration-[var(--duration-fast)] hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none",
        className,
      )}
    >
      <Icon aria-hidden="true" size={22} strokeWidth={2.5} />
    </button>
  );
}

export interface CarouselDotsProps {
  count: number;
  current: number;
  onSelect: (index: number) => void;
}

/**
 * The dots, one per slide. Nothing is shown for a single slide. The current
 * dot is larger as well as lime, so it never depends on colour alone.
 */
export function CarouselDots({ count, current, onSelect }: CarouselDotsProps) {
  if (count <= 1) return null;
  return (
    <ul className="flex items-center" aria-label="Các nhóm series">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <button
            type="button"
            aria-label={`Nhóm series ${index + 1} trên ${count}`}
            aria-current={index === current ? "true" : undefined}
            onClick={() => onSelect(index)}
            className="relative flex size-11 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block rounded-pill border-2 border-border-strong transition-[width,height,background-color] duration-[var(--duration-fast)] motion-reduce:transition-none",
                index === current
                  ? "size-4 bg-accent-lime"
                  : cn(
                      "size-3",
                      index % 2 === 1 ? "bg-surface-card" : "bg-accent-pink",
                    ),
              )}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
