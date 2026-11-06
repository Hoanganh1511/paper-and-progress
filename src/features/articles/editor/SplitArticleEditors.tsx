"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { buttonVariants, cn } from "@/design-system";
import { ArticleEditorPage } from "./ArticleEditorPage";

export interface SplitArticleEditorsProps {
  leftId: string;
  rightId: string;
}

function Pane({
  id,
  closeHref,
  label,
}: {
  id: string;
  closeHref: string;
  label: string;
}) {
  return (
    // From lg up each pane is as tall as the screen and scrolls on its own.
    <section
      aria-label={label}
      className="flex min-w-0 flex-col gap-3 lg:h-[calc(100dvh-var(--app-header-height,4rem)-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-standard lg:border-2 lg:border-border-strong lg:p-4"
    >
      <div className="flex justify-end">
        <Link
          href={closeHref}
          aria-label={`Đóng ${label.toLowerCase()}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "compact" }),
          )}
        >
          <X aria-hidden="true" size={16} />
          Đóng
        </Link>
      </div>
      {/* The id is the key: opening another article starts that editor over. */}
      <ArticleEditorPage key={id} id={id} />
    </section>
  );
}

/**
 * Two articles open at once, each its own editor with its own autosave. Closing
 * a pane leaves the other one open on its own address.
 */
export function SplitArticleEditors({
  leftId,
  rightId,
}: SplitArticleEditorsProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Pane id={leftId} label="Bài bên trái" closeHref={`/write/${rightId}`} />
      <Pane id={rightId} label="Bài bên phải" closeHref={`/write/${leftId}`} />
    </div>
  );
}
