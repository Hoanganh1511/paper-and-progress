import { ArticleEditorPage } from "@/features/articles/editor/ArticleEditorPage";
import { StudySeriesNav } from "@/features/articles/editor/StudySeriesNav";
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
  return (
    <StudySeriesNav articleId={id}>
      {/* The id is the key: another lesson starts its editor over. */}
      <ArticleEditorPage key={id} id={id} />
    </StudySeriesNav>
  );
}
