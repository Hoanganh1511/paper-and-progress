import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
const gridVariants = cva("grid", {
  variants: {
    columns: {
      1: "",
      2: "",
      3: "",
      4: "",
      6: "",
      12: "",
    },
    gap: {
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
    },
    responsive: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    // Fixed columns at every breakpoint
    { responsive: false, columns: 1, className: "grid-cols-1" },
    { responsive: false, columns: 2, className: "grid-cols-2" },
    { responsive: false, columns: 3, className: "grid-cols-3" },
    { responsive: false, columns: 4, className: "grid-cols-4" },
    { responsive: false, columns: 6, className: "grid-cols-6" },
    { responsive: false, columns: 12, className: "grid-cols-12" },
    // Mobile 1 col, tablet 2 cols, desktop uses `columns`
    { responsive: true, columns: 1, className: "grid-cols-1" },
    { responsive: true, columns: 2, className: "grid-cols-1 sm:grid-cols-2" },
    {
      responsive: true,
      columns: 3,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    },
    {
      responsive: true,
      columns: 4,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
    {
      responsive: true,
      columns: 6,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-6",
    },
    {
      responsive: true,
      columns: 12,
      className: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-12",
    },
  ],
  defaultVariants: {
    columns: 1,
    gap: 4,
    responsive: true,
  },
});

export interface GridProps
  extends ComponentProps<"div">, VariantProps<typeof gridVariants> {}

export function Grid({
  columns,
  gap,
  responsive,
  className,
  ref,
  ...props
}: GridProps) {
  return (
    <div
      ref={ref}
      className={cn(gridVariants({ columns, gap, responsive }), className)}
      {...props}
    />
  );
}
