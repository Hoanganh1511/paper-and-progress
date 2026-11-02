import { Folder, Globe, LayoutGrid, Palette, Wrench } from "lucide-react";
import { subcategoryIconOf } from "./subcategoryIcon";

describe("subcategoryIconOf", () => {
  it.each([
    ["Framework", LayoutGrid],
    ["Ngôn ngữ", Globe],
    ["Giao diện và CSS", Palette],
    ["Công cụ", Wrench],
  ])("gives %s its own icon", (label, icon) => {
    expect(subcategoryIconOf(label)).toBe(icon);
  });

  it("is a folder for a label it does not know", () => {
    expect(subcategoryIconOf("Điều gì đó khác")).toBe(Folder);
  });

  it("gives every sub-category of the catalogue an icon other than the folder, except where none fits", async () => {
    const { getTechGroups } = await import("../../data");
    const groups = await getTechGroups();
    const labels = groups.flatMap((group) =>
      group.subcategories.map((sub) => sub.label),
    );
    const plain = labels.filter((label) => subcategoryIconOf(label) === Folder);
    expect(plain).toEqual([]);
  });
});
