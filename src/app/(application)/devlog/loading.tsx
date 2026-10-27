import { PageContainer, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <main aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải devlog
      </span>
      <PageContainer size="wide" spacing="spacious">
        <Stack gap={8}>
          <Stack gap={2}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-40" />
          </Stack>
          <div className="grid items-start gap-8 lg:grid-cols-[18rem_1fr]">
            <Skeleton variant="rect" className="h-80 rounded-standard" />
            <Stack gap={6}>
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton
                  key={index}
                  variant="rect"
                  className="h-44 rounded-standard"
                />
              ))}
            </Stack>
          </div>
        </Stack>
      </PageContainer>
    </main>
  );
}
