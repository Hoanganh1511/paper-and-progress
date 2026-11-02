import { Skeleton } from "@/design-system";

/** The sidebar stays on screen (it is in the layout), so this is only the page's own shape: the articles, the goals and resources, and the day's log. */
export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
    >
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <div className="flex flex-col gap-6 max-lg:order-2">
        <Skeleton className="h-[34rem] w-full" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
      <Skeleton className="h-96 w-full max-lg:order-1 lg:h-[min(80dvh,40rem)]" />
    </div>
  );
}
