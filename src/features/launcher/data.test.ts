import { LAUNCHER_MODULES } from "./data";

describe("LAUNCHER_MODULES", () => {
  it("has the 15 modules that fill a 5 x 3 grid and a 3-column grid evenly", () => {
    expect(LAUNCHER_MODULES).toHaveLength(15);
    expect(LAUNCHER_MODULES.length % 5).toBe(0);
    expect(LAUNCHER_MODULES.length % 3).toBe(0);
  });

  it("keeps ids, labels and addresses unique", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(LAUNCHER_MODULES.map((m) => m.id))).toBe(true);
    expect(unique(LAUNCHER_MODULES.map((m) => m.label))).toBe(true);
    expect(unique(LAUNCHER_MODULES.map((m) => m.href))).toBe(true);
  });

  it("groups them as core 4, practice 3, explore 3, community 1, personal 3, system 1", () => {
    const counts = LAUNCHER_MODULES.reduce<Record<string, number>>(
      (result, entry) => ({
        ...result,
        [entry.group]: (result[entry.group] ?? 0) + 1,
      }),
      {},
    );
    expect(counts).toEqual({
      core: 4,
      practice: 3,
      explore: 3,
      community: 1,
      personal: 3,
      system: 1,
    });
  });

  it("keeps each group together, in order", () => {
    const order = LAUNCHER_MODULES.map((m) => m.group).filter(
      (group, index, all) => group !== all[index - 1],
    );
    expect(order).toEqual([
      "core",
      "practice",
      "explore",
      "community",
      "personal",
      "system",
    ]);
  });

  it("gives every module an absolute path and an icon", () => {
    LAUNCHER_MODULES.forEach((entry) => {
      expect(entry.href).toMatch(/^\/[a-z-]+$/);
      expect(entry.icon).toBeTruthy();
    });
  });
});
