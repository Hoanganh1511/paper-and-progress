import { Newspaper } from "lucide-react";

export interface LatestArticlesHeaderProps {
  titleId: string;
}

/** The icon and the title of the module. */
export function LatestArticlesHeader({ titleId }: LatestArticlesHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink">
        <Newspaper aria-hidden="true" size={22} />
      </span>
      <h2
        id={titleId}
        className="font-display text-heading-md font-bold text-text-primary"
      >
        Hoạt động gần đây
      </h2>
    </div>
  );
}
