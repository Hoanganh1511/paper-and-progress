# Paper & Progress

## Tech stack

- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS v4 (dùng @theme + CSS custom properties làm token resource)
- React 19
- Lucide React (icon library)
- cva (class-variance-authority) cho component variants
- clsx + tailwind-merge cho className composition
- Vitest + React Testing Library cho testing

## Kiến trúc

- `src/design-system/` - UI components không chứa business logic
- `src/features/` - domain logic, data fetching, state management
- `src/app/` - routing, page composition, data integration
- Design system components KHÔNG ĐƯỢC import từ `features/` hoặc `app/`
- Features CÓ THỂ import từ `design-system/`
- Domain components (ArticleCard, ProductCard) thuộc `features/`, KHÔNG thuộc `design-system/`

## Quy ước đặt tên

- Component file + export: PascalCase (Button.tsx, export const Button)
- Hook: use + camelCase (useTheme, useToats)
- Utility function: camelCase (calculateProgress, formatDate)
- Type/Interface: PascalCase, suffix Props cho component props (Button Props, CardProps)
- CSS token: kebab-case (--color-accent-lime, --space-4)
- Variant prop value: semantic name (variant = "warning"), KHÔNG dùng tên màu (variant ="pink")
- Boolean props: is/has/show/enable prefix (isCompleted, showIcon, hasError, enableAnimation)
- Test file: cùng tên + .test.tsx (Button.test.tsx)
- Index file: barrel export, không chứa logic

## Component rules

- Không dùng forwardRef - ref nhận trực tiếp qua props (React 19 feature)
- Không cần displayName - React DevTools dùng function name
- Chỉ named exoprt, KHÔNG default export
- Variants dùng cva (class-variance-authority)
- className composition dùng cn() = clsx + twMerge
- Mỗi component folder chứa: ComponentName.tsx, ComponentName.test.tsx, index.ts
- Props interface extends React.ComponentProps<"element"> (đã include ref trong React 19)
- Export từ design-system/index.ts

## Design tokens (xác định trong @theme, CSS file)

- Ink: #171717 (text, borders, primary actions)
- Paper: #F8F7F2 (page background)
- Surface: #FFFFFF (cards, inputs, dialogs)
- Muted: #737373 (metadata, secondary text)
- Border subtle: #D6D6D0
- Accent lime: #D8F75A (primary highlight, selected)
- Accent pink: #FF9CCB (editorial, secondary highlight)
- Accent yellow: #FFD56A (caution, milestone)
- Accent blue: #8CAEFF (progress, info)
- 75-85% interface là neutral về MÀU; accent chỉ cho meaningful data/state/emphasis

## Phong cách: Neo-brutalism (áp dụng cho TOÀN BỘ interface)

- Border cứng 2px `border-border-strong` (ink; đảo sang sáng ở dark mode) thay cho border mờ. Dùng cho button, input, select, checkbox/radio, card, table, dialog, drawer, menu, popover, toast, alert
- Mọi elevation là hard offset shadow, KHÔNG blur: `shadow-raised` 2px (card), `shadow-floating` 4px (menu, dropdown, toast, tooltip), `shadow-modal` 6px (dialog, drawer), `shadow-accent` 4px (button). KHÔNG dùng shadow có blur
- Bo góc vừa: `rounded-standard` (8px) là mặc định; `rounded-pill` chỉ cho badge, avatar, nút tròn
- Nền trắng (`surface-card`) hoặc pastel (accent) trên nền paper
- Active state của phần tử bấm được (button, nút chọn): `active:translate-x-0.5 active:translate-y-0.5 active:shadow-none` (nút "bị nhấn xuống"). Trạng thái đang chọn/hiện tại (`aria-current`, `aria-pressed`) giữ nguyên dạng đã nhấn
- Ngoại lệ duy nhất: `Button variant="ghost"` (nút trong suốt) và đường kẻ phân cách trong bảng/danh sách vẫn phẳng
- Khi tạo component mới, lấy màu viền và bóng từ các token trên, KHÔNG tự đặt border/shadow riêng
- Hover/focus/active vẫn phải tôn trọng `prefers-reduced-motion` (`motion-reduce:transition-none`)

## Typography

- Space Grotesk: display, headings, prominent numbers
- Inter: body, forms, dense data
- Caveat: CHỈ cho short decorative annotations, KHÔNG dùng cho body/label/heading

## Spacing scale

- 4,8,12,16,20,24,32,48,64,96px (mapped tới --spacing-1 đến --spacing-24)

## Layout trang (BẮT BUỘC khi tạo trang mới)

- Body của MỌI trang trong `src/app/` phải cùng chiều rộng và lề ngang với header: bọc nội dung bằng `PageContainer size="wide"` (hoặc `Container size="wide"` khi đã có padding riêng) từ `@/design-system`
- KHÔNG tự đặt `max-w-*`, `mx-auto`, `px-*` cho khung ngoài cùng của trang; header (`AppHeader`) dùng `Container size="wide"`, trang phải khớp
- Ngoại lệ chỉ khi trang cố ý hẹp hơn (form đăng nhập, trang đọc): dùng `size="narrow"` hoặc `size="default"`, không dùng giá trị tuỳ ý
- Sau khi tạo trang, so chiều rộng với header trước khi báo xong

## Accessibility (bắt buộc cho MỌI component)

- Keyboard accessible, focus ring visible
- Form: label + description + error linked qua htmlFor/aria-describedly
- Touch target tối thiểu 44x44px
- Không dùng color alone để convey status
- Support prefers-reduced-motion
- Semantic HTML, correct heading hierarchy
- Test với jest-axe trong mỗi component test

## ESLint

- Dùng flat config: eslint.config.mjs
- Chạy: npx eslint . --max-warnings 0
- KHÔNG dùng next lint (deprecated)
