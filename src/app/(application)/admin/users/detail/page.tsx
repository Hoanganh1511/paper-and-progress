import { UserDetailScreen } from "@/features/admin";

// The id is a query parameter, not a path segment: a dynamic segment would make
// the root layout (header, footer) read an unknown pathname at build time.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return id ? (
    <UserDetailScreen userId={id} />
  ) : (
    <p role="alert">Thiếu id user.</p>
  );
}
