import { LAUNCHER_MODULES } from "./data";

describe("LAUNCHER_MODULES", () => {
  it("has the three modules: Dự án, Daily Logs and Bài viết", () => {
    expect(LAUNCHER_MODULES.map((m) => m.label)).toEqual([
      "Dự án",
      "Daily Logs",
      "Bài viết",
    ]);
  });

  it("keeps ids, labels and addresses unique", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(LAUNCHER_MODULES.map((m) => m.id))).toBe(true);
    expect(unique(LAUNCHER_MODULES.map((m) => m.label))).toBe(true);
    expect(unique(LAUNCHER_MODULES.map((m) => m.href))).toBe(true);
  });

  it("gives every module an absolute path and an icon", () => {
    LAUNCHER_MODULES.forEach((entry) => {
      expect(entry.href).toMatch(/^\/[a-z-]+$/);
      expect(entry.icon).toBeTruthy();
    });
  });
});
