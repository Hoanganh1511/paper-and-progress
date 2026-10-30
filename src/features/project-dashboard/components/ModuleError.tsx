import { Alert, Button } from "@/design-system";

export interface ModuleErrorProps {
  error: Error;
  onRetry: () => void;
}

/** "Không thể tải dữ liệu. Thử lại." with a retry button, for a module whose request failed. */
export function ModuleError({ error, onRetry }: ModuleErrorProps) {
  return (
    <Alert variant="danger" title="Không thể tải dữ liệu. Thử lại.">
      <div className="flex flex-wrap items-center gap-3">
        <span>{error.message}</span>
        <Button size="compact" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    </Alert>
  );
}
