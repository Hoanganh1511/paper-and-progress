"use client";

import { useLayoutEffect, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Text } from "../../../primitives/Text";
import { IconButton } from "../../actions/Button/IconButton";
import { useDialog } from "./DialogContext";

export interface DialogHeaderProps extends Omit<
  ComponentProps<"div">,
  "title"
> {
  /** Becomes the dialog's accessible name. */
  title: ReactNode;
  /** Becomes the dialog's accessible description. */
  description?: ReactNode;
  showCloseButton?: boolean;
  closeLabel?: string;
}

export function DialogHeader({
  title,
  description,
  showCloseButton = true,
  closeLabel = "Close",
  className,
  children,
  ref,
  ...props
}: DialogHeaderProps) {
  const { titleId, descriptionId, onClose, isDismissible, setHasDescription } =
    useDialog();
  const hasDescription = Boolean(description);

  useLayoutEffect(() => {
    setHasDescription(hasDescription);
    return () => setHasDescription(false);
  }, [hasDescription, setHasDescription]);

  return (
    <div
      ref={ref}
      className={cn("flex items-start gap-4 px-6 pt-6 pb-2", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text as="h2" id={titleId} size="heading-md" weight="semibold">
          {title}
        </Text>
        {hasDescription && (
          <Text as="p" id={descriptionId} size="body-md" color="secondary">
            {description}
          </Text>
        )}
        {children}
      </div>
      {showCloseButton && isDismissible && (
        <IconButton
          icon={X}
          aria-label={closeLabel}
          variant="ghost"
          size="compact"
          className="-mt-1 -mr-2"
          onClick={onClose}
        />
      )}
    </div>
  );
}
