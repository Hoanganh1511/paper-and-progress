import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <PageContainer size="wide" spacing="compact" className="md:py-3">
        <Stack gap={5}>
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </Stack>
      </PageContainer>
    </main>
  );
}
