"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ImageOff } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";

// Class names are written out in full so Tailwind can detect them statically.
const imageFrameVariants = cva(
  "relative block overflow-hidden bg-border-subtle",
  {
    variants: {
      aspectRatio: {
        auto: "",
        square: "aspect-square",
        video: "aspect-video",
        portrait: "aspect-[3/4]",
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
      aspectRatio: "auto",
      radius: "standard",
    },
  },
);

const imageFitVariants = cva("", {
  variants: {
    fit: {
      cover: "object-cover",
      contain: "object-contain",
    },
  },
  defaultVariants: {
    fit: "cover",
  },
});

export interface ImageProps
  extends
    Omit<ComponentProps<"img">, "alt" | "src">,
    VariantProps<typeof imageFrameVariants>,
    VariantProps<typeof imageFitVariants> {
  src: string;
  /** Describes the image. Pass an empty string for a purely decorative one. */
  alt: string;
  /** Shown instead of the image if it fails to load. */
  fallback?: ReactNode;
  /** Class for the wrapping frame; `className` styles the <img> itself. */
  frameClassName?: string;
}

/**
 * An <img> in a frame with a fixed aspect ratio, rounded corners and a
 * placeholder tint while it loads. It is lazy-loaded by default and falls
 * back to an icon (still labelled with `alt`) when the file cannot load.
 * `ref` goes to the <img>.
 */
export function Image({
  src,
  alt,
  aspectRatio,
  radius,
  fit,
  fallback,
  frameClassName,
  className,
  loading = "lazy",
  decoding = "async",
  onLoad,
  onError,
  ref,
  ...props
}: ImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const mergedRef = useMemo(() => mergeRefs(imgRef, ref), [ref]);
  // Status is tied to the src it was measured for, so changing src starts fresh.
  const [loadedSrc, setLoadedSrc] = useState<string>();
  const [failedSrc, setFailedSrc] = useState<string>();
  const isLoaded = loadedSrc === src;
  const hasFailed = failedSrc === src;

  // An image that finished loading before hydration never fires onLoad.
  useEffect(() => {
    const image = imgRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoadedSrc(src);
  }, [src]);

  return (
    <span
      className={cn(
        imageFrameVariants({ aspectRatio, radius }),
        !isLoaded && !hasFailed && "animate-pulse motion-reduce:animate-none",
        hasFailed && (aspectRatio ?? "auto") === "auto" && "min-h-24",
        frameClassName,
      )}
    >
      {hasFailed ? (
        <span
          {...(alt
            ? { role: "img", "aria-label": alt }
            : { "aria-hidden": true })}
          className="absolute inset-0 flex items-center justify-center text-text-muted"
        >
          {fallback ?? <ImageOff aria-hidden="true" size={32} />}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a framework-free primitive
        <img
          ref={mergedRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          className={cn(
            (aspectRatio ?? "auto") === "auto" ? "h-auto w-full" : "size-full",
            imageFitVariants({ fit }),
            className,
          )}
          onLoad={(event) => {
            setLoadedSrc(src);
            onLoad?.(event);
          }}
          onError={(event) => {
            setFailedSrc(src);
            onError?.(event);
          }}
          {...props}
        />
      )}
    </span>
  );
}
