import { Container, Grid, Skeleton, Stack } from "@/design-system";

export default function Loading() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải nội dung học tập
      </span>
      <div className="border-b border-border-default">
        <Container size="wide" className="flex h-11 items-center gap-6">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </Container>
      </div>
      <Container
        size="wide"
        className="grid gap-10 py-8 md:grid-cols-[13rem_1fr]"
      >
        <Stack gap={2} className="hidden md:flex">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </Stack>
        <Stack gap={12}>
          {Array.from({ length: 2 }, (_, section) => (
            <Stack key={section} gap={4}>
              <Skeleton className="h-7 w-48" />
              <Grid columns={3} gap={4}>
                {Array.from({ length: 3 }, (_, card) => (
                  <Skeleton key={card} variant="rect" className="h-40" />
                ))}
              </Grid>
            </Stack>
          ))}
        </Stack>
      </Container>
    </div>
  );
}
