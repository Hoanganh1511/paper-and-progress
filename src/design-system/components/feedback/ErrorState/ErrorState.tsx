import { type ComponentProps, type ReactNode } from "react";
import { CircleAlert, RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Text, type TextElement } from "../../../primitives/Text";
import { Button } from "../../actions/Button/Button";

export interface ErrorStateProps extends Omit<
  ComponentProps<"div">,
  "title" | "role"
> {
  icon?: LucideIcon;
  title?: ReactNode;
  message?: ReactNode;
  /** When given, a retry button calls it. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Shows the retry button as busy while the retry runs. */
  isRetrying?: boolean;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: Extract<TextElement, "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p">;
}

/**
 * Shown where content failed to load. It is an alert, so assistive
 * technology announces it when it appears.
 */
export function ErrorState({
  icon: Icon = CircleAlert,
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  isRetrying = false,
  titleAs = "h3",
  className,
  ref,
  ...props
}: ErrorStateProps) {
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span className="mb-1 flex size-12 items-center justify-center rounded-pill bg-danger-bg text-danger-text">
        <Icon aria-hidden="true" size={24} />
      </span>
      <Text as={titleAs} size="heading-md" weight="semibold">
        {title}
      </Text>
      {message && (
        <Text size="body-md" color="secondary" className="max-w-sm">
          {message}
        </Text>
      )}
      {onRetry && (
        <Button
          variant="outline"
          leftIcon={RefreshCw}
          isLoading={isRetrying}
          onClick={onRetry}
          className="mt-2"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
