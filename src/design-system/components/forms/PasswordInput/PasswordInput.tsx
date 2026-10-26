"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { IconButton } from "../../actions/Button/IconButton";
import { Input, type InputProps } from "../Input";

export interface PasswordInputProps extends Omit<
  InputProps,
  "type" | "rightAddon"
> {
  /** Accessible name of the toggle; its pressed state tells whether the password is shown. */
  toggleLabel?: string;
}

export function PasswordInput({
  disabled,
  toggleLabel = "Show password",
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      {...props}
      type={isVisible ? "text" : "password"}
      disabled={disabled}
      rightAddon={
        <IconButton
          icon={isVisible ? EyeOff : Eye}
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          variant="ghost"
          size="compact"
          className="size-6 rounded-sharp"
          disabled={disabled}
          onClick={() => setIsVisible((visible) => !visible)}
        />
      }
    />
  );
}
