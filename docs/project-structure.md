# Cấu trúc thư mục – Paper & Progress

Cập nhật: 2026-10-28 (nhánh `feat/auth-screens`).

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · Vitest + RTL.

## Tổng quan

```text
paper-and-progress/
├── .claude/            # Cấu hình Claude Code (hooks, skills, settings)
├── .husky/             # Git hook (pre-commit)
├── content/devlog/     # Nội dung devlog dạng markdown (YYYY-MM-DD-slug.md)
├── docs/               # Tài liệu dự án
├── public/             # Static assets (svg)
├── scripts/            # Script tiện ích (contrast-audit.mjs)
├── src/
│   ├── app/            # Routing, page composition, data integration
│   ├── design-system/  # UI components thuần, không chứa business logic
│   ├── features/       # Domain logic, data, state, domain components
│   └── test-setup.ts   # Setup Vitest
├── AGENTS.md / CLAUDE.md   # Hướng dẫn cho AI agent / quy ước dự án
├── AUDIT.md · README.md · learning-journal.md
├── eslint.config.mjs   # ESLint flat config
├── next.config.ts · tsconfig.json · vitest.config.ts
├── .prettierrc.json · package.json
└── docs.zip            # (chưa track)
```

## Quy tắc phụ thuộc

```text
app  ──►  features  ──►  design-system
```

- `design-system/` KHÔNG import từ `features/` hoặc `app/`.
- `features/` có thể import từ `design-system/`.
- Domain component (ArticleCard, BookmarkCard...) thuộc `features/`.
- Hook `.claude/hooks/check-imports.sh` kiểm tra quy tắc này.

## `src/app/` – Routing

Route group `(application)` dùng chung app shell, `(auth)` dùng layout auth riêng. Mỗi route có `page.tsx`, `loading.tsx`, `error.tsx`.

```text
src/app/
├── layout.tsx · globals.css (design tokens @theme) · globals.test.ts · favicon.ico
├── (application)/
│   ├── (home)/                       # /
│   ├── bookmarks/                    # /bookmarks
│   ├── devlog/                       # /devlog (+ feed.xml/route.ts: RSS)
│   ├── learn/                        # /learn
│   ├── profile/                      # /profile (xem hồ sơ: Tổng quan, Chuyên môn, Hoạt động, Nội dung)
│   ├── settings/                     # /settings (chỉnh sửa: hồ sơ, bảo mật, tùy chọn, liên kết, thanh toán)
│   └── goals/
│       ├── english/                  # /goals/english
│       └── tech/                     # /goals/tech
│           └── backend-tutor/        # /goals/tech/backend-tutor
└── (auth)/
    ├── layout.tsx
    ├── login/ · register/ · forgot-password/ · reset-password/
    └── verify-email/ · mfa-challenge/ · account-suspended/
```

## `src/design-system/` – UI components

Mỗi component là một folder: `Name.tsx`, `Name.test.tsx`, `index.ts` (barrel). Export tổng từ `design-system/index.ts`.

```text
src/design-system/
├── CLAUDE.md                # Quy ước riêng của design system
├── index.ts
├── components/
│   ├── actions/        # Button (Button, IconButton, LinkButton, buttonVariants), LayoutToggle
│   ├── data-display/   # Badge, Card (+Header/Content/Footer), Carousel, ProgressBar, Table (+8 phần)
│   ├── feedback/       # Alert, EmptyState, ErrorState, Skeleton, Spinner, Toast (+Provider/Context), Tooltip
│   ├── forms/          # Checkbox, Combobox, FormField, Input, PasswordInput, RadioGroup,
│   │                   # SearchInput, Select (+Root/Trigger/Content/Item/Group), Switch, Textarea
│   ├── media/          # AudioPlayer, Image, ImageGallery, Lightbox, MediaEmbed, VideoPlayer
│   ├── navigation/     # Breadcrumbs, Pagination, Tabs (+TabList/TabTrigger/TabPanel)
│   └── overlay/        # AlertDialog, Dialog, Drawer, DropdownMenu
├── primitives/         # Container, FocusRing, Grid, Icon, Inline, Separator, Spacer, Stack, Surface, Text
├── layouts/            # AppShell, DashboardLayout, MarketingLayout, PageContainer, PageHeader, SkipLink
├── patterns/
│   ├── crud/           # CreateEditForm, DataListPage, DeleteConfirmDialog
│   └── search/         # FilterPanel
├── hooks/              # useEscapeKey, useFocusTrap, useIsClient, useOverlayLayer,
│                       # usePrefersReducedMotion, useScrollLock
├── theme/              # ThemeScript, theme.ts, useTheme (light/dark)
└── utils/              # cn (clsx + tailwind-merge), mergeRefs
```

## `src/features/` – Domain

Mỗi feature có `index.ts` (barrel), thường kèm `components/`, `data.ts`, `types.ts`.

| Feature | Vai trò | Nội dung chính |
|---|---|---|
| `auth/` | Đăng nhập/đăng ký qua backend NestJS (JWT) | `components/` (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, MfaChallenge, OTPVerification, AccountSuspended, SessionExpired, AuthSplash, shared/), `screens/` (ghép component thành màn hình), `provider/` (AuthProvider, AuthContext, AuthGate, GuestGate, SessionHeader), `hooks/` (useAuth), `authApi.ts` (axios + refresh queue), `validation.ts`, `labels.ts`, `messages.ts` |
| `bookmarks/` | Quản lý bookmark | BookmarkManager, BookmarkCard, BookmarkRow, BookmarkThumbnail, BookmarkActions, BulkActionBar, FolderTree · `filterBookmarks.ts`, `data.ts`, `types.ts`, `labels.ts` |
| `devlog/` | Nhật ký phát triển | DevlogBrowser, DevlogEntryCard, DevlogPreview, DevlogTimeline, ProjectStatusPanel · `parseEntry.ts` (đọc `content/devlog`), `rss.ts`, `status.ts` |
| `english/` | Mục tiêu tiếng Anh | EnglishGoals, Mascot, TopicCard · `data.ts`, `types.ts` |
| `footer/` | Footer ứng dụng | AppFooter, FooterLink |
| `header/` | Header ứng dụng | AppHeader, `icons.tsx` |
| `launcher/` | Lưới module trang chủ | ModuleGrid, ModuleGridItem · `data.ts`, `types.ts` |
| `learning/` | Learning hub | LearningHub, CategoryNav, DomainView, LearningItemCard · hook `useScrollSpy` |
| `tech/` | Tech hub (Công nghệ thông tin) | TechHub, TechItemTile · `data.ts`, `types.ts` |
| `tutor/` | Step Tutor (Backend) | StepTutor, TutorBlocks, RichText · hooks `useLocationHash`, `useTutorProgress` · `data.ts`, `types.ts` |

## Quy ước file

- Component: `PascalCase.tsx`, named export, không default export, không `forwardRef`.
- Test: cùng tên + `.test.tsx` (design-system test kèm jest-axe).
- Hook: `useXxx.ts`; util: `camelCase.ts`.
- `index.ts` chỉ barrel export, không chứa logic.

## Tooling

- `.claude/hooks/pre-commit.sh`, `.husky/pre-commit`: kiểm tra trước commit.
- `.claude/skills/`: `create-component.md`, `create-page.md`, `write-tests.md`.
- Lệnh lint: `npx eslint . --max-warnings 0` (không dùng `next lint`).
- Tài liệu liên quan: `docs/backend-tutor.md`, `AUDIT.md`, `learning-journal.md`.
