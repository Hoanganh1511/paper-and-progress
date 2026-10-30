"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { IconButton } from "@/design-system";

export interface Collapse {
  isCollapsed: boolean;
  toggle: () => void;
  /** Put this `id` on the part that collapses, and `hidden` while collapsed. */
  bodyId: string;
}

/** Whether a box is folded up, and the id of the part that folds. */
export function useCollapse(): Collapse {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bodyId = useId();
  return {
    isCollapsed,
    toggle: () => setIsCollapsed((current) => !current),
    bodyId,
  };
}

export interface CollapseToggleProps {
  collapse: Collapse;
  /** Name of the box, used in the button's label: "Thu gọn Issues & Attention". */
  title: string;
}

/** The "−" button in a box's header; it becomes "+" once the box is folded up. */
export function CollapseToggle({ collapse, title }: CollapseToggleProps) {
  return (
    <IconButton
      icon={collapse.isCollapsed ? Plus : Minus}
      variant="ghost"
      size="compact"
      aria-expanded={!collapse.isCollapsed}
      aria-controls={collapse.bodyId}
      aria-label={`${collapse.isCollapsed ? "Mở rộng" : "Thu gọn"} ${title}`}
      onClick={collapse.toggle}
    />
  );
}
