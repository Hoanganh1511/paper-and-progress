import { fetchArticleList, type ArticleCardData } from "@/features/articles";
import { LatestArticles, type LatestArticlesProps } from "./LatestArticles";
import { MAX_ARTICLES } from "./carouselLayout";

/**
 * Reads the newest published articles on the server and shows them. A failed
 * read becomes the showcase's own error state, not an error of the whole page.
 * The list is the one the Articles page uses: published only, newest first, and
 * without the text of any article.
 */
export async function LatestArticlesSection(
  props: Omit<LatestArticlesProps, "articles">,
) {
  let articles: ArticleCardData[] | null;
  try {
    articles = (await fetchArticleList({ limit: String(MAX_ARTICLES) })).items;
  } catch {
    articles = null;
  }
  return <LatestArticles articles={articles} {...props} />;
}
