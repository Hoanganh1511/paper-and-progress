import { Skeleton } from "@/design-system";

/** The sidebar stays on screen (it is in the layout), so this is only the page's own shape: the hero, the bar of groups and the panel of cards. */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5 md:gap-6">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-pill" />
      <div className="rounded-soft border-2 border-border-strong p-5 sm:p-7">
        <Skeleton className="mb-6 h-12 w-full" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
