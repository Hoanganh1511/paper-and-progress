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
  type LucideIcon,
} from "lucide-react";

/** Lower case, no accents, so "Bảo mật" and "bao-mat" meet. */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[-_]/g, " ")
    .toLowerCase();

const RULES: [RegExp, LucideIcon][] = [
  [/front/, PanelsTopLeft],
  [/back/, Database],
  [/devops|ci.?cd/, InfinityIcon],
  [/mobile|di dong/, Smartphone],
  [/du lieu|data|\bai\b/, Cpu],
  [/bao mat|security/, ShieldCheck],
  [/cloud|ha tang/, Cloud],
  [/kiem thu|\bqa\b|test/, FlaskConical],
];

/** The icon of a category in the list, chosen from its name; a folder when nothing fits. */
export function categoryIconOf(category: {
  id: string;
  title: string;
}): LucideIcon {
  const text = `${plain(category.title)} ${plain(category.id)}`;
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? Folder;
}
