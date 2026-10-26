import { getLearningDomains } from "./data";

describe("getLearningDomains", () => {
  it("returns several domains, each with categories and items", async () => {
    const domains = await getLearningDomains();
    expect(domains.length).toBeGreaterThanOrEqual(4);
    domains.forEach((domain) => {
      expect(domain.label).toBeTruthy();
      expect(domain.categories.length).toBeGreaterThan(0);
      domain.categories.forEach((category) => {
        expect(category.items.length).toBeGreaterThan(0);
      });
    });
  });

  it("keeps ids unique where they are used for DOM ids", async () => {
    const domains = await getLearningDomains();
    const domainIds = domains.map((domain) => domain.id);
    expect(new Set(domainIds).size).toBe(domainIds.length);

    domains.forEach((domain) => {
      const categoryIds = domain.categories.map((category) => category.id);
      expect(new Set(categoryIds).size).toBe(categoryIds.length);
    });

    const itemIds = domains.flatMap((domain) =>
      domain.categories.flatMap((category) =>
        category.items.map((entry) => entry.id),
      ),
    );
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("only uses ids that are safe in a URL fragment", async () => {
    const domains = await getLearningDomains();
    domains.forEach((domain) => {
      expect(domain.id).toMatch(/^[a-z0-9-]+$/);
      domain.categories.forEach((category) =>
        expect(category.id).toMatch(/^[a-z0-9-]+$/),
      );
    });
  });

  it("gives every item a known level and a positive lesson count", async () => {
    const domains = await getLearningDomains();
    domains.forEach((domain) =>
      domain.categories.forEach((category) =>
        category.items.forEach((entry) => {
          expect(["beginner", "intermediate", "advanced"]).toContain(
            entry.level,
          );
          expect(entry.lessons).toBeGreaterThan(0);
        }),
      ),
    );
  });
});
