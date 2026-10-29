import { Check } from "lucide-react";
import { Stack, Text } from "@/design-system";
import { TAB_CONTENT } from "../data";
import type { ProfileTabId } from "../types";
import { BRAND_PROVIDERS, BrandIcon, type BrandProvider } from "./BrandIcon";
import { ProfileCard } from "./ProfileCard";

function isBrandProvider(item: string): item is BrandProvider {
  return (BRAND_PROVIDERS as readonly string[]).includes(item);
}

export interface SectionsTabProps {
  tabId: Exclude<ProfileTabId, "overview">;
}

/** Outline of a tab's sections, until each one gets its own form. */
export function SectionsTab({ tabId }: SectionsTabProps) {
  const content = TAB_CONTENT[tabId];

  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text as="h2" size="heading-md" weight="semibold">
          {content.title}
        </Text>
        <Text size="body-md" color="secondary">
          {content.description}
        </Text>
      </Stack>
      <div className="grid gap-6 md:grid-cols-2">
        {content.sections.map((section) => (
          <ProfileCard key={section.title} title={section.title}>
            <ul className="flex flex-col gap-2">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  {isBrandProvider(item) ? (
                    <BrandIcon
                      provider={item}
                      size={16}
                      className="mt-1 shrink-0"
                    />
                  ) : (
                    <Check
                      aria-hidden="true"
                      size={16}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <Text size="body-md">{item}</Text>
                </li>
              ))}
            </ul>
          </ProfileCard>
        ))}
      </div>
    </Stack>
  );
}
