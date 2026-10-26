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
          <Skeleton className="h-11 w-full max-w-xl rounded-pill" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {Array.from({ length: 20 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rect"
                className="aspect-square rounded-standard"
              />
            ))}
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
