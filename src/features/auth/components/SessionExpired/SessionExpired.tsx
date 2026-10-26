import { type ReactNode } from "react";
import { Clock } from "lucide-react";
import {
  Button,
  EmptyState,
  LinkButton,
  type EmptyStateProps,
} from "@/design-system";

export interface SessionExpiredProps extends Omit<
  EmptyStateProps,
  "icon" | "title" | "description" | "action" | "role"
> {
  title?: ReactNode;
  description?: ReactNode;
  /** Called by the sign-in button. Use this or `signInHref`. */
  onSignIn?: () => void;
  /** Renders the sign-in action as a link instead of a button. */
  signInHref?: string;
  signInLabel?: string;
}

/**
 * Tells the user their session ended and offers a way back in. It is an alert
 * so assistive technology announces it, and a content block, so place it
 * wherever fits: a full page, or inside a Dialog.
 */
export function SessionExpired({
  title = "Your session has expired",
  description = "For your security, you were signed out after a period of inactivity. Sign in again to continue.",
  onSignIn,
  signInHref,
  signInLabel = "Sign in again",
  titleAs = "h1",
  ...props
}: SessionExpiredProps) {
  const action = signInHref ? (
    <LinkButton href={signInHref} size="comfortable">
      {signInLabel}
    </LinkButton>
  ) : onSignIn ? (
    <Button size="comfortable" onClick={onSignIn}>
      {signInLabel}
    </Button>
  ) : undefined;

  return (
    <EmptyState
      role="alert"
      icon={Clock}
      title={title}
      titleAs={titleAs}
      description={description}
      action={action}
      {...props}
    />
  );
}
