import { focusRingClasses } from "@/design-system";

/** Text link used inside the auth forms (forgot password, sign up, ...). */
export const authLinkClasses = [
  "rounded-sharp font-medium text-text-primary underline underline-offset-4",
  "hover:text-text-secondary",
  focusRingClasses,
].join(" ");
