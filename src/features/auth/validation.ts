const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A deliberately loose shape check (something@domain.tld); the server decides the rest. */
export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/** Reads a text field from FormData as a string ("" when missing). */
export function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Moves focus to the form control with the given `name`. */
export function focusField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
}
