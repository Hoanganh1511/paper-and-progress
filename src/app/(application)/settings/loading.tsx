import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải cài đặt
      </span>
      <PageContainer size="wide" spacing="spacious">
        <Stack gap={6}>
          <Stack gap={2}>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </Stack>
          <Skeleton className="h-11 w-full" />
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rect"
                className="h-96 rounded-standard"
              />
            ))}
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
