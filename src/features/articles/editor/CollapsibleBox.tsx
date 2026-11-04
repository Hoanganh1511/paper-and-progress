"use client";

import { useId, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { Text, cn } from "@/design-system";

export interface CollapsibleBoxProps {
  title: string;
  /** Shown beside the title, e.g. a status badge. */
  headerExtra?: ReactNode;
  /** Open on first render. */
  isDefaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A card of the editor's side column with a −/+ button to fold it. The content
 * stays mounted while folded, so what was typed in it is not lost.
 */
export function CollapsibleBox({
  title,
  headerExtra,
  isDefaultOpen = true,
  className,
  children,
}: CollapsibleBoxProps) {
  const [isOpen, setIsOpen] = useState(isDefaultOpen);
  const titleId = useId();
  const bodyId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "rounded-standard border-2 border-border-strong bg-surface-card shadow-raised",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 py-1 pr-1 pl-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Text
            as="h2"
            id={titleId}
            size="body-md"
            weight="bold"
            className="font-display"
          >
            {title}
          </Text>
          {headerExtra}
        </div>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          aria-label={isOpen ? `Thu gọn: ${title}` : `Mở rộng: ${title}`}
          title={isOpen ? "Thu gọn" : "Mở rộng"}
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sharp hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus motion-reduce:transition-none"
        >
          {isOpen ? (
            <Minus aria-hidden="true" size={18} />
          ) : (
            <Plus aria-hidden="true" size={18} />
          )}
        </button>
      </div>
      <div
        id={bodyId}
        hidden={!isOpen}
        className="flex flex-col gap-4 px-4 pb-4"
      >
        {children}
      </div>
    </section>
  );
}
