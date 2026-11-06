import { ArticleEditorPage } from "@/features/articles/editor/ArticleEditorPage";
import { SplitArticleEditors } from "@/features/articles/editor/SplitArticleEditors";

export default async function EditArticlePage({
  params,
  searchParams,
}: PageProps<"/write/[id]">) {
  const { id } = await params;
  const { with: other } = await searchParams;
  const rightId = typeof other === "string" && other !== id ? other : undefined;
  if (rightId) {
    return <SplitArticleEditors leftId={id} rightId={rightId} />;
  }
  return <ArticleEditorPage id={id} />;
}
