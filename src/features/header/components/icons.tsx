import { type ComponentProps } from "react";

type IconProps = Omit<ComponentProps<"svg">, "children" | "viewBox">;

/** A panda face: the Baolingo mascot. Decorative; name the control around it. */
export function PandaIcon(props: IconProps) {
  // The outline follows the theme (dark in light mode, light in dark mode), so
  // the black ears do not vanish into a dark background.
  const outline = { stroke: "var(--color-text-primary)" };

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle
        cx="15"
        cy="15"
        r="9"
        fill="#171717"
        strokeWidth="2"
        style={outline}
      />
      <circle
        cx="49"
        cy="15"
        r="9"
        fill="#171717"
        strokeWidth="2"
        style={outline}
      />
      <circle
        cx="32"
        cy="35"
        r="25"
        fill="#ffffff"
        strokeWidth="2"
        style={outline}
      />
      <ellipse
        cx="21"
        cy="33"
        rx="6.5"
        ry="8.5"
        transform="rotate(-18 21 33)"
        fill="#171717"
      />
      <ellipse
        cx="43"
        cy="33"
        rx="6.5"
        ry="8.5"
        transform="rotate(18 43 33)"
        fill="#171717"
      />
      <circle cx="22" cy="32" r="2.4" fill="#ffffff" />
      <circle cx="42" cy="32" r="2.4" fill="#ffffff" />
      <ellipse cx="32" cy="43" rx="4" ry="3" fill="#171717" />
      <path
        d="M27 48c1.6 2.2 3.2 3 5 3s3.4-.8 5-3"
        stroke="#171717"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The Facebook "f" mark (lucide-react no longer ships brand icons). */
export function FacebookIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-1 .4-1.7 1.8-1.7h1.6V3.8c-.3 0-1.3-.2-2.5-.2-2.6 0-4.3 1.6-4.3 4.4v2.5H7.3v3.3h2.8V22h3.4Z" />
    </svg>
  );
}

export function VietnamFlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 30 20" aria-hidden="true" focusable="false" {...props}>
      <rect width="30" height="20" fill="#da251d" />
      <path
        d="m15 4 1.76 5.42h5.7l-4.61 3.35 1.76 5.42L15 14.84l-4.61 3.35 1.76-5.42-4.61-3.35h5.7L15 4Z"
        fill="#ffff00"
      />
    </svg>
  );
}

export function UnitedKingdomFlagIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 60 40" aria-hidden="true" focusable="false" {...props}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0l60 40M60 0 0 40" stroke="#ffffff" strokeWidth="8" />
      <path d="M0 0l60 40M60 0 0 40" stroke="#c8102e" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#ffffff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  );
}
