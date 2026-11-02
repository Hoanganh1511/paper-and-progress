import { Skeleton, Stack } from "@/design-system";

/** The sidebar stays on screen (it is in the layout), so this is only the calendar's shape. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <Stack gap={5}>
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </Stack>
    </div>
  );
}
