"use client";

import { useState, type ComponentProps } from "react";
import {
  Code,
  HeartPulse,
  Languages,
  MessagesSquare,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Container,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  cn,
} from "@/design-system";
import type { LearningDomain, LearningDomainIcon } from "../../types";
import { DomainView } from "../DomainView";

// Icons are looked up by key here because components cannot be passed from a
// Server Component (the page) to a Client Component as props.
const DOMAIN_ICONS: Record<LearningDomainIcon, LucideIcon> = {
  technology: Code,
  finance: Wallet,
  health: HeartPulse,
  language: Languages,
  "soft-skills": MessagesSquare,
};

export interface LearningHubProps extends Omit<
  ComponentProps<"div">,
  "ref" | "children"
> {
  domains: LearningDomain[];
  /** Domain shown first; defaults to the first one. */
  defaultDomainId?: string;
}

/**
 * The learning catalogue: a tab bar across the top with one tab per domain,
 * and under it the chosen domain's categories (see DomainView). Choosing a
 * tab swaps the whole content and returns to the top of the page; only the
 * chosen domain is rendered.
 */
export function LearningHub({
  domains,
  defaultDomainId,
  className,
  ...props
}: LearningHubProps) {
  const [domainId, setDomainId] = useState(
    defaultDomainId ?? domains[0]?.id ?? "",
  );

  function handleDomainChange(nextDomainId: string) {
    setDomainId(nextDomainId);
    // A new domain starts at its top, not wherever the old one was scrolled to.
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "auto" });
  }

  return (
    <div lang="vi" className={cn("min-h-dvh", className)} {...props}>
      <Tabs
        value={domainId}
        onValueChange={handleDomainChange}
        className="gap-0"
      >
        <div className="sticky top-[var(--app-header-height,0px)] z-[var(--z-sticky)] border-b border-border-default bg-surface-page">
          <Container size="wide">
            <h1 className="sr-only">Học tập theo lĩnh vực</h1>
            <TabList aria-label="Lĩnh vực học tập" className=" border-b-0">
              {domains.map((domain) => {
                const Icon = DOMAIN_ICONS[domain.icon];
                return (
                  <TabTrigger key={domain.id} value={domain.id}>
                    <Icon aria-hidden="true" size={16} className="shrink-0" />
                    {domain.label}
                  </TabTrigger>
                );
              })}
            </TabList>
          </Container>
        </div>
        {domains.map((domain) => (
          <TabPanel
            key={domain.id}
            value={domain.id}
            // The panel holds focusable content, so it need not be a tab stop.
            tabIndex={-1}
          >
            {domain.id === domainId && (
              <Container size="wide">
                <DomainView key={domain.id} domain={domain} />
              </Container>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
