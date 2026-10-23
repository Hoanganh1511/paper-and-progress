# Design System Rules

## Boundary

- KHÔNG import từ src/features/
- KHÔNG import từ src/app/
- Component ở đây là generic - Card không biết nó chứa article, product hay course
- Nếu component cần business concept -> nó thuộc features/ , không thuộc đây

## Definition of done cho mỗi component

1. TypeScript props interface rõ ràng, extends React.ComponentProps<"element">
2. ref nhận qua props (React 19), KHÔNG dùng forwardRef
3. Đủ variants và sizes theo design spec
4. States: default, hover, active, focus, disabled, loading, error, error (where applicable)
5. Responsive: mobile-first, hoạt động ở mọi breakpoint
6. Keyboard accessible: Tab, Enter, Space, Escape, Arrow keys (where applicable)
7. aria attributes: aria-label, aria-describedby, aria-expanded, role (where applicable)
8. jest-axe test pass
9. Export từ design-system/index.ts

## Overlay components (Dialog, Drawer, Popover, DropdownMenu, CommandPalette)

- Share focus trap logic
- Escape key đóng overlay gần nhất, không đóng tất cả
- Click outside đóng overlay
- Z-index theo layer: dropdown (200) < overlay (300) < modal (400) < toast (500)
- Mobile: Dialog thành bottom sheet, Drawer full-width
