import { act, render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { TableOfContents, groupToc } from "./TableOfContents";

expect.extend(toHaveNoViolations);

const items = [
  { id: "code", text: "Code", level: 2 as const },
  { id: "built", text: "How I Built It", level: 2 as const },
  { id: "tabpfn", text: "TabPFN-3.5", level: 3 as const },
  { id: "gemma", text: "Google Gemma", level: 3 as const },
  { id: "prize", text: "Prize Categories", level: 2 as const },
];

/**
 * Lets a test say which heading the reader has reached: headings are put in
 * the page, and those up to the given one have scrolled past the reading line.
 */
let reachedIndex = -1;
function mountHeadings() {
  items.forEach((item, index) => {
    const el = document.createElement("h2");
    el.id = item.id;
    el.getBoundingClientRect = () =>
      ({ top: index <= reachedIndex ? -10 : 900 }) as DOMRect;
    document.body.appendChild(el);
  });
}
function reach(id: string) {
  reachedIndex = items.findIndex((item) => item.id === id);
  window.dispatchEvent(new Event("scroll"));
}

beforeEach(() => {
  reachedIndex = -1;
  mountHeadings();
});
afterEach(() => {
  document.body.innerHTML = "";
});

const desktop = (container: HTMLElement) =>
  container.querySelector("div.hidden.lg\\:block") as HTMLElement;

describe("groupToc", () => {
  it("puts each h3 under the h2 before it", () => {
    expect(
      groupToc(items).map((s) => [s.heading.id, s.children.map((c) => c.id)]),
    ).toEqual([
      ["code", []],
      ["built", ["tabpfn", "gemma"]],
      ["prize", []],
    ]);
  });

  it("makes a section of an h3 that comes before any h2", () => {
    const sections = groupToc([
      { id: "a", text: "A", level: 3 },
      { id: "b", text: "B", level: 2 },
    ]);
    expect(sections.map((s) => s.heading.id)).toEqual(["a", "b"]);
  });

  it("is empty for no headings", () => {
    expect(groupToc([])).toEqual([]);
  });
});

describe("TableOfContents", () => {
  it("renders nothing without headings", () => {
    const { container } = render(<TableOfContents items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is a card under a yellow folder tab named Nội dung bài viết", () => {
    const { container } = render(<TableOfContents items={items} />);
    const open = desktop(container);
    expect(within(open).getByText("Nội dung bài viết")).toBeInTheDocument();
    expect(open.querySelector(".bg-accent-yellow")).not.toBeNull();
    expect(open.querySelector("[data-decor='ticks']")).not.toBeNull();
    // The folded copy for narrow screens has the same name.
    expect(screen.getAllByText("Nội dung bài viết")).toHaveLength(2);
  });

  it("lists the sections as dots on a line, each linking to its heading", () => {
    const { container } = render(<TableOfContents items={items} />);
    const open = desktop(container);
    const links = within(open).getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "#code");
    expect(open.querySelectorAll("[data-dot]").length).toBeGreaterThanOrEqual(
      3,
    );
    for (const dot of open.querySelectorAll("[data-dot]")) {
      expect(dot).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("marks the section being read, filled and lime", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("code"));
    const current = within(desktop(container)).getByRole("link", {
      name: "Code",
    });
    expect(current).toHaveAttribute("aria-current", "location");
    expect(current).toHaveClass("bg-accent-lime");
  });

  it("keeps the section marked, and the active h3 current, while reading an h3", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("gemma"));
    const open = desktop(container);
    const dot = within(open).getAllByRole("link", { name: "How I Built It" })[0];
    expect(dot).toHaveClass("bg-accent-lime");
  });

  it("goes back to the earlier heading when scrolling up", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("prize"));
    act(() => reach("built"));
    expect(
      within(desktop(container)).getByRole("link", { name: "How I Built It" }),
    ).toHaveAttribute("aria-current", "location");
  });

  it("shows the h3 headings of the section being read as numbered rows, and the next section as a lime button", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("built"));
    const open = desktop(container);
    expect(
      within(open).getByRole("heading", { level: 2, name: "How I Built It" }),
    ).toBeInTheDocument();
    const numbers = [...open.querySelectorAll("[data-number]")].map(
      (n) => n.textContent,
    );
    expect(numbers).toEqual(["1", "2"]);
    expect(
      within(open).getByRole("link", { name: /TabPFN-3.5/ }),
    ).toHaveAttribute("href", "#tabpfn");
    const next = within(open).getByRole("link", {
      name: /Prize Categories.*mục tiếp theo/,
    });
    expect(next).toHaveAttribute("href", "#prize");
    expect(next).toHaveClass("bg-accent-lime");
  });

  it("follows a reader who is on an h3: its section is the one shown", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("gemma"));
    const open = desktop(container);
    expect(
      within(open).getByRole("link", { name: /Google Gemma/ }),
    ).toHaveAttribute("aria-current", "location");
    // Both the dot for that section and the button to it lead to the same heading.
    for (const link of within(open).getAllByRole("link", {
      name: /Prize Categories/,
    })) {
      expect(link).toHaveAttribute("href", "#prize");
    }
    expect(
      within(open).getByRole("link", { name: /mục tiếp theo/ }),
    ).toHaveAttribute("href", "#prize");
  });

  it("has no section list for a section without h3, and no next button at the last section", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("prize"));
    const open = desktop(container);
    expect(open.querySelectorAll("[data-number]")).toHaveLength(0);
    expect(within(open).queryByText(/mục tiếp theo/)).not.toBeInTheDocument();
  });

  it("gives the title of each copy its own id", () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("built"));
    const ids = [...container.querySelectorAll("h2[id]")].map((h) => h.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no axe violations, with a section open", async () => {
    const { container } = render(<TableOfContents items={items} />);
    act(() => reach("built"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
