import { Alert } from "@/design-system";

export interface FormStatusValue {
  kind: "success" | "error";
  message: string;
}

/** Result of the last submit: green on success, red on failure (the text says which). */
export function FormStatus({ status }: { status?: FormStatusValue }) {
  if (!status) return null;
  return (
    <Alert variant={status.kind === "success" ? "success" : "danger"}>
      {status.message}
    </Alert>
  );
}
