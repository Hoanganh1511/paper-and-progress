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
          <Skeleton className="h-11 w-full max-w-md rounded-pill" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rect"
                className="aspect-[3/4] h-auto w-[75vw] shrink-0 rounded-soft sm:w-60"
              />
            ))}
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
