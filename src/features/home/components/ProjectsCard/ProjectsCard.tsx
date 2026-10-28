import { useId, type ComponentProps } from "react";
import { ArrowRight } from "lucide-react";
import { Card, LinkButton, ProgressBar, Text, cn } from "@/design-system";
import type { ProjectSummary } from "@/features/devlog";

export interface ProjectsCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  projects: ProjectSummary[];
  href?: string;
}

/** The projects with the share each one is done and how many logs it has. */
export function ProjectsCard({
  projects,
  href = "/devlog",
  className,
  ...props
}: ProjectsCardProps) {
  const titleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("rounded-soft", className)}
      {...props}
    >
      <Text as="h2" id={titleId} size="heading-md" weight="semibold">
        Dự án
      </Text>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {projects.map((project) => (
          <li key={project.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Text as="span" size="body-md" weight="medium">
                {project.label}
              </Text>
              <Text as="span" size="caption" color="muted">
                {project.entryCount} log
              </Text>
            </div>
            <ProgressBar
              value={project.progress}
              label={`Tiến độ ${project.label}`}
              showValue
            />
          </li>
        ))}
      </ul>
      <LinkButton
        href={href}
        variant="outline"
        rightIcon={ArrowRight}
        className="self-start"
      >
        Xem nhật ký
      </LinkButton>
    </Card>
  );
}
