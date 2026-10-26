"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Play } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { Image } from "../Image";

// Class names are written out in full so Tailwind can detect them statically.
const embedFrameVariants = cva("relative block w-full overflow-hidden bg-ink", {
  variants: {
    aspectRatio: {
      video: "aspect-video",
      square: "aspect-square",
      wide: "aspect-[21/9]",
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

/** Hosts an embed may come from unless `allowedHosts` says otherwise. */
export const DEFAULT_EMBED_HOSTS = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
];

const DEFAULT_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
const DEFAULT_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups";

function isAllowedSource(src: string, allowedHosts: string[]) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
}

export interface MediaEmbedProps
  extends
    Omit<ComponentProps<"iframe">, "title" | "src" | "children">,
    VariantProps<typeof embedFrameVariants> {
  /** The embed URL (for example https://www.youtube-nocookie.com/embed/ID). Must be https. */
  src: string;
  /** Accessible name of the embedded content. */
  title: string;
  /** Hosts the embed may come from. Anything else is not loaded. */
  allowedHosts?: string[];
  /** Show a play button first and only load the third-party page when it is pressed. */
  loadOnDemand?: boolean;
  /** Preview image of the play button (used with `loadOnDemand`). */
  poster?: string;
  /** `{title}` is replaced with `title`. */
  loadLabel?: string;
  /** Shown instead of the embed when `src` is not allowed. */
  fallback?: ReactNode;
  /** Class for the frame; `className` styles the <iframe>. */
  frameClassName?: string;
}

/**
 * A responsive third-party embed (video, map, ...). It refuses sources that
 * are not https URLs on an allowed host, gives the iframe a title, lazy-loads
 * it, limits what it may do with `sandbox` and trims the referrer. With
 * `loadOnDemand`, nothing from the provider loads until the user asks.
 * `ref` goes to the <iframe>.
 */
export function MediaEmbed({
  src,
  title,
  aspectRatio,
  radius,
  allowedHosts = DEFAULT_EMBED_HOSTS,
  loadOnDemand = false,
  poster,
  loadLabel = "Load video: {title}",
  fallback,
  frameClassName,
  className,
  allow = DEFAULT_ALLOW,
  sandbox = DEFAULT_SANDBOX,
  referrerPolicy = "strict-origin-when-cross-origin",
  loading = "lazy",
  allowFullScreen = true,
  ref,
  ...props
}: MediaEmbedProps) {
  const [isRequested, setIsRequested] = useState(false);

  if (!isAllowedSource(src, allowedHosts)) {
    return (
      <div
        role="note"
        className={cn(
          embedFrameVariants({ aspectRatio, radius }),
          "flex items-center justify-center bg-surface-sunken p-4 text-center font-body text-body-md text-text-secondary",
          frameClassName,
        )}
      >
        {fallback ?? "This content cannot be shown."}
      </div>
    );
  }

  const shouldLoad = !loadOnDemand || isRequested;

  return (
    <div
      className={cn(
        embedFrameVariants({ aspectRatio, radius }),
        frameClassName,
      )}
    >
      {shouldLoad ? (
        <iframe
          ref={ref}
          src={src}
          title={title}
          allow={allow}
          sandbox={sandbox}
          referrerPolicy={referrerPolicy}
          loading={loading}
          allowFullScreen={allowFullScreen}
          className={cn("absolute inset-0 size-full border-0", className)}
          {...props}
        />
      ) : (
        <button
          type="button"
          aria-label={loadLabel.replace("{title}", title)}
          className={cn(
            "group absolute inset-0 flex size-full cursor-pointer items-center justify-center",
            focusRingClasses,
          )}
          onClick={() => setIsRequested(true)}
        >
          {poster && (
            <Image
              src={poster}
              alt=""
              aspectRatio="video"
              radius="none"
              frameClassName="absolute inset-0 size-full"
            />
          )}
          <span className="relative flex size-16 items-center justify-center rounded-pill bg-surface-card text-text-primary shadow-floating transition-transform duration-[var(--duration-fast)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Play aria-hidden="true" size={28} className="ml-1" />
          </span>
        </button>
      )}
    </div>
  );
}
