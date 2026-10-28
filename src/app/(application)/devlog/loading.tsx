import { Skeleton } from "@/design-system";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="flex h-[calc(100dvh-var(--app-header-height,4rem))] flex-col gap-3 overflow-hidden px-4 py-3 sm:px-6"
    >
      <span role="status" className="sr-only">
        Đang tải devlog
      </span>
      <Skeleton className="h-7 w-40" />
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[16rem_1fr_1.2fr]">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton
            key={index}
            variant="rect"
            className="h-full rounded-standard"
          />
        ))}
      </div>
    </main>
  );
}
