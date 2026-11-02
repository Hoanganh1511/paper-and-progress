import { ArticleEditorPage } from "@/features/articles/editor/ArticleEditorPage";

export default async function EditArticlePage({
  params,
}: PageProps<"/write/[id]">) {
  const { id } = await params;
  return <ArticleEditorPage id={id} />;
}
