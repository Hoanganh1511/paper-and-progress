---
title: "Design system: token, primitive và component nền"
date: 2026-10-26
tags: [design-system, frontend, a11y]
module: design-system
status: in_progress
progress: 35
phase: 2/6
---

Xong bộ token (Ink, Paper, accent lime/pink/yellow/blue), các primitive layout và những component dùng nhiều nhất: Button, Input, Select, Dialog, Table, Tabs.

Mọi component đều có test jest-axe, nhận `ref` qua props (React 19) và dùng `cva` cho variant.

```tsx
export function Badge({ variant, size, className, ref, ...props }: BadgeProps) {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
```
