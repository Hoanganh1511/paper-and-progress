"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { Grid } from "../../../primitives/Grid";
import { Image, type ImageProps } from "../Image";
import { Lightbox, type LightboxItem, type LightboxLabels } from "../Lightbox";

export interface GalleryImage {
  /** Full-size image, shown in the viewer. */
  src: string;
  /** Smaller image for the grid; defaults to `src`. */
  thumbnailSrc?: string;
  alt: string;
  caption?: ReactNode;
}

export interface ImageGalleryLabels {
  /** `{alt}` is replaced with the image's alt text. */
  view: string;
}

export const defaultImageGalleryLabels: ImageGalleryLabels = {
  view: "View larger: {alt}",
};

export interface ImageGalleryProps extends Omit<
  ComponentProps<typeof Grid>,
  "columns" | "children"
> {
  images: GalleryImage[];
  /** Columns on desktop; it is 1 on mobile and 2 on tablet. */
  columns?: 2 | 3 | 4;
  aspectRatio?: ImageProps["aspectRatio"];
  /** Replace the texts of the gallery or of its viewer (translations). */
  labels?: Partial<ImageGalleryLabels> & {
    lightbox?: Partial<LightboxLabels>;
  };
}

/**
 * A grid of thumbnails. Each is a button that opens the full-size picture in
 * a Lightbox, where the user can step through the rest. Closing the viewer
 * puts focus back on the thumbnail that opened it.
 */
export function ImageGallery({
  images,
  columns = 3,
  aspectRatio = "square",
  labels: labelOverrides,
  className,
  ...props
}: ImageGalleryProps) {
  const { lightbox: lightboxLabels, ...galleryLabels } = labelOverrides ?? {};
  const labels = { ...defaultImageGalleryLabels, ...galleryLabels };
  const [openIndex, setOpenIndex] = useState<number>();

  const lightboxItems: LightboxItem[] = images.map(({ src, alt, caption }) => ({
    src,
    alt,
    caption,
  }));

  return (
    <>
      <Grid
        role="list"
        columns={columns}
        gap={3}
        className={cn(className)}
        {...props}
      >
        {images.map((image, index) => (
          <div key={image.src} role="listitem">
            <button
              type="button"
              aria-label={labels.view.replace("{alt}", image.alt)}
              className={cn(
                "group relative block w-full cursor-pointer overflow-hidden rounded-standard",
                focusRingClasses,
              )}
              onClick={() => setOpenIndex(index)}
            >
              <Image
                src={image.thumbnailSrc ?? image.src}
                alt=""
                aspectRatio={aspectRatio}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-black/0 transition-colors duration-[var(--duration-fast)] group-hover:bg-black/10 motion-reduce:transition-none"
              />
            </button>
          </div>
        ))}
      </Grid>
      <Lightbox
        open={openIndex !== undefined}
        onClose={() => setOpenIndex(undefined)}
        items={lightboxItems}
        index={openIndex ?? 0}
        onIndexChange={setOpenIndex}
        labels={lightboxLabels}
      />
    </>
  );
}
