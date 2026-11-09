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
      // A fresh key for every visit. The first save moves the address to the
      // new article without leaving this page, so without it a later visit to
      // "new article" would reuse the editor, and its fields, of the last one.
      key={crypto.randomUUID()}
      addToSection={listId && sectionId ? { listId, sectionId } : undefined}
    />
  );
}
