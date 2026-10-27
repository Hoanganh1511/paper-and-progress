import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải bookmark
      </span>
      <PageContainer size="wide" spacing="spacious">
        <Stack gap={8}>
          <Stack gap={2}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-48" />
          </Stack>
          <div className="grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
            <div className="hidden flex-col gap-3 lg:flex">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
            <Stack gap={4}>
              <Skeleton className="h-11 w-full" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton
                    key={index}
                    variant="rect"
                    className="h-72 rounded-standard"
                  />
                ))}
              </div>
            </Stack>
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
