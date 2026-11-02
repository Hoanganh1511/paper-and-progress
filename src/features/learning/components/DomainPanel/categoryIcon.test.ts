import {
  Cloud,
  Cpu,
  Database,
  FlaskConical,
  Folder,
  Infinity as InfinityIcon,
  PanelsTopLeft,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { categoryIconOf } from "./categoryIcon";

describe("categoryIconOf", () => {
  it.each([
    ["Frontend", PanelsTopLeft],
    ["Backend", Database],
    ["DevOps và CI/CD", InfinityIcon],
    ["Mobile", Smartphone],
    ["Dữ liệu và AI", Cpu],
    ["Bảo mật", ShieldCheck],
    ["Cloud và hạ tầng", Cloud],
    ["Kiểm thử (QA)", FlaskConical],
  ])("gives %s its own icon", (title, icon) => {
    expect(categoryIconOf({ id: "x", title })).toBe(icon);
  });

  it("also reads the id, and is a folder when nothing fits", () => {
    expect(categoryIconOf({ id: "bao-mat", title: "?" })).toBe(ShieldCheck);
    expect(categoryIconOf({ id: "khac", title: "Khác" })).toBe(Folder);
  });
});
