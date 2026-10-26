import { type ComponentProps } from "react";
import { BookOpen, Clock } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Inline,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import type { LearningItem, LearningLevel } from "../../types";

const LEVELS: Record<
  LearningLevel,
  { label: string; variant: "lime" | "blue" | "pink" }
> = {
  beginner: { label: "Cơ bản", variant: "lime" },
  intermediate: { label: "Trung cấp", variant: "blue" },
  advanced: { label: "Nâng cao", variant: "pink" },
};

export interface LearningItemCardProps extends Omit<
  ComponentProps<"article">,
  "ref" | "title"
> {
  item: LearningItem;
}

/**
 * A course or topic in the catalogue. The level shows as a labelled badge, and
 * when the item has an `href` the whole card is one link: the title is the
 * link, stretched over the card, so keyboard and screen reader users get a
 * single, clearly named target.
 */
export function LearningItemCard({
  item,
  className,
  ...props
}: LearningItemCardProps) {
  const level = LEVELS[item.level];

  return (
    <Card
      as="article"
      padding="compact"
      interactive={Boolean(item.href)}
      className={cn("relative h-full", className)}
      {...props}
    >
      <CardHeader>
        <Inline justify="between" gap={2}>
          <Badge variant={level.variant} size="sm">
            {level.label}
          </Badge>
          <Inline gap={1} className="text-text-muted">
            <Clock aria-hidden="true" size={14} />
            <Text as="span" size="caption" color="muted">
              {item.duration}
            </Text>
          </Inline>
        </Inline>
        <Text as="h3" size="heading-sm" weight="semibold">
          {item.href ? (
            <a
              href={item.href}
              className={cn(
                "rounded-sharp after:absolute after:inset-0 after:content-['']",
                focusRingClasses,
              )}
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </Text>
      </CardHeader>
      <CardContent>
        <Text size="body-sm" color="secondary">
          {item.description}
        </Text>
      </CardContent>
      <CardFooter>
        <Inline gap={1} className="text-text-muted">
          <BookOpen aria-hidden="true" size={14} />
          <Text as="span" size="caption" color="muted">
            {item.lessons} bài học
          </Text>
        </Inline>
      </CardFooter>
    </Card>
  );
}
