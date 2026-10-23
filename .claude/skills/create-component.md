---
name: create-component
description: Tạo component mới trong design system Paper & Progress. Kích hoạt khi user yêu cầu tạo component, build component, hoặc add component.
---

# Create Component

## Bước 1 - Xác định category

Hỏi hoặc tự xác định component thuộc category nào:

- navigation (Navbar, Sidebar, Tabs, Breadcrumbs, Pagination, Stepper, Menu, CommandMenu)
- actions (Button, IconButton, LinkButton, ButtonGroups, SplitButton, CopyButton, ShareButton, FloatingActionButton)
- forms (Input, Textarea, Checkbox, RadioGroup, Switch, Select, Combobox, DatePicker, NumberInput, Slider, FileUpload, FormField)
- data-display (Card, StatCard, Table, DataGrid, Avatar, Avatar, Badge, ProgressBar, Rating, Timeline, Accordion, Carousel, CodeBlock)
- feedback (Alert, Toast, Tooltip, Skeleton, Spin, EmptyState, ErrorState)
- overlay (Dialog, AlertDialog, Drawer, Popover, DropdownMenu, ContextMenu, CommandPalette, Modal)
- media (Image, VideoPlayer, AudioPlayer, MediaEmbed, Lightbox, ImageGallery)

## Bước 2 - Tạo folder & files

```bash
mkdir -p src/design-system/components/<category>/<ComponentName>
```

Tạo 3 files: `<ComponentName>.tsx`, `<ComponentName>.test.tsx`, `index.ts`

## Bước 3 - Component code (React 19 pattern)

```tsx
import { type ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/design-system";

const componentNameVariants = cva(
  "inline-flex items-center justify-center transition-colors duration-[var(--duration-fast)]",
  {
    variants: {
      variant: {
        default: "",
        primary: "",
        secondary: "",
      },
      size: {
        compact: "",
        default: "",
        comfortable: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ComponentNameProps
  extends
    Omit<ComponentProps<"div">, "">,
    VariantProps<typeof componentNameVariants> {
  //component-specific props
}

export function ComponentName({
  className,
  variant,
  size,
  ref,
  children,
  ...props
}: ComponentNameProps) {
  return (
    <div
      ref={ref}
      className={cn(componentNameVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

## Bước 4 - Test code

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  it("renders without crashing", () => {
    render(<ComponentName>Test</ComponentName>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    unmount();
  });
  it("renders each variant", () => {
    const vairants = ["default", "primary", "secondary"] as const;
    variants.forEach((variant) => {
      const { unmount } = render(
        <ComponentName variant={variant}>Test</ComponentName>,
      );
    });
  });
  it("forwards ref", () => {
    const ref = { current: null };
    render(<ComponentName ref={ref}>Test</ComponentName>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it("merges custom className", () => {
    render(<ComponentName className="custom-class">Test</ComponentName>);
    expect(screen.getByText("Test")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ComponentName>Test</ComponentName>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

## Bước 5 - Barrel export

`index.ts`:

```tsx
export { ComponentName } from "./ComponentName";
export type { ComponentNameProps } from "./ComponentName";
```

## Bước 6 - Thêm vào design-system/index.ts

```tsx
export {
  ComponentName,
  type ComponentNameProps,
} from "./components/<category>/<ComponentName>";
```

## Checklist cuối

- [] ref nhận qua props (KHÔNG forwardRef)
- [] Props extends ComponentProps<"element"> (React19)
- [] cva cho variants
- [] cn() cho className
- [] Named export only (KHÔNG default export)
- [] States: hover, focus, active, active, disabled (nếu interactive)
- [] Loading state (nếu async)
- [] Keyboard accessible
- [] aria attributes
- [] Responsive mobile-first
- [] prefers-reduced-motion (nếu có animation)
- [] jest-axe test pass
- [] Export từ design-system/index.ts
