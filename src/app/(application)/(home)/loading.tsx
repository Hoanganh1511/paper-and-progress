import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <PageContainer size="wide" spacing="spacious">
        <Stack gap={6}>
          <Skeleton className="h-8 w-72" />
          <ul className="-ml-6 flex max-w-[19rem] flex-wrap gap-x-2 gap-y-1 sm:max-w-[19.5rem] sm:gap-x-3 sm:gap-y-2 lg:-ml-5 lg:max-w-[35.5rem]">
            {Array.from({ length: 15 }, (_, index) => (
              <li
                key={index}
                className="flex w-24 flex-col items-center gap-1.5 p-1.5 lg:w-26"
              >
                <Skeleton
                  variant="circle"
                  className="size-12 sm:size-12 lg:size-16"
                />
                <Skeleton className="h-3 w-14" />
              </li>
            ))}
          </ul>
        </Stack>
      </PageContainer>
    </main>
  );
}
