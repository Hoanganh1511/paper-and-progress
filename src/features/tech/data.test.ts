import { getTechGroups } from "./data";

describe("getTechGroups", () => {
  it("returns several groups, each with a few sub-categories of items", async () => {
    const groups = await getTechGroups();
    expect(groups.length).toBeGreaterThanOrEqual(5);
    groups.forEach((group) => {
      expect(group.label).toBeTruthy();
      expect(group.subcategories.length).toBeGreaterThanOrEqual(2);
      group.subcategories.forEach((sub) => {
        expect(sub.label).toBeTruthy();
        expect(sub.items.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it("keeps ids unique where they become DOM ids", async () => {
    const groups = await getTechGroups();
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(groups.map((group) => group.id))).toBe(true);
    expect(
      unique(groups.flatMap((group) => group.subcategories.map((s) => s.id))),
    ).toBe(true);
    expect(
      unique(
        groups.flatMap((group) =>
          group.subcategories.flatMap((s) => s.items.map((i) => i.id)),
        ),
      ),
    ).toBe(true);
  });

  it("gives every item a title and an icon", async () => {
    const groups = await getTechGroups();
    groups.forEach((group) =>
      group.subcategories.forEach((sub) =>
        sub.items.forEach((entry) => {
          expect(entry.title).toBeTruthy();
          expect(entry.icon).toBeTruthy();
        }),
      ),
    );
  });
});
