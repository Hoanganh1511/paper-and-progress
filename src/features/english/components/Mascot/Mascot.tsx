import { type ComponentProps } from "react";
import type { TopicMascot } from "../../types";

export interface MascotProps extends Omit<
  ComponentProps<"svg">,
  "children" | "viewBox"
> {
  /** What the panda holds or wears. */
  accessory: TopicMascot;
}

const INK = "#171717";
const GOLD = "#facc15";

function Accessory({ accessory }: { accessory: TopicMascot }) {
  switch (accessory) {
    case "headphones":
      return (
        <>
          <path
            d="M32 56a28 28 0 0 1 56 0"
            stroke={GOLD}
            strokeWidth="5"
            fill="none"
          />
          <rect
            x="25"
            y="50"
            width="11"
            height="22"
            rx="5.5"
            fill={GOLD}
            stroke={INK}
            strokeWidth="2"
          />
          <rect
            x="84"
            y="50"
            width="11"
            height="22"
            rx="5.5"
            fill={GOLD}
            stroke={INK}
            strokeWidth="2"
          />
        </>
      );
    case "microphone":
      return (
        <>
          <rect
            x="85"
            y="74"
            width="8"
            height="24"
            rx="4"
            fill={GOLD}
            stroke={INK}
            strokeWidth="2"
          />
          <circle
            cx="89"
            cy="68"
            r="9"
            fill="#e5e7eb"
            stroke={INK}
            strokeWidth="2"
          />
          <path d="M84 66h10M84 70h10" stroke={INK} strokeWidth="1.5" />
        </>
      );
    case "book":
      return (
        <>
          <path
            d="M34 84 60 90v20L34 104Z"
            fill="#fff"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M86 84 60 90v20l26-6Z"
            fill="#fff"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M40 92l14 3M40 98l14 3M80 92l-14 3M80 98l-14 3"
            stroke="#9ca3af"
            strokeWidth="1.5"
          />
        </>
      );
    case "pencil":
      return (
        <g transform="rotate(30 88 86)">
          <rect
            x="84"
            y="60"
            width="9"
            height="36"
            fill={GOLD}
            stroke={INK}
            strokeWidth="2"
          />
          <rect
            x="84"
            y="60"
            width="9"
            height="7"
            fill="#fb7185"
            stroke={INK}
            strokeWidth="2"
          />
          <path
            d="M84 96h9l-4.5 10Z"
            fill="#fde68a"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      );
    case "trophy":
      return (
        <>
          <path
            d="M46 78h28v10a14 14 0 0 1-28 0Z"
            fill={GOLD}
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M46 82h-6a6 6 0 0 0 6 10M74 82h6a6 6 0 0 1-6 10"
            fill="none"
            stroke={INK}
            strokeWidth="2"
          />
          <path
            d="M60 102v6M52 110h16"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    case "speech":
      return (
        <>
          <rect
            x="76"
            y="4"
            width="40"
            height="28"
            rx="11"
            fill="#fff"
            stroke={INK}
            strokeWidth="2"
          />
          <path
            d="M84 31l-4 9 13-9Z"
            fill="#fff"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <text
            x="96"
            y="24"
            fontSize="15"
            fontWeight="700"
            textAnchor="middle"
            fill={INK}
          >
            Hi!
          </text>
        </>
      );
  }
}

/**
 * A panda mascot, drawn in SVG, holding or wearing the given accessory. It is
 * decoration: hidden from assistive technology, sized by `className`.
 */
export function Mascot({ accessory, ...props }: MascotProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-accessory={accessory}
      {...props}
    >
      {/* body and legs */}
      <ellipse
        cx="60"
        cy="92"
        rx="30"
        ry="26"
        fill="#fff"
        stroke={INK}
        strokeWidth="2"
      />
      <ellipse cx="41" cy="113" rx="12" ry="7" fill={INK} />
      <ellipse cx="79" cy="113" rx="12" ry="7" fill={INK} />
      {/* ears and head */}
      <circle cx="36" cy="30" r="10" fill={INK} />
      <circle cx="84" cy="30" r="10" fill={INK} />
      <circle cx="60" cy="56" r="30" fill="#fff" stroke={INK} strokeWidth="2" />
      {/* face */}
      <ellipse
        cx="47"
        cy="54"
        rx="7"
        ry="9"
        transform="rotate(-15 47 54)"
        fill={INK}
      />
      <ellipse
        cx="73"
        cy="54"
        rx="7"
        ry="9"
        transform="rotate(15 73 54)"
        fill={INK}
      />
      <circle cx="48" cy="53" r="2.6" fill="#fff" />
      <circle cx="72" cy="53" r="2.6" fill="#fff" />
      <ellipse cx="60" cy="66" rx="4.5" ry="3.2" fill={INK} />
      <path
        d="M54 71c1.5 2.5 3.6 3.5 6 3.5s4.5-1 6-3.5"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* arms */}
      <ellipse
        cx="33"
        cy="90"
        rx="8"
        ry="16"
        transform="rotate(18 33 90)"
        fill={INK}
      />
      <ellipse
        cx="87"
        cy="90"
        rx="8"
        ry="16"
        transform="rotate(-18 87 90)"
        fill={INK}
      />
      <Accessory accessory={accessory} />
    </svg>
  );
}
