import { Skeleton } from "@/design-system";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:h-[calc(100dvh-var(--app-header-height,4rem))] lg:overflow-hidden"
    >
      <span role="status" className="sr-only">
        Đang tải English Diary
      </span>
      <Skeleton className="h-7 w-40" />
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[5fr_7fr]">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton
            key={index}
            variant="rect"
            className="h-64 rounded-standard lg:h-full"
          />
        ))}
      </div>
    </main>
  );
}
