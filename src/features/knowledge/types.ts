export interface DomainSummary {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  categoryCount: number;
  topicCount: number;
}

export interface TopicCard {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  groupLabel: string | null;
  articleCount: number;
  pathCount: number;
  resourceCount: number;
}

export interface CategoryDetail {
  category: {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    isDomain: boolean;
  };
  breadcrumb: { slug: string; name: string }[];
  subcategories: {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    topicCount: number;
  }[];
  groups: string[];
  topics: TopicCard[];
}

export interface TopicDetail {
  topic: {
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    groupLabel: string | null;
  };
  breadcrumb: { slug: string; name: string }[];
  counts: { articles: number; paths: number; resources: number };
  isFollowing: boolean;
  resources: {
    id: string;
    title: string;
    url: string;
    description: string | null;
    isExternal: boolean;
  }[];
  paths: {
    slug: string;
    title: string;
    description: string;
    phaseCount: number;
    stepCount: number;
  }[];
  recentArticles: {
    slug: string;
    title: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    readingMinutes: number | null;
    publishedAt: string | null;
    author: string;
  }[];
}

export interface FollowedTopic {
  slug: string;
  name: string;
  icon: string | null;
  categoryName: string;
  followedAt: string;
}
