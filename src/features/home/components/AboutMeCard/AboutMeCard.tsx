"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  FileUser,
  Mail,
  Phone,
  type LucideIcon,
} from "lucide-react";
import {
  IconButton,
  LinkButton,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { FacebookIcon, InstagramIcon, OWNER_LINKS } from "@/features/cv";
import { Mascot } from "@/features/english";

const OWNER = {
  name: "AnhHT",
  role: "Frontend Developer & Lifelong Learner",
  email: "anhht.fe@gmail.com",
  phone: "0969605812",
} as const;

const COPIED_MS = 2000;

const SOCIAL_LINKS = [
  { label: "Facebook", href: OWNER_LINKS.facebook, Icon: FacebookIcon },
  { label: "Instagram", href: OWNER_LINKS.instagram, Icon: InstagramIcon },
] as const;

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setIsCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsCopied(false), COPIED_MS);
  }

  return (
    <li className="flex items-center gap-2 text-body-sm">
      <Icon aria-hidden="true" size={16} className="shrink-0" />
      <a
        href={href}
        className="min-w-0 flex-1 truncate font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
      >
        {value}
      </a>
      <IconButton
        variant="ghost"
        size="compact"
        icon={isCopied ? Check : Copy}
        aria-label={isCopied ? `Đã sao chép ${label}` : `Sao chép ${label}`}
        onClick={copy}
      />
      <span role="status" className="sr-only">
        {isCopied ? `Đã sao chép ${label}` : ""}
      </span>
    </li>
  );
}

/** Who built the site, with the two ways to reach them and a button to copy each. */
export function AboutMeCard() {
  return (
    <section
      aria-labelledby="about-me-title"
      lang="vi"
      className="flex flex-col gap-2 rounded-standard border border-border-subtle bg-surface-sunken p-3"
    >
      <Text as="h2" id="about-me-title" size="body-md" weight="semibold">
        Về tôi (Chủ web)
      </Text>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent-lime">
          <Mascot accessory="pencil" aria-hidden="true" className="size-8" />
        </span>
        <div className="flex min-w-0 flex-col">
          <Text weight="semibold" size="body-md" font="display">
            {OWNER.name}
          </Text>
          <Text size="caption" color="secondary">
            {OWNER.role}
          </Text>
        </div>
      </div>
      <ul className="flex flex-col">
        <ContactRow
          icon={Mail}
          label="email"
          value={OWNER.email}
          href={`mailto:${OWNER.email}`}
        />
        <ContactRow
          icon={Phone}
          label="số điện thoại"
          value={OWNER.phone}
          href={`tel:${OWNER.phone}`}
        />
      </ul>
      <ul
        aria-label="Mạng xã hội"
        className="m-0 flex list-none items-center gap-2 p-0 pt-1"
      >
        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} của ${OWNER.name} (mở trong tab mới)`}
              title={label}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-standard border-2 border-border-strong bg-surface-card text-ink shadow-raised",
                "transition-[background-color,box-shadow,translate] hover:bg-accent-lime active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none",
                focusRingClasses,
              )}
            >
              <Icon size={20} />
            </a>
          </li>
        ))}
      </ul>
      <LinkButton
        href="/cv"
        variant="accent"
        isFullWidth
        leftIcon={FileUser}
        rightIcon={ArrowRight}
      >
        Xem CV của tôi
      </LinkButton>
    </section>
  );
}
