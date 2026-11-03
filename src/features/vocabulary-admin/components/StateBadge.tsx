import { CircleCheck, CircleDashed, CircleDot } from "lucide-react";
import { Badge } from "@/design-system";
import { STATE_LABELS } from "../categories";
import type { CategoryState } from "../types";

const LOOK = {
  EMPTY: { variant: "default", icon: CircleDashed },
  IN_PROGRESS: { variant: "yellow", icon: CircleDot },
  COMPLETED: { variant: "lime", icon: CircleCheck },
} as const;

/** Empty, in progress or completed: a word and an icon, so it never rests on colour alone. */
export function StateBadge({
  state,
  size = "sm",
}: {
  state: CategoryState;
  size?: "sm" | "md";
}) {
  const { variant, icon } = LOOK[state];
  return (
    <Badge variant={variant} icon={icon} size={size}>
      {STATE_LABELS[state]}
    </Badge>
  );
}
