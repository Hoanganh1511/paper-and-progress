export interface SearchGroup<T> {
  total: number;
  items: T[];
}

export interface SearchResults {
  query: string;
  topics: SearchGroup<{
    slug: string;
    name: string;
    icon: string | null;
    categoryName: string;
  }>;
  resources: SearchGroup<{
    id: string;
    title: string;
    url: string;
    topic: { slug: string; name: string };
  }>;
  articles: SearchGroup<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    articleType: string;
    author: string;
  }>;
  paths: SearchGroup<{
    slug: string;
    title: string;
    description: string;
  }>;
}
