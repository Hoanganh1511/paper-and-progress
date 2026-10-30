import { Badge } from "@/design-system";

const NAMES: Record<string, string> = {
  local: "Email",
  google: "Google",
  facebook: "Facebook",
  github: "GitHub",
};

/** One small badge per way the account can sign in. */
export function ProviderBadges({ providers }: { providers: string[] }) {
  if (providers.length === 0) return <>—</>;
  return (
    <span className="flex flex-wrap gap-1">
      {providers.map((provider) => (
        <Badge key={provider} size="sm">
          {NAMES[provider] ?? provider}
        </Badge>
      ))}
    </span>
  );
}
