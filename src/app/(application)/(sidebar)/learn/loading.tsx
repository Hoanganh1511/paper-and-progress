import { Skeleton } from "@/design-system";

/** The sidebar stays on screen (it is in the layout), so this is only the page's own shape: the hero and the folder tabs with their panel. */
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 md:gap-5">
      <span role="status" className="sr-only">
        Đang tải nội dung học tập
      </span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-12 w-full xl:w-[28.125rem]" />
      </div>
      <div className="flex flex-col">
        <div className="flex gap-1">
          <Skeleton className="h-14 flex-1 sm:w-40 sm:flex-none" />
          <Skeleton className="h-14 flex-1 sm:w-40 sm:flex-none" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
