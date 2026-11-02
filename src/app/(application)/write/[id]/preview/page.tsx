import { ArticlePreview } from "@/features/articles/editor/ArticlePreview";

export default async function PreviewArticlePage({
  params,
}: PageProps<"/write/[id]/preview">) {
  const { id } = await params;
  return <ArticlePreview id={id} />;
}
