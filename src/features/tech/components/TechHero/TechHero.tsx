import { Breadcrumbs, Text } from "@/design-system";
import { PandaCoder, Ticks } from "@/features/decor";

export interface TechHeroProps {
  /** The path above the title; the last item is the page itself. */
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  description: string;
}

/**
 * The top of the IT knowledge page, straight on the page: the path, the title
 * with yellow flicks off its end, a line on what to do here, and a panda at a
 * laptop on a soft lime patch at the right.
 */
export function TechHero({ breadcrumbs, title, description }: TechHeroProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      <div className="flex min-w-0 flex-col gap-1">
        <Breadcrumbs label="Đường dẫn" items={breadcrumbs} />
        <div className="relative w-fit max-w-full">
          <Text
            as="h1"
            font="display"
            weight="bold"
            className="text-[1.75rem] leading-tight text-text-primary sm:text-4xl xl:text-[2.5rem]"
          >
            {title}
          </Text>
          <Ticks
            corner="top-right"
            className="absolute bottom-full left-full -mb-2 -ml-1 hidden h-12 w-14 sm:block"
          />
        </div>
        <Text size="body-md" color="secondary" className="max-w-[70ch]">
          {description}
        </Text>
      </div>
      <div
        aria-hidden="true"
        className="relative flex items-center justify-center"
      >
        <span className="absolute inset-x-0 top-[22%] bottom-[-0.25rem] rounded-[45%] bg-accent-lime/45 xl:inset-x-[-1rem]" />
        <PandaCoder className="relative h-16 w-auto sm:h-24 xl:h-32" />
      </div>
    </header>
  );
}
