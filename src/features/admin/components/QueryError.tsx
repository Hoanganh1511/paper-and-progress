import { Alert, Button } from "@/design-system";

export interface QueryErrorProps {
  error?: Error;
  onRetry: () => void;
}

/** Inline message for a failed admin request, with a retry button. */
export function QueryError({ error, onRetry }: QueryErrorProps) {
  if (!error) return null;
  return (
    <Alert variant="danger" title="Không tải được dữ liệu">
      <div className="flex flex-wrap items-center gap-3">
        <span>{error.message}</span>
        <Button size="compact" variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    </Alert>
  );
}
