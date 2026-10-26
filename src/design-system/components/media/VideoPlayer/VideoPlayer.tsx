"use client";

import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { usePrefersReducedMotion } from "../../../hooks/usePrefersReducedMotion";

// Class names are written out in full so Tailwind can detect them statically.
const videoPlayerVariants = cva("block w-full bg-ink", {
  variants: {
    aspectRatio: {
      video: "aspect-video",
      square: "aspect-square",
      wide: "aspect-[21/9]",
      auto: "",
    },
    radius: {
      none: "rounded-none",
      sharp: "rounded-sharp",
      standard: "rounded-standard",
      soft: "rounded-soft",
    },
  },
  defaultVariants: {
    aspectRatio: "video",
    radius: "standard",
  },
});

export interface VideoTrack {
  src: string;
  /** Language code of the text, e.g. "en" or "vi". */
  srcLang: string;
  /** Name shown in the captions menu. */
  label: string;
  kind?: "captions" | "subtitles" | "descriptions";
  isDefault?: boolean;
}

export interface VideoPlayerProps
  extends
    Omit<ComponentProps<"video">, "title" | "controls">,
    VariantProps<typeof videoPlayerVariants> {
  /** Accessible name of the player. */
  title: string;
  /** Caption / subtitle files. Provide at least one captions track for spoken content. */
  tracks?: VideoTrack[];
}

/**
 * A native <video> with the browser's own accessible controls (keyboard,
 * captions menu, fullscreen). It preloads only metadata, and `autoPlay` is
 * ignored when the user prefers reduced motion. `className` and `ref` apply
 * to the <video>.
 */
export function VideoPlayer({
  title,
  tracks = [],
  aspectRatio,
  radius,
  autoPlay,
  preload = "metadata",
  className,
  children,
  src,
  ref,
  ...props
}: VideoPlayerProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <video
      ref={ref}
      src={src}
      controls
      aria-label={title}
      preload={preload}
      autoPlay={autoPlay && !prefersReducedMotion}
      className={cn(videoPlayerVariants({ aspectRatio, radius }), className)}
      {...props}
    >
      {tracks.map((track) => (
        <track
          key={`${track.srcLang}-${track.kind ?? "captions"}-${track.src}`}
          src={track.src}
          srcLang={track.srcLang}
          label={track.label}
          kind={track.kind ?? "captions"}
          default={track.isDefault}
        />
      ))}
      {children ??
        (typeof src === "string" && src && (
          <p>
            Your browser cannot play this video.{" "}
            <a href={src}>Download it instead</a>.
          </p>
        ))}
    </video>
  );
}
