import { fetchArticleList, type ArticleCardData } from "@/features/articles";
import { LibraryArticles } from "./LibraryArticles";

/** How many of the newest articles the library shows before the link to all of them. */
export const LIBRARY_ARTICLE_COUNT = 3;

/**
 * Reads the newest published articles on the server (the list the Articles page
 * uses: published only, newest first, no article text) and shows them. A failed
 * read becomes this section's own error, not an error of the library.
 */
export async function LibraryArticlesSection() {
  let articles: ArticleCardData[] | null;
  try {
    articles = (
      await fetchArticleList({ limit: String(LIBRARY_ARTICLE_COUNT) })
    ).items;
  } catch {
    articles = null;
  }
  return <LibraryArticles articles={articles} />;
}
