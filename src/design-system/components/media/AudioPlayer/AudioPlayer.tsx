"use client";

import { type ComponentProps, type ReactNode } from "react";
import { Music } from "lucide-react";
import { cn } from "../../../utils/cn";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";
import { Text } from "../../../primitives/Text";

export interface AudioPlayerProps extends Omit<
  ComponentProps<"audio">,
  "title" | "controls"
> {
  /** Shown above the player and used as its accessible name. */
  title: string;
  /** Artist, episode, duration, ... */
  description?: ReactNode;
  /** Link to a text transcript of the audio. */
  transcriptHref?: string;
  transcriptLabel?: string;
  /** Class for the card around the player; `className` styles the <audio>. */
  cardClassName?: string;
}

/**
 * A card with a title and a native <audio> that keeps the browser's own
 * accessible controls. `autoPlay` is ignored when the user prefers reduced
 * motion. `ref` goes to the <audio>.
 */
export function AudioPlayer({
  title,
  description,
  transcriptHref,
  transcriptLabel = "Read the transcript",
  cardClassName,
  autoPlay,
  preload = "metadata",
  className,
  children,
  src,
  ref,
  ...props
}: AudioPlayerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-standard border border-border-subtle bg-surface-card p-4",
        cardClassName,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-text-muted">
          <Music aria-hidden="true" size={20} />
        </span>
        <div className="min-w-0">
          <Text weight="medium" className="truncate">
            {title}
          </Text>
          {description && (
            <Text size="body-sm" color="muted" className="truncate">
              {description}
            </Text>
          )}
        </div>
      </div>
      <audio
        ref={ref}
        src={src}
        controls
        aria-label={title}
        preload={preload}
        autoPlay={autoPlay && !prefersReducedMotion}
        className={cn("w-full", className)}
        {...props}
      >
        {children ??
          (typeof src === "string" && src && (
            <p>
              Your browser cannot play this audio.{" "}
              <a href={src}>Download it instead</a>.
            </p>
          ))}
      </audio>
      {transcriptHref && (
        <a
          href={transcriptHref}
          className="w-fit rounded-sharp font-body text-body-sm font-medium text-text-primary underline underline-offset-4"
        >
          {transcriptLabel}
        </a>
      )}
    </div>
  );
}
