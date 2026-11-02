import { Text } from "@/design-system";
import { LearningSearch } from "../LearningSearch";
import { PandaCoder, Ticks } from "@/features/decor";

/**
 * The top of the knowledge library, straight on the page and not in a card,
 * and kept low so the content under it starts high on the screen. From `xl` it
 * is one short row: the title with its yellow flicks and the one-line summary,
 * a small panda at a laptop on a soft lime patch in the middle, and the search
 * at the right, level with them. Below `xl` the panda sits beside the title,
 * smaller, and the search goes full width underneath.
 */
export function LibraryHero() {
  return (
    <header
      lang="vi"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 xl:grid-cols-[minmax(0,1fr)_auto_28.125rem] xl:gap-x-6"
    >
      <div className="relative col-start-1 row-start-1 flex min-w-0 flex-col gap-1">
        <Ticks className="absolute right-full bottom-full -mr-1 -mb-1 hidden h-12 w-14 sm:block" />
        <Text
          as="h1"
          font="display"
          weight="bold"
          className="text-[1.625rem] leading-tight text-text-primary sm:text-4xl xl:text-[2.25rem]"
        >
          Thư viện kiến thức
        </Text>
        <Text
          size="body-sm"
          color="secondary"
          className="max-w-[72ch] max-sm:text-xs"
        >
          Khám phá kiến thức theo lĩnh vực, rồi đi qua từng phân loại và chủ đề.
        </Text>
      </div>
      <div
        aria-hidden="true"
        className="relative col-start-2 row-start-1 flex items-center justify-center justify-self-end"
      >
        {/* The soft lime patch the panda sits on. */}
        <span className="absolute inset-x-0 top-[22%] bottom-[-0.25rem] rounded-[45%] bg-accent-lime/45 xl:inset-x-[-0.75rem]" />
        <PandaCoder className="relative h-14 w-auto sm:h-20 xl:h-24" />
      </div>
      <div className="relative col-span-2 row-start-2 xl:col-span-1 xl:col-start-3 xl:row-start-1">
        <Ticks
          corner="top-right"
          className="absolute bottom-full left-full -mb-1 -ml-2 hidden h-10 w-12 xl:block"
        />
        <LearningSearch variant="hero" />
      </div>
    </header>
  );
}
