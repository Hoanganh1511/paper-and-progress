import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type {
  ArticleCardData,
  ArticleResult,
  FullArticle,
  PreviewArticle,
} from "../types";

expect.extend(toHaveNoViolations);

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/articles/hello",
}));

let auth = { isAuthenticated: false, isLoading: false, user: null as unknown };
vi.mock("@/features/auth", async () => ({
  ...(await vi.importActual<typeof import("@/features/auth/authRedirect")>(
    "@/features/auth/authRedirect",
  )),
  useAuth: () => auth,
}));

const api = vi.hoisted(() => ({
  getFullArticle: vi.fn(),
  getEngagement: vi.fn(),
  react: vi.fn(),
  unreact: vi.fn(),
  bookmark: vi.fn(),
  unbookmark: vi.fn(),
  listComments: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  trackScroll: vi.fn(),
  fetchArticlePage: vi.fn(),
}));
vi.mock("../articlesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../articlesApi")>()),
  ...api,
}));

import { articleJsonLd } from "./JsonLd";
import { ArticleCard } from "./ArticleCard";
import { ArticleList } from "./ArticleList";
import { ArticleReader } from "./ArticleReader";
import { CommentThread, linkify } from "./CommentThread";
import { GatedOverlay } from "./GatedOverlay";
import { ReadingProgress, scrollPercent } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";

const card = (overrides: Partial<ArticleCardData> = {}): ArticleCardData => ({
  id: "a1",
  slug: "hello",
  title: "Hello world",
  excerpt: "A short intro",
  coverImageUrl: null,
  readingMinutes: 3,
  visibility: "PUBLIC",
  status: "PUBLISHED",
  publishedAt: "2026-11-01T09:00:00.000Z",
  viewCount: 0,
  seriesOrder: null,
  author: { id: "u1", displayName: "An" },
  tags: [{ name: "NestJS", slug: "nestjs" }],
  series: null,
  ...overrides,
});

const full = (overrides: Partial<FullArticle> = {}): FullArticle => ({
  ...card(),
  series: null,
  related: [],
  authorId: "u1",
  scheduledAt: null,
  updatedAt: "2026-11-02T09:00:00.000Z",
  gated: false,
  contentHtml: "<h2>Mở đầu</h2><p>Toàn bộ nội dung bài viết.</p>",
  ...overrides,
});

const preview = (): PreviewArticle => {
  const { contentHtml: _html, gated: _gated, ...rest } = full();
  void _html;
  void _gated;
  return {
    ...rest,
    visibility: "PREVIEW",
    gated: true,
    fullAvailable: true,
    previewHtml: "<p>Đoạn đầu của bài.</p>",
  };
};

// jsdom has no IntersectionObserver (the table of contents uses one).
class FakeObserver {
  observe() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});
afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  auth = { isAuthenticated: false, isLoading: false, user: null };
  api.getEngagement.mockResolvedValue({
    counts: { LIKE: 2, LOVE: 0, INSIGHTFUL: 0, CELEBRATE: 0 },
    mine: [],
    isBookmarked: false,
  });
  api.listComments.mockResolvedValue([]);
});

describe("ArticleCard", () => {
  it("links the title, shows reading time, tags and a lock for non-public articles", async () => {
    const { container } = render(
      <ArticleCard article={card({ visibility: "MEMBERS_ONLY" })} />,
    );
    expect(screen.getByRole("link", { name: "Hello world" })).toHaveAttribute(
      "href",
      "/articles/hello",
    );
    expect(screen.getByText("3 phút đọc")).toBeInTheDocument();
    expect(screen.getByText("NestJS")).toBeInTheDocument();
    expect(screen.getByText("Thành viên")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ArticleList", () => {
  it("loads the next page with the same filters and hides the button at the end", async () => {
    api.fetchArticlePage.mockResolvedValue({
      items: [card({ id: "a2", slug: "second", title: "Second" })],
      nextCursor: null,
    });
    render(
      <ArticleList
        initial={{ items: [card()], nextCursor: "c1" }}
        query={{ tag: "nestjs" }}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Tải thêm bài viết" }),
    );
    expect(await screen.findByText("Second")).toBeInTheDocument();
    expect(api.fetchArticlePage).toHaveBeenCalledWith({
      tag: "nestjs",
      cursor: "c1",
    });
    expect(
      screen.queryByRole("button", { name: "Tải thêm bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(
      <ArticleList initial={{ items: [], nextCursor: null }} query={{}} />,
    );
    expect(screen.getByText("Chưa có bài viết nào")).toBeInTheDocument();
  });
});

describe("TableOfContents", () => {
  it("links each heading", async () => {
    const { container } = render(
      <TableOfContents
        items={[
          { id: "mo-dau", text: "Mở đầu", level: 2 },
          { id: "chi-tiet", text: "Chi tiết", level: 3 },
        ]}
      />,
    );
    expect(screen.getAllByRole("link", { name: "Mở đầu" })[0]).toHaveAttribute(
      "href",
      "#mo-dau",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("GatedOverlay", () => {
  it("shows the start of the text and asks the guest to sign in", () => {
    render(<GatedOverlay previewHtml="<p>Đoạn đầu</p>" />);
    expect(screen.getByText("Đoạn đầu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("members-only: only the excerpt, no text", () => {
    render(<GatedOverlay excerpt="Chỉ có tóm tắt" />);
    expect(screen.getByText("Chỉ có tóm tắt")).toBeInTheDocument();
    expect(screen.getByText(/dành cho thành viên/)).toBeInTheDocument();
  });
});

describe("ReadingProgress", () => {
  it("computes how far down the page the reader is", () => {
    expect(scrollPercent(0, 2000, 1000)).toBe(0);
    expect(scrollPercent(500, 2000, 1000)).toBe(50);
    expect(scrollPercent(5000, 2000, 1000)).toBe(100);
    expect(scrollPercent(0, 800, 1000)).toBe(100); // nothing to scroll
  });

  it("updates its progressbar on scroll", async () => {
    render(<ReadingProgress />);
    expect(
      screen.getByRole("progressbar", { name: "Tiến độ đọc" }),
    ).toBeInTheDocument();
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 500,
      configurable: true,
    });
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "50",
      ),
    );
  });
});

describe("articleJsonLd", () => {
  const url = "https://site.test/articles/hello";

  it("describes a public article as free, with dates and author", () => {
    const data = articleJsonLd({
      url,
      result: { kind: "full", article: full() },
    });
    expect(data).toMatchObject({
      "@type": "Article",
      headline: "Hello world",
      isAccessibleForFree: true,
      datePublished: "2026-11-01T09:00:00.000Z",
      author: { name: "An" },
      keywords: "NestJS",
    });
  });

  it("marks a preview or members-only article as not free (paywall markup)", () => {
    expect(
      articleJsonLd({ url, result: { kind: "preview", article: preview() } }),
    ).toMatchObject({
      isAccessibleForFree: false,
      hasPart: { isAccessibleForFree: false },
    });
    expect(
      articleJsonLd({
        url,
        result: { kind: "locked", article: { title: "T", excerpt: null } },
      }),
    ).toMatchObject({ isAccessibleForFree: false, headline: "T" });
  });
});

describe("ArticleReader", () => {
  const read = (
    result: Extract<ArticleResult, { kind: "full" | "preview" | "locked" }>,
  ) => render(<ArticleReader slug="hello" result={result} />);

  it("a guest sees a public article in full, with a table of contents and tracking", async () => {
    read({ kind: "full", article: full() });
    expect(screen.getByText("Toàn bộ nội dung bài viết.")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Mở đầu" }).length,
    ).toBeGreaterThan(0);
    expect(api.trackScroll).toHaveBeenCalledWith("a1", 0);
  });

  it("a guest on a preview article gets the cut text and the sign-in card, never the full text", () => {
    read({ kind: "preview", article: preview() });
    expect(screen.getByText("Đoạn đầu của bài.")).toBeInTheDocument();
    expect(screen.getByText("Đăng nhập để đọc tiếp")).toBeInTheDocument();
    expect(
      screen.queryByText("Toàn bộ nội dung bài viết."),
    ).not.toBeInTheDocument();
    expect(api.getFullArticle).not.toHaveBeenCalled();
    expect(api.trackScroll).not.toHaveBeenCalled();
  });

  it("a signed-in reader gets the full text fetched with their token, replacing the preview", async () => {
    auth = { isAuthenticated: true, isLoading: false, user: { id: "u9" } };
    api.getFullArticle.mockResolvedValue(full());
    read({ kind: "preview", article: preview() });
    expect(
      await screen.findByText("Toàn bộ nội dung bài viết."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Đăng nhập để đọc tiếp")).not.toBeInTheDocument();
    expect(api.getFullArticle).toHaveBeenCalledWith("hello");
  });

  it("a guest on a members-only article sees the title and excerpt only", () => {
    read({
      kind: "locked",
      article: { title: "Bài kín", excerpt: "Chỉ thành viên" },
    });
    expect(
      screen.getByRole("heading", { name: "Bài kín" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/dành cho thành viên/)).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Phản hồi bài viết" }),
    ).not.toBeInTheDocument();
  });

  it("a guest pressing a reaction is sent to sign in", async () => {
    read({ kind: "full", article: full() });
    await userEvent.click(
      await screen.findByRole("button", { name: /Thích, 2 lượt/ }),
    );
    // Back to this article after signing in.
    expect(push).toHaveBeenCalledWith("/login?next=%2Farticles%2Fhello");
    expect(api.react).not.toHaveBeenCalled();
  });

  it("a signed-in reader's reaction shows at once and is put back if the server refuses", async () => {
    auth = { isAuthenticated: true, isLoading: false, user: { id: "u9" } };
    api.react.mockRejectedValue(new Error("Hết lượt"));
    read({ kind: "full", article: full() });
    const like = await screen.findByRole("button", { name: /Thích, 2 lượt/ });
    await userEvent.click(like);
    expect(await screen.findByText("Hết lượt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Thích, 2 lượt/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("ArticleReader: the way around it", () => {
  const readFull = () =>
    render(
      <ArticleReader slug="hello" result={{ kind: "full", article: full() }} />,
    );

  it("has a path back to the list", () => {
    readFull();
    const nav = screen.getByRole("navigation", { name: "Đường dẫn" });
    expect(within(nav).getByRole("link", { name: "Bài viết" })).toHaveAttribute(
      "href",
      "/articles",
    );
    expect(within(nav).getByText("Hello world")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("offers Sửa bài to the author and to an admin, not to a reader or a guest", () => {
    readFull();
    expect(
      screen.queryByRole("link", { name: "Sửa bài" }),
    ).not.toBeInTheDocument();

    auth = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "other", role: "USER" },
    };
    const reader = readFull();
    expect(
      screen.queryByRole("link", { name: "Sửa bài" }),
    ).not.toBeInTheDocument();
    reader.unmount();

    auth = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "u1", role: "CREATOR" },
    };
    const author = readFull();
    expect(screen.getByRole("link", { name: "Sửa bài" })).toHaveAttribute(
      "href",
      "/write/a1",
    );
    author.unmount();

    auth = {
      isAuthenticated: true,
      isLoading: false,
      user: { id: "boss", role: "ADMIN" },
    };
    readFull();
    expect(screen.getByRole("link", { name: "Sửa bài" })).toBeInTheDocument();
  });

  it("the sign-in card brings the guest back to this article", () => {
    render(
      <ArticleReader
        slug="hello"
        result={{ kind: "preview", article: preview() }}
      />,
    );
    // The card and the comment box both lead back here after signing in.
    const links = screen.getAllByRole("link", { name: /Đăng nhập/ });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/login?next=%2Farticles%2Fhello");
    }
  });
});

describe("CommentThread", () => {
  it("turns web addresses into safe links and never reads HTML", () => {
    const { container } = render(
      <p>{linkify("xem https://example.com/a <b>x</b>")}</p>,
    );
    const link = screen.getByRole("link", { name: "https://example.com/a" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer nofollow ugc");
    expect(container.querySelector("b")).toBeNull();
    expect(container).toHaveTextContent("<b>x</b>");
  });

  it("shows replies nested, a deleted comment as a placeholder, and asks a guest to sign in", async () => {
    api.listComments.mockResolvedValue([
      {
        id: "c1",
        parentId: null,
        body: "[Đã xoá]",
        isDeleted: true,
        createdAt: "2026-11-01T09:00:00.000Z",
        author: null,
        replies: [
          {
            id: "c2",
            parentId: "c1",
            body: "Mình đồng ý",
            isDeleted: false,
            createdAt: "2026-11-01T10:00:00.000Z",
            author: { id: "u2", displayName: "Bình" },
            replies: [],
          },
        ],
      },
    ]);
    render(<CommentThread articleId="a1" />);
    expect(await screen.findByText("Mình đồng ý")).toBeInTheDocument();
    expect(screen.getByText("[Đã xoá]")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toBeInTheDocument();
  });
});
