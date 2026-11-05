import { Newspaper } from "lucide-react";

export interface LatestArticlesHeaderProps {
  titleId: string;
}

/** The icon, the title and the line under it; made to sit on the module's dark surface. */
export function LatestArticlesHeader({ titleId }: LatestArticlesHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink">
          <Newspaper aria-hidden="true" size={22} />
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-heading-md font-bold text-white"
          >
            Bài viết mới nhất
          </h2>
          <p className="text-body-sm text-white/80">
            Khám phá các series nổi bật, mỗi series kèm 3 bài đầu tiên.
          </p>
        </div>
      </div>
    </div>
  );
}
