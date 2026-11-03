import { ArticleEditorPage } from "@/features/articles/editor/ArticleEditorPage";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * `/write/new?list=…&section=…` is a new article for a part of a study list:
 * it joins that part as a step the first time it is saved.
 */
export default async function NewArticlePage({
  searchParams,
}: PageProps<"/write/new">) {
  const params = await searchParams;
  const listId = first(params.list);
  const sectionId = first(params.section);
  return (
    <ArticleEditorPage
      addToSection={listId && sectionId ? { listId, sectionId } : undefined}
    />
  );
}
