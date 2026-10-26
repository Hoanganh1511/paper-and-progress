# Accessibility audit — Paper & Progress design system

- **Ngày:** 2026-10-26
- **Phạm vi:** toàn bộ `src/design-system/` (primitives, components, patterns, layouts, hooks), `src/features/auth/` và token trong `src/app/globals.css`.
- **Chuẩn so sánh:** WCAG 2.2 mức AA và checklist "Accessibility" trong `CLAUDE.md`.
- **Trạng thái:** mọi phát hiện bên dưới đều **chưa sửa**. File này chỉ ghi lại; không có component nào bị đổi khi audit.

## 1. Tóm tắt

Cấu trúc và hành vi tốt: mọi component có test jest-axe không lỗi, bàn phím được kiểm chứng bằng `userEvent`, focus được quản lý đúng ở overlay, form có label/description/lỗi liên kết với nhau, vùng bấm đạt 44px. Vấn đề tập trung ở **màu sắc và token**, là thứ jest-axe không kiểm tra được trong jsdom:

| Mức | Số lượng | Nội dung chính |
| --- | --- | --- |
| High | 5 | Token hỏng trong `globals.css`; viền ô nhập và focus ring không đủ 3:1; chữ `muted` không đủ 4.5:1; không hỗ trợ forced-colors (Windows High Contrast) |
| Medium | 7 | Phần tử focus bị header/bottom nav che; bảng cuộn không focus được; kết quả lọc không được đọc; video không bắt buộc phụ đề; icon accent; thiếu `color-scheme`; link nhỏ hơn 44px |
| Low | 7 | Toast live-region; chuỗi tiếng Anh cố định; Checkbox/Switch ngoài FormField; Badge chỉ bằng màu; control không nhãn; tooltip trên cảm ứng; dialog không `inert` |
| Info | 2 | Cấp heading mặc định; tiêu đề trang mặc định của Next |

**Nên sửa trước:** 01 (là lỗi chức năng), 02, 03, 04 (đều là đổi giá trị token, đã có gợi ý đã tính sẵn bên dưới), rồi 05.

## 2. Cách kiểm tra

| Cách | Làm được gì | Giới hạn |
| --- | --- | --- |
| **jest-axe** trong 64 file test component (tổng 70 file test, 674 test; 6 file còn lại là hook không có UI) | Cấu trúc ARIA, tên truy cập, label, landmark, thứ tự heading, id trùng | jsdom không có layout và không nạp CSS: **không kiểm tra được contrast, kích thước vùng bấm, trạng thái hiển thị** |
| **Test bàn phím** bằng `userEvent` | Tab, mũi tên, Home/End, Enter, Space, Escape, trả focus, focus trap | Không phải trình duyệt thật |
| **Tính contrast** bằng `scripts/contrast-audit.mjs` (đọc thẳng `globals.css`, công thức WCAG 2.x) | Tỷ lệ cho 39 cặp màu thực sự được dùng, ở cả light và dark | Chỉ là token; không tính màu bị chồng alpha (trừ ghi chú) |
| **Đọc code** | Class Tailwind, ARIA, các chuỗi cố định, `overflow`, `sticky` | Không thay thế được test thật |

**Chưa làm (cần người hoặc môi trường thật):** thử bằng NVDA / VoiceOver / TalkBack; Windows High Contrast thật; zoom 200–400% và reflow ở 320px; thiết bị cảm ứng; axe chạy trên trang có CSS thật (Playwright + `@axe-core/playwright`). Xem mục 7.

Chạy lại: `node scripts/contrast-audit.mjs` (thêm `--markdown` để ra bảng) và `npm test`.

## 3. Phát hiện

Mỗi mục: **mức · tiêu chí WCAG · vị trí**. Gợi ý giá trị màu đã được tính contrast.

### Mức High

#### 01 · Token hỏng trong `globals.css` (lỗi chức năng)
- **Vị trí:** `src/app/globals.css:94` (`--width;-container-default`), `:119` (`-z-dropdown`), `:16` (`--color-border-subtle` khai báo hai lần).
- **Vấn đề:** dấu `;` thừa làm token `--width-container-default` không tồn tại, nên `Container size="default"` (và `PageContainer` mặc định) **không có max-width**: nội dung giãn hết cỡ màn hình, ảnh hưởng reflow và độ dài dòng (SC 1.4.10). `-z-dropdown` thiếu một dấu `-` nên `z-[var(--z-dropdown)]` vô hiệu: menu, Select và Combobox mất z-index. Hai lỗi này đã được sửa một lần trong phiên làm việc, nhưng file hiện tại lại có chúng (có thể do một bản lưu cũ ghi đè).
- **Sửa:** `--width-container-default: 64rem;`, `--z-dropdown: 200;`, xóa khai báo `border-subtle` ở dòng 16 (giá trị cuối cùng, `#e5e5e0`, là cái đang có hiệu lực).
- **Trạng thái: đã sửa** khi tạo trang `/learn`, vì dấu `;` thừa còn làm `next build` thất bại ("Invalid custom property"). Cũng trong đợt đó, `@import url(...)` của Google Fonts được chuyển lên đầu `globals.css`: đặt sau `@import "tailwindcss"` thì trình duyệt bỏ qua, nên Space Grotesk / Inter / Caveat chưa từng được nạp.

#### 02 · Viền ô nhập không đạt 3:1 (SC 1.4.11 Non-text Contrast)
- **Vị trí:** `--color-border-default` (`globals.css:48`), dùng bởi `Input`, `Textarea`, `SelectTrigger`, `ComboboxInput`, `Badge` mặc định, `Card`/`Surface` viền.
- **Số đo:** `#d6d6d0` trên thẻ trắng **1.46:1**, trên nền trang **1.25:1** (cả dark: 1.46 và 1.68). Ô nhập chỉ nhận ra bằng viền nên phải đạt 3:1.
- **Sửa (gợi ý):** light `--color-border-default: #858580` (3.71 trên thẻ, 3.17 trên nền trang); dark khoảng `#707070` (≈3.1 trên thẻ). Có thể giữ màu nhạt hiện tại làm `--color-border-subtle` cho viền trang trí (card, table), vì viền trang trí không bị yêu cầu.

#### 03 · Focus ring không đủ tương phản ở light mode (SC 1.4.11, 2.4.7, 2.4.13)
- **Vị trí:** `--color-border-focus: #8caeff` (`globals.css:51`), dùng bởi `focusRingClasses` / `focusRingWithinClasses` và mọi component tương tác.
- **Số đo:** 1.87:1 trên nền trang, 2.18:1 trên thẻ, 1.69:1 trên `sunken`. Dark mode ổn (≥6.9).
- **Sửa (gợi ý):** light `#4f74e0` (4.28 thẻ, 3.66 nền trang, 3.31 sunken), giữ `#8caeff` cho dark. `#8caeff` vẫn dùng được như màu accent-blue.

#### 04 · Chữ `muted` không đủ 4.5:1 trên nền trang (SC 1.4.3)
- **Số đo:** `--color-text-muted #737373`: trên thẻ 4.74 (đạt), trên nền trang `#f0ede5` **4.05**, trên `sunken` **3.66**. Giá trị này từng đạt trên nền `#f8f7f2` cũ; đổi paper sang `#f0ede5` làm nó tụt xuống.
- **Bị ảnh hưởng (chữ nằm trên nền trang):** nhãn tab ở variant `underline` (`TabTrigger.tsx:23`), breadcrumbs (`Breadcrumbs.tsx:35`), mô tả trường (`FormField.tsx:72`), `TableCaption.tsx:12`, mô tả checkbox trong `CreateEditForm`.
- **Sửa (gợi ý):** `--color-text-muted: #656565` (5.83 thẻ, 4.98 nền trang, 4.50 sunken). Dark mode đã đạt.

#### 05 · Không hỗ trợ forced-colors / Windows High Contrast (SC 1.4.11, 1.4.1)
- **Vị trí:** chấm của `RadioItem` (`RadioItem.tsx:65`, `bg-text-inverse`), núm của `Switch` (`Switch.tsx:39`, `after:bg-surface`), nền khi chọn của `Checkbox`/`RadioItem`/`Switch` và nền mục đang chọn của `Tabs`/`AppShell` (`aria-[current=page]:bg-accent-lime`).
- **Vấn đề:** chế độ forced-colors bỏ `background-color`. Radio đã chọn mất chấm, Switch mất núm và track, mục điều hướng đang chọn mất nền; chỉ còn những thứ vẽ bằng `border`/SVG `currentColor`. Trạng thái bật/tắt trở nên không nhìn thấy.
- **Sửa:** thêm biến thể `forced-colors:` (Tailwind v4 có sẵn), ví dụ chấm radio dùng `forced-colors:bg-[CanvasText]`, núm switch `forced-colors:bg-[ButtonText]`, mục đang chọn thêm `forced-colors:border-[Highlight]` hoặc `outline`.

### Mức Medium

#### 06 · Phần tử đang focus có thể bị header / bottom nav che (SC 2.4.11 Focus Not Obscured)
- **Vị trí:** `AppShell.tsx:88` (header `sticky top-0`, cao 4rem) và thanh dưới `fixed bottom-0` (cao 4rem). Không có `scroll-padding` trong `globals.css`.
- **Sửa:** `html { scroll-padding-top: 5rem; scroll-padding-bottom: 5rem; }` (hoặc đặt trên vùng cuộn của layout).

#### 07 · Bảng rộng không cuộn được bằng bàn phím (SC 2.1.1)
- **Vị trí:** `Table.tsx:32` (`overflow-x-auto`).
- **Vấn đề:** vùng cuộn không focus được, người dùng bàn phím không cuộn ngang được khi bảng tràn.
- **Sửa:** thêm `tabIndex={0}`, `role="region"` và `aria-label` (qua prop `containerProps` hoặc `label`) cho khung cuộn; hoặc chỉ thêm khi nội dung thực sự tràn.

#### 08 · Số kết quả lọc không được thông báo (SC 4.1.3 Status Messages)
- **Vị trí:** `Combobox` (lọc khi gõ), `DataListPage` (tìm kiếm).
- **Vấn đề:** người dùng đọc màn hình không biết có bao nhiêu kết quả, hay không có kết quả (`ComboboxEmpty` dùng `role="presentation"` nên không được đọc).
- **Sửa:** thêm một live region `role="status"` (ẩn bằng `sr-only`) báo "3 kết quả" / "Không có kết quả".

#### 09 · Phụ đề video không bắt buộc (SC 1.2.2 Captions)
- **Vị trí:** `VideoPlayer.tsx:58` (`tracks = []`).
- **Vấn đề:** component cho phép không có track nào; jest-axe chỉ bắt được trong test, không trong ứng dụng.
- **Sửa:** làm `tracks` bắt buộc, kèm prop thoát có chủ đích (ví dụ `hasNoSpokenAudio`) và cảnh báo ở dev.

#### 10 · Màu accent dùng làm icon trên nền sáng (SC 1.4.11)
- **Vị trí:** `Icon` với `color="accent-lime | accent-pink | accent-yellow | accent-blue"`.
- **Số đo trên thẻ trắng:** lime 1.21, yellow 1.40, pink 1.93, blue 2.18 (cần 3:1 nếu icon mang nghĩa).
- **Sửa:** chỉ dùng chúng cho icon trang trí (`aria-hidden`), hoặc đặt icon trên nền tối / kèm nhãn chữ. Ghi chú vào doc của `Icon`.

#### 11 · Chưa khai báo `color-scheme` (hỗ trợ dark mode)
- **Vấn đề:** thanh cuộn, điều khiển `<video>`/`<audio>`, autofill và tooltip native vẫn là kiểu sáng khi dark mode bật.
- **Sửa:** `:root { color-scheme: light; } .dark { color-scheme: dark; }` (và trong khối `prefers-color-scheme: dark`).

#### 12 · Link nhỏ hơn 44px (quy tắc `CLAUDE.md`; SC 2.5.8)
- **Vị trí:** `authLinkClasses.ts:5` ("Forgot password?", "Sign up", "Back to sign in" cao khoảng 21px), link transcript của `AudioPlayer`.
- **Ghi chú:** link nằm giữa câu được miễn trừ theo WCAG, nhưng "Forgot password?" đứng riêng thành một hàng.
- **Sửa:** `inline-flex min-h-11 items-center` cho link đứng riêng.

### Mức Low

| # | Vấn đề | Vị trí | Gợi ý |
| --- | --- | --- | --- |
| 13 | Toast dùng `role="alert"` kèm `aria-live="polite"` theo spec; alert vốn mặc định assertive nên hành vi giữa các trình đọc không đồng nhất. Toast xếp hàng (quá 3) chỉ được đọc khi hiện ra. | `Toast.tsx:100` | Để `danger` là `assertive`, còn lại `status` + `polite`. |
| 14 | Chuỗi tiếng Anh cố định, không dịch được: "(opens in a new tab)" của `LinkButton`, đoạn "Your browser cannot play…" của `VideoPlayer`/`AudioPlayer`, mặc định "This content cannot be shown." của `MediaEmbed` (SC 3.1.2). | `LinkButton.tsx:48`, `VideoPlayer.tsx:95`, `AudioPlayer.tsx:80` | Thêm prop nhãn như các component khác (`labels`, `externalLabel`). |
| 15 | `Checkbox` và `Switch` không đọc context của `FormField` (không tự nối `aria-describedby`/`aria-invalid`). | `Checkbox.tsx`, `Switch.tsx` | Dùng `useFieldControlProps` như `Input`; hoặc giữ nguyên và ghi rõ trong doc. |
| 16 | `Badge` các variant `success/warning/danger` truyền trạng thái bằng màu; icon/dot chỉ tùy chọn. | `Badge.tsx:13` | Nếu nội dung chữ không tự nói rõ, bắt buộc kèm `icon`. |
| 17 | `Input`, `Textarea`, `SelectTrigger`, `ComboboxInput` dùng ngoài `FormField` mà không có `aria-label` sẽ không có tên; kiểu TypeScript không bắt buộc. | các file trên | Cảnh báo ở dev khi thiếu cả `aria-label`, `aria-labelledby` lẫn `FormField`. |
| 18 | `Tooltip` không hiện được trên thiết bị cảm ứng (chỉ hover/focus). Sidebar ở tablet chỉ có icon, người nhìn không có gợi ý (tên vẫn có cho trình đọc màn hình). | `Tooltip.tsx`, `AppShellNav.tsx` | Bọc link icon-only bằng `Tooltip`; không đặt thông tin thiết yếu chỉ trong tooltip. |
| 19 | `Dialog`/`Drawer`/`Lightbox` dựa vào `aria-modal` + focus trap, không đặt `inert` cho phần nền (một số trình đọc cũ vẫn duyệt ra ngoài). `Tabs` không đảo chiều phím mũi tên trong giao diện phải-sang-trái. | `Dialog.tsx:120`, `TabList.tsx:38` | Đặt `inert` cho anh em của portal; đọc `dir` để đảo ArrowLeft/Right. |

### Mức Info

- **20 · Cấp heading mặc định.** `EmptyState`, `ErrorState` mặc định `h3`; `AuthFormHeader`, `DataListPage`, `PageHeader` dùng `h1`; `Dialog`/`CreateEditForm` dùng `h2`. Ghép nhiều khối trên một trang có thể ra nhiều `h1` hoặc nhảy cấp. Các component đều có `titleAs` để chỉnh; người dùng cần chọn đúng.
- **21 · Tiêu đề trang mặc định.** `src/app/layout.tsx:16` vẫn là "Create Next App" (SC 2.4.2). Là phần ứng dụng, không phải design system.

## 4. Kết quả theo checklist `CLAUDE.md`

| Yêu cầu | Kết quả | Bằng chứng / ghi chú |
| --- | --- | --- |
| Keyboard accessible, focus ring hiện | **Đạt có điều kiện** | Có focus ring ở mọi control (`focusRingClasses`) và test bàn phím cho Select, Combobox, Menu, Tabs, RadioGroup, Dialog, Drawer, Lightbox, Switch, Checkbox. Điều kiện: độ tương phản của ring (03); bảng cuộn (07). |
| Form: label + description + lỗi liên kết | **Đạt** | `FormField` nối `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required`, lỗi `role="alert"`. Ngoại lệ: Checkbox/Switch (15). Form auth và CRUD focus vào trường sai đầu tiên. |
| Touch target ≥ 44px | **Đạt (không đo được trong test)** | class chiều cao theo token `--height-*` + pseudo-element mở rộng lên 44px cho Button/Input/Badge remove; `min-h-11` cho Checkbox, Radio, Switch, MenuItem, option, link điều hướng, nút sort. Ngoại lệ: link auth (12). |
| Không dùng màu đơn độc | **Đạt phần lớn** | Toast/Alert/ErrorState có icon riêng theo variant; sort có icon; mục đang chọn có `aria-current` + nền + chữ đậm; Select có dấu check. Ngoại lệ: Badge (16). |
| Hỗ trợ `prefers-reduced-motion` | **Đạt** | Quy tắc toàn cục trong `globals.css:223` rút mọi animation/transition xuống 0.01ms; thêm `motion-reduce:` ở spinner, skeleton, card hover, drawer/dialog, ảnh tải. `VideoPlayer`/`AudioPlayer` bỏ qua `autoPlay` khi người dùng giảm chuyển động. Phụ thuộc `globals.css` được nạp. |
| Semantic HTML, heading hợp lệ | **Đạt** | `nav`, `main`, `header`, `footer`, `ol` (breadcrumbs), `table` + `caption` + `scope`, `fieldset`/`legend` (OTP), skip link. Xem 20. |
| jest-axe trong mỗi test component | **Đạt** | 64/64 file test component. Chỉ 6 file test hook không có UI là không chạy axe. Axe được cài matcher ở `src/test-setup.ts`. |

## 5. Ma trận theo component

| Nhóm | Component | Mẫu ARIA | Bàn phím | Ghi chú |
| --- | --- | --- | --- | --- |
| Actions | Button, IconButton, LinkButton | button / link | Enter, Space | `isLoading` dùng `aria-busy` + `aria-disabled`, vẫn focus được. IconButton bắt buộc `aria-label` (kiểu). Link `external` có chữ ẩn (14). |
| Forms | Input, Textarea, SearchInput, PasswordInput | textbox, searchbox | Tab; Escape xóa tìm kiếm | Xem 02, 17. PasswordInput có `aria-pressed`, cho phép dán. |
| Forms | Checkbox, RadioGroup, Switch | checkbox, radiogroup, switch | Space; mũi tên (radio) | Input native ẩn bằng opacity, vẫn đúng ngữ nghĩa. Xem 05, 15. |
| Forms | Select, Combobox | combobox + listbox, `aria-activedescendant` | Enter/Space/↓ mở; ↑↓ Home End; Escape; gõ ký tự (Select) | Danh sách luôn nằm trong DOM nhưng `hidden` khi đóng. Xem 08. |
| Overlay | Dialog, AlertDialog, Drawer | dialog / alertdialog, `aria-modal` | Focus trap, Escape (trừ AlertDialog), trả focus | AlertDialog focus vào Cancel trước. Xem 19. |
| Overlay | DropdownMenu | menu + menuitem | Enter/Space/↓/↑ mở; ↑↓ Home End; Escape; Tab đóng | Chưa có typeahead hay submenu. |
| Navigation | Tabs | tablist / tab / tabpanel | ←→ Home End, roving tabindex, kích hoạt khi focus | Panel luôn nằm trong DOM. Xem 04, 19. |
| Navigation | Pagination, Breadcrumbs | nav + `aria-current` | Tab | |
| Data display | Table | table, caption, `aria-sort`, `scope` | Enter/Space ở nút sort | Xem 07. |
| Data display | Badge, Card | span / tùy `as` | Nút remove của Badge focus được | Xem 16. |
| Feedback | Toast, Alert, ErrorState, Spinner | alert / status | Tạm dừng khi hover/focus (Toast) | Xem 13. Skeleton `aria-hidden`. |
| Feedback | Tooltip | tooltip + `aria-describedby` | Hiện khi focus, Escape đóng, hover được | Xem 18. |
| Media | Image, VideoPlayer, AudioPlayer, MediaEmbed, Lightbox, ImageGallery | img, native controls, iframe có `title`, dialog | Native; mũi tên trong Lightbox | `alt` bắt buộc; MediaEmbed chỉ nhận https + host cho phép. Xem 09. |
| Layouts | AppShell, MarketingLayout, DashboardLayout | landmark `banner`/`navigation`/`main`/`contentinfo` | Skip link | Các nav có nhãn riêng nên không trùng landmark. Xem 06. |
| Patterns | DataListPage, CreateEditForm, DeleteConfirmDialog | table, form, alertdialog | Như thành phần | Xem 08. |
| Auth | Login, Register, ForgotPassword, OTP, SessionExpired | form có `aria-labelledby`, `autocomplete` đúng | Enter gửi; OTP: mũi tên, Backspace, dán | Cho phép dán mật khẩu và mã OTP (SC 3.3.8). |

## 6. Số đo contrast

Công thức WCAG 2.x, đọc từ `src/app/globals.css`. Chữ cần **4.5:1**, thành phần giao diện và đồ họa cần **3:1**. Các dòng "decorative" và "exempt" chỉ để tham khảo.

| Pair | Needs | Light | Dark |
| --- | --- | --- | --- |
| Body text on page | 4.5:1 | 15.32 pass | 15.96 pass |
| Body text on card | 4.5:1 | 17.93 pass | 13.88 pass |
| Body text on sunken | 4.5:1 | 13.85 pass | 16.90 pass |
| Secondary text on page | 4.5:1 | 6.68 pass | 11.74 pass |
| Secondary text on card | 4.5:1 | 7.81 pass | 10.21 pass |
| Secondary text on sunken (pill tabs) | 4.5:1 | 6.04 pass | 12.43 pass |
| Muted text on page | 4.5:1 | 4.05 **FAIL** | 6.90 pass |
| Muted text on card (placeholders, captions) | 4.5:1 | 4.74 pass | 6.00 pass |
| Muted text on sunken | 4.5:1 | 3.66 **FAIL** | 7.30 pass |
| Disabled text on card (exempt) | 4.5:1 | 2.52 **FAIL** | 1.94 **FAIL** |
| Primary button: inverse on action-primary | 4.5:1 | 16.71 pass | 16.44 pass |
| Primary button hover | 4.5:1 | 12.66 pass | 14.23 pass |
| Primary button active | 4.5:1 | 9.67 pass | 12.09 pass |
| Accent button / active nav: ink on lime | 4.5:1 | 14.83 pass | 14.83 pass |
| Badge: ink on pink | 4.5:1 | 9.28 pass | 9.28 pass |
| Badge: ink on yellow | 4.5:1 | 12.79 pass | 12.79 pass |
| Badge: ink on blue | 4.5:1 | 8.21 pass | 8.21 pass |
| Destructive button: surface on danger-text | 4.5:1 | 7.44 pass | 7.97 pass |
| Success text on success-bg | 4.5:1 | 6.22 pass | 8.99 pass |
| Warning text on warning-bg | 4.5:1 | 6.00 pass | 10.61 pass |
| Danger text on danger-bg | 4.5:1 | 6.01 pass | 8.13 pass |
| Info text on info-bg | 4.5:1 | 6.76 pass | 7.90 pass |
| Danger text on page (field errors) | 4.5:1 | 6.36 pass | 9.17 pass |
| Danger text on card (field errors) | 4.5:1 | 7.44 pass | 7.97 pass |
| Danger text on dialog (overlay) | 4.5:1 | 7.44 pass | 6.95 pass |
| Focus ring on page | 3:1 | 1.87 **FAIL** | 7.97 pass |
| Focus ring on card | 3:1 | 2.18 **FAIL** | 6.93 pass |
| Focus ring on sunken | 3:1 | 1.69 **FAIL** | 8.43 pass |
| Input border (border-default) on card | 3:1 | 1.46 **FAIL** | 1.46 **FAIL** |
| Input border (border-default) on page | 3:1 | 1.25 **FAIL** | 1.68 **FAIL** |
| Checkbox / radio / switch edge (text-muted) on card | 3:1 | 4.74 pass | 6.00 pass |
| Outlined button / strong border on page | 3:1 | 15.32 pass | 13.82 pass |
| Subtle border on card (decorative) | 3:1 | 1.26 **FAIL** | 1.20 **FAIL** |
| Switch thumb (surface) on track (text-muted) | 3:1 | 4.74 pass | 6.00 pass |
| Icon: accent-lime on card | 3:1 | 1.21 **FAIL** | 12.52 pass |
| Icon: accent-pink on card | 3:1 | 1.93 **FAIL** | 7.83 pass |
| Icon: accent-yellow on card | 3:1 | 1.40 **FAIL** | 10.79 pass |
| Icon: accent-blue on card | 3:1 | 2.18 **FAIL** | 6.93 pass |
| Skeleton (border-subtle) on page | 3:1 | 1.08 **FAIL** | 1.38 **FAIL** |

Ghi chú: sọc `striped` của bảng là `surface-sunken` ở 50% trên thẻ (`#f2f1ed`), chữ chính trên đó vẫn 15.9:1. Chữ vô hiệu hóa (`disabled`) được miễn trừ khỏi yêu cầu contrast.

## 7. Việc nên làm tiếp

1. Sửa 01–04 (chỉ là đổi giá trị trong `globals.css`), chạy lại `node scripts/contrast-audit.mjs` cho đến khi không còn dòng **FAIL** ở các cặp tương tác.
2. Thêm một lớp test chạy trên **trình duyệt thật có CSS** (Playwright + `@axe-core/playwright`, kèm chế độ `forcedColors: "active"` và `colorScheme: "dark"`) để bắt contrast, kích thước vùng bấm và forced-colors tự động.
3. Thử thủ công với NVDA (Windows) và VoiceOver (macOS/iOS) cho các luồng: đăng nhập, Select/Combobox, DropdownMenu, Dialog, DataListPage.
4. Thử zoom 200% và 400% (reflow ở 320px) cho `AppShell`, `DataListPage`, `Table`.
5. Đưa kết quả contrast vào CI (`node scripts/contrast-audit.mjs` thoát mã khác 0 nếu có cặp tương tác trượt) để token không tụt lại như trường hợp 04.
