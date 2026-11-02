import {
  Bot,
  Brain,
  ClipboardCheck,
  Cloud,
  Database,
  Folder,
  Globe,
  LayoutGrid,
  Layers,
  Network,
  Package2,
  Palette,
  Server,
  ShieldCheck,
  Smartphone,
  Table2,
  Terminal,
  Wrench,
  Workflow,
  Zap,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

/** Lower case, no accents, so the labels can be matched by plain words. */
const plain = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

// The first rule that fits wins, so the narrower ones come first.
const RULES: [RegExp, LucideIcon][] = [
  [/giao dien|css/, Palette],
  [/ngon ngu va runtime|runtime/, Terminal],
  [/ngon ngu/, Globe],
  [/framework/, LayoutGrid],
  [/cong cu/, Wrench],
  [/co so du lieu/, Database],
  [/api|giao tiep/, Network],
  [/ci.?cd/, Workflow],
  [/container/, Package2],
  [/ha tang|ma$/, Server],
  [/giam sat|log/, BarChart3],
  [/native/, Smartphone],
  [/cross/, Layers],
  [/xu ly du lieu/, Table2],
  [/machine learning/, Brain],
  [/warehouse|bi\b/, Database],
  [/an toan ung dung/, ShieldCheck],
  [/an toan mang/, Network],
  [/nha cung cap/, Cloud],
  [/serverless/, Zap],
  [/tu dong/, Bot],
  [/thu cong|quy trinh/, ClipboardCheck],
];

/** The icon of a sub-category tab, chosen from its label; a folder when nothing fits. */
export function subcategoryIconOf(label: string): LucideIcon {
  const text = plain(label);
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? Folder;
}
