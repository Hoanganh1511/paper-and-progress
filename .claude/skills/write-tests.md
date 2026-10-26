---
name: write-tests
description: Write test for component or feature. Active when user request test, write, add test or test.
---

# Write Tests

## Setup

- Framework: Vitest + React Testing Library + @testing-library/jest-dom + jest-axe
- File placed in the same directory

## Design system component test structure

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  // 1. Render
  it("renders without crashing", () => {});
  it("renders children correctly", () => {});

  // 2. Variants - one test per variant
  it("applies default variant", () => {});
  it("applies primary variant", () => {});

  // 3. Sizes
  it("applies compact size", () => {});
  it("applies default size", () => {});
  it("applies comfortable size", () => {});

  // 4. Props
  it("forwards ref", () => {});
  it("merges custom className", () => {});
  it("spreads additional HTML props", () => {});

  // 5. States (if interactive)
  it("handles disabled state", () => {});
  it("shows loading state", () => {});

  // 6. Interaction (if interactive)
  it("calls onClick handler", async () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick}>Click</ComponentName>);
    await userEvent.click(screen.getByText("Click"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  // 7. Keyboard (if interactive)
  it("activates on Enter key", async () => {});
  it("activates on Space key", async () => {});

  // 8. Accessibility
  it("has no accessibility violations", async () => {
    const { container } = render(<ComponentName>Test</ComponentName>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

## Run Test

```base
npx vitest run              # chạy tất cả
npx vitest run Button       # chạy test cho Button
npx vitest run --coverage   # với coverage report
npx vitest                  # watch mode
```
