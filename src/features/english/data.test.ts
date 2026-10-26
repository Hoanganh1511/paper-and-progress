import { getEnglishTabs } from "./data";

describe("getEnglishTabs", () => {
  it("returns several tabs, each with titled carousels of cards", async () => {
    const tabs = await getEnglishTabs();
    expect(tabs.length).toBeGreaterThanOrEqual(3);
    tabs.forEach((tab) => {
      expect(tab.label).toBeTruthy();
      expect(tab.sections.length).toBeGreaterThanOrEqual(2);
      tab.sections.forEach((section) => {
        expect(section.title).toBeTruthy();
        // Enough cards that a row overflows and scrolls on a phone.
        expect(section.topics.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  it("keeps ids unique where they become DOM ids", async () => {
    const tabs = await getEnglishTabs();
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(tabs.map((tab) => tab.id))).toBe(true);
    expect(unique(tabs.flatMap((tab) => tab.sections.map((s) => s.id)))).toBe(
      true,
    );
    expect(
      unique(
        tabs.flatMap((tab) =>
          tab.sections.flatMap((s) => s.topics.map((t) => t.id)),
        ),
      ),
    ).toBe(true);
  });

  it("gives every card all its parts", async () => {
    const tabs = await getEnglishTabs();
    tabs.forEach((tab) =>
      tab.sections.forEach((section) =>
        section.topics.forEach((entry) => {
          expect(entry.title).toBeTruthy();
          expect(entry.description.length).toBeGreaterThan(20);
          expect(entry.badge).toBeTruthy();
          expect(entry.decor.length).toBeGreaterThanOrEqual(2);
          expect(["blue", "green", "orange", "pink", "purple"]).toContain(
            entry.color,
          );
        }),
      ),
    );
  });

  it("uses every card color somewhere", async () => {
    const tabs = await getEnglishTabs();
    const colors = new Set(
      tabs.flatMap((tab) =>
        tab.sections.flatMap((s) => s.topics.map((t) => t.color)),
      ),
    );
    expect([...colors].sort()).toEqual([
      "blue",
      "green",
      "orange",
      "pink",
      "purple",
    ]);
  });

  it("does not put two neighbours of the same color next to each other", async () => {
    const tabs = await getEnglishTabs();
    const clashes = tabs.flatMap((tab) =>
      tab.sections.flatMap((section) =>
        section.topics
          .slice(1)
          .filter((entry, index) => entry.color === section.topics[index].color)
          .map((entry) => `${section.id}: ${entry.id}`),
      ),
    );
    expect(clashes).toEqual([]);
  });
});
