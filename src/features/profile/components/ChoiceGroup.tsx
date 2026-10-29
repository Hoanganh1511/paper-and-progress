import type { LucideIcon } from "lucide-react";
import { Button, cn } from "@/design-system";

export interface Choice<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface ChoiceGroupProps<T extends string> {
  /** Accessible name of the group. */
  label: string;
  choices: Choice<T>[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

/** A row of toggle buttons where exactly one is pressed (kept in the "pressed" look). */
export function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  disabled,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const isSelected = choice.value === value;
        return (
          <Button
            key={choice.value}
            variant={isSelected ? "accent" : "outline"}
            leftIcon={choice.icon}
            aria-pressed={isSelected}
            disabled={disabled}
            className={cn(
              isSelected && "translate-x-0.5 translate-y-0.5 shadow-none",
            )}
            onClick={() => onChange(choice.value)}
          >
            {choice.label}
          </Button>
        );
      })}
    </div>
  );
}
