import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton, cn } from "@/design-system";

export interface CarouselControlsProps {
  count: number;
  current: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}

/**
 * Previous, the dots, next. Nothing is shown for a single slide. The current
 * dot is larger as well as lime, so it never depends on colour alone.
 */
export function CarouselControls({
  count,
  current,
  onPrevious,
  onNext,
  onSelect,
}: CarouselControlsProps) {
  if (count <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <IconButton
        icon={ChevronLeft}
        variant="outline"
        size="compact"
        aria-label="Nhóm series trước"
        onClick={onPrevious}
      />
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
                    ? "h-4 w-6 bg-accent-lime"
                    : "size-3 bg-surface-card",
                )}
              />
            </button>
          </li>
        ))}
      </ul>
      <IconButton
        icon={ChevronRight}
        variant="outline"
        size="compact"
        aria-label="Nhóm series tiếp theo"
        onClick={onNext}
      />
    </div>
  );
}
