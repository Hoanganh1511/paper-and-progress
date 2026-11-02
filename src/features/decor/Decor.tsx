import type { ComponentProps } from "react";

const INK = "#171717";
const LIME = "#d8f75a";
const PINK = "#ff9ccb";
const BLUE = "#8caeff";
const YELLOW = "#ffd42a";

type SvgProps = Omit<ComponentProps<"svg">, "children">;

const decorative = {
  "aria-hidden": true,
  focusable: false,
} as const;

/** A short dash in yellow with a black edge, the flick used around titles. */
function Dash({ from, to }: { from: [number, number]; to: [number, number] }) {
  const d = `M${from[0]} ${from[1]}L${to[0]} ${to[1]}`;
  return (
    <>
      <path d={d} stroke={INK} strokeWidth="8" strokeLinecap="round" />
      <path d={d} stroke={YELLOW} strokeWidth="4.5" strokeLinecap="round" />
    </>
  );
}

export type TicksCorner = "top-left" | "top-right";

/** Where the rays start, and how far they go: they leave the corner, none along the text. */
const INNER = 9;
const OUTER = 19;

/** Unit directions of the three rays, in the order up, diagonal, sideways. */
const DIRECTIONS: Record<TicksCorner, [number, number][]> = {
  "top-left": [
    [0, -1],
    [-0.643, -0.766],
    [-0.985, -0.174],
  ],
  "top-right": [
    [0, -1],
    [0.643, -0.766],
    [0.985, -0.174],
  ],
};

/**
 * Three yellow flicks that fan out from a corner of the thing they decorate:
 * straight up, up and outwards, and straight outwards, like sparks thrown off
 * it. The drawing's own corner nearest the text (the bottom right for a
 * `top-left` fan, the bottom left for `top-right`) is where they start, so put
 * that corner on the corner of the text. Decoration.
 */
export function Ticks({
  corner = "top-left",
  ...props
}: SvgProps & { corner?: TicksCorner }) {
  const origin: [number, number] = corner === "top-left" ? [46, 38] : [2, 38];
  return (
    <svg
      viewBox="0 0 48 40"
      fill="none"
      data-decor="ticks"
      data-corner={corner}
      {...decorative}
      {...props}
    >
      {DIRECTIONS[corner].map(([dx, dy]) => (
        <Dash
          key={`${dx},${dy}`}
          from={[origin[0] + dx * INNER, origin[1] + dy * INNER]}
          to={[origin[0] + dx * OUTER, origin[1] + dy * OUTER]}
        />
      ))}
    </svg>
  );
}

/** A four-pointed star with a black edge. Decoration. */
export function Star({ className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      data-decor="star"
      className={className}
      {...decorative}
      {...props}
    >
      <path
        d="M12 2c1.2 5.2 3.8 7.8 10 10-6.2 2.2-8.8 4.8-10 10-1.2-5.2-3.8-7.8-10-10 6.2-2.2 8.8-4.8 10-10z"
        fill={YELLOW}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A panda at a laptop that shows `</>`, with two books beside it: the picture
 * of the library's hero. Black outlines, a lime screen, a pink and a blue book.
 * Decoration, hidden from assistive technology.
 */
export function PandaCoder(props: SvgProps) {
  const stroke = {
    stroke: INK,
    strokeWidth: 3,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const;
  return (
    <svg
      viewBox="0 0 340 190"
      fill="none"
      data-decor="panda-coder"
      {...decorative}
      {...props}
    >
      {/* books */}
      <rect
        x="212"
        y="122"
        width="116"
        height="28"
        rx="7"
        fill={BLUE}
        {...stroke}
      />
      <path
        d="M222 136h96"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="222"
        y="92"
        width="104"
        height="28"
        rx="7"
        fill={PINK}
        {...stroke}
      />
      <path
        d="M232 106h82"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* body */}
      <ellipse cx="170" cy="152" rx="64" ry="34" fill="#fff" {...stroke} />
      {/* ears and head */}
      <circle cx="139" cy="40" r="14" fill={INK} />
      <circle cx="201" cy="40" r="14" fill={INK} />
      <circle cx="170" cy="72" r="38" fill="#fff" {...stroke} />
      <ellipse
        cx="155"
        cy="68"
        rx="10"
        ry="13"
        fill={INK}
        transform="rotate(-18 155 68)"
      />
      <ellipse
        cx="185"
        cy="68"
        rx="10"
        ry="13"
        fill={INK}
        transform="rotate(18 185 68)"
      />
      <circle cx="156" cy="66" r="4.5" fill="#fff" />
      <circle cx="184" cy="66" r="4.5" fill="#fff" />
      <ellipse cx="170" cy="83" rx="6" ry="4" fill={INK} />
      <path
        d="M163 90q7 6 14 0"
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* laptop */}
      <path d="M26 152l30-58h98l-20 58z" fill={LIME} {...stroke} />
      <path d="M16 152h130l9 12H8z" fill="#fff" {...stroke} />
      <text
        x="90"
        y="134"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fill={INK}
        fontFamily="ui-monospace, monospace"
      >
        {"</>"}
      </text>
      {/* paws on the laptop */}
      <ellipse cx="150" cy="128" rx="13" ry="9" fill={INK} />
      <ellipse cx="136" cy="142" rx="13" ry="9" fill={INK} />
    </svg>
  );
}

/**
 * A browser window with `</>` and a mouse arrow, for the head of the
 * technology domain. Decoration, hidden from assistive technology.
 */
export function BrowserCode(props: SvgProps) {
  const stroke = {
    stroke: INK,
    strokeWidth: 3,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const;
  return (
    <svg
      viewBox="0 0 170 130"
      fill="none"
      data-decor="browser-code"
      {...decorative}
      {...props}
    >
      <rect x="22" y="14" width="112" height="86" rx="10" fill={INK} />
      <rect
        x="16"
        y="8"
        width="112"
        height="86"
        rx="10"
        fill="#fff"
        {...stroke}
      />
      <path d="M16 30h112" {...stroke} />
      <path d="M26 18a8 8 0 0 1 8-8h86a8 8 0 0 1 8 8v12H16V18z" fill={BLUE} />
      <path d="M16 30h112" {...stroke} />
      <circle cx="28" cy="20" r="3" fill="#fff" />
      <circle cx="39" cy="20" r="3" fill="#fff" />
      <circle cx="50" cy="20" r="3" fill="#fff" />
      <text
        x="72"
        y="73"
        textAnchor="middle"
        fontSize="32"
        fontWeight="800"
        fill="#d946ef"
        fontFamily="ui-monospace, monospace"
      >
        {"</>"}
      </text>
      <path d="M116 84l24 12-10 3 7 12-6 3-7-12-8 8z" fill="#fff" {...stroke} />
    </svg>
  );
}

/**
 * A panda that looks up over a lime hill, with a star and a few flicks: it
 * sits at the end of a bar of buttons. Only its head and paws show above the
 * hill. Decoration, hidden from assistive technology.
 */
export function PandaPeek(props: SvgProps) {
  const stroke = {
    stroke: INK,
    strokeWidth: 3,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  } as const;
  return (
    <svg
      viewBox="0 0 220 110"
      fill="none"
      data-decor="panda-peek"
      {...decorative}
      {...props}
    >
      <g stroke={YELLOW} strokeWidth="4" strokeLinecap="round">
        <path d="M168 10l5 9M178 4l3 10M158 6l-1 10" />
      </g>
      <path
        d="M4 108C20 72 52 62 84 78c14-30 52-34 74-6 20-14 44-4 58 36z"
        fill={LIME}
        {...stroke}
      />
      <circle cx="96" cy="36" r="13" fill={INK} />
      <circle cx="148" cy="36" r="13" fill={INK} />
      <circle cx="122" cy="62" r="36" fill="#fff" {...stroke} />
      <ellipse
        cx="108"
        cy="58"
        rx="9"
        ry="12"
        fill={INK}
        transform="rotate(-18 108 58)"
      />
      <ellipse
        cx="136"
        cy="58"
        rx="9"
        ry="12"
        fill={INK}
        transform="rotate(18 136 58)"
      />
      <circle cx="109" cy="56" r="4" fill="#fff" />
      <circle cx="135" cy="56" r="4" fill="#fff" />
      <ellipse cx="122" cy="73" rx="6" ry="4" fill={INK} />
      <ellipse cx="96" cy="104" rx="14" ry="9" fill={INK} />
      <ellipse cx="148" cy="104" rx="14" ry="9" fill={INK} />
      <path
        d="M46 40l3.5 8 8 3.5-8 3.5L46 63l-3.5-8-8-3.5 8-3.5z"
        fill={YELLOW}
        {...stroke}
        strokeWidth="2"
      />
    </svg>
  );
}
