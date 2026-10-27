import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <PageContainer size="wide" spacing="spacious">
        <Stack gap={8}>
          <Stack gap={2}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-72" />
          </Stack>
          <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <Skeleton className="h-64 w-full rounded-standard" />
            <Stack gap={5}>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-32 w-full rounded-standard" />
              <Skeleton className="h-48 w-full rounded-standard" />
            </Stack>
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
