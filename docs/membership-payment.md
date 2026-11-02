# Hội viên và thanh toán chuyển khoản (VietQR + Casso)

Tài liệu ghi lại những gì đã làm, kiến thức về quy trình thanh toán, và những việc còn lại để chạy thật. Cập nhật lần cuối: 02/11/2026.

Hệ thống gồm hai repo, làm chung trong một phiên:

- Frontend: `paper-and-progress` (Next.js).
- Backend: `backend-paper-and-progress` (NestJS + Prisma + PostgreSQL).

Đường dẫn backend trong tài liệu này viết tắt là `BE:`, frontend là `FE:`.

---

## 1. Tóm tắt trạng thái

| Phần | Trạng thái |
|---|---|
| Phân quyền đọc bài theo hội viên | Xong, đã có test |
| Trang `/membership`, chọn gói, mã QR VietQR | Xong, đã có test |
| Admin xác nhận tay "Đã nhận tiền" | Xong, đã có test |
| Tự xác nhận qua webhook Casso | Code xong, có test, **chưa chạy với Casso thật** |
| Thông báo ngay trên trang khi tiền về (SSE) | Xong, đã có test, chưa thử trên trình duyệt |
| Lịch sử giao dịch, thẻ Membership, menu avatar | Xong, đã có test |
| Polling Casso API (không cần địa chỉ công khai) | **Chưa làm** |
| Cấu hình thật (giá, ngân hàng, khóa Casso, địa chỉ công khai) | **Chưa có**, xem mục 6 |

Kiểm tra gần nhất: backend 261 test, frontend 1607 test đều qua; `tsc` và ESLint sạch. Mọi thay đổi **chưa commit** ở cả hai repo (mỗi repo commit riêng, theo quy ước trong `CLAUDE.md`).

---

## 2. Quy trình thanh toán

### 2.1. Từ góc nhìn người mua

1. Người dùng đăng nhập, vào `/membership`.
2. Chọn gói (1 tháng hoặc 1 năm). Backend tạo một **đơn** có mã dạng `PPxxxxxxxx`.
3. Trang hiện mã QR VietQR đã điền sẵn số tiền và nội dung chuyển khoản, kèm số tài khoản, tên chủ tài khoản.
4. Người dùng quét QR bằng app ngân hàng bất kỳ và chuyển khoản. **Phải giữ nguyên số tiền và nội dung.**
5. Khi hệ thống nhận biết có tiền, hội viên được kích hoạt. Trang `/membership` hiện "Đã nhận được tiền, hội viên của bạn đã được kích hoạt".
6. Có thể bấm "Tôi đã chuyển, kiểm tra lại" bất kỳ lúc nào. Nút này không tạo giao dịch mới, chỉ hỏi lại trạng thái và cho biết kết quả kèm giờ kiểm tra.
7. Xem lại các đơn ở `/membership/orders` (Lịch sử giao dịch).

### 2.2. Hai đường để một đơn thành "đã thanh toán"

```
Người mua chuyển khoản
        |
        v
  Tiền vào tài khoản ngân hàng
        |
        +-------------------------------+
        |                               |
        v                               v
 Đường tự động (Casso)           Đường thủ công (Admin)
 Casso gọi webhook               Chủ web xem app ngân hàng,
        |                        vào Admin > Membership,
        v                        bấm "Đã nhận tiền"
 Backend kiểm chữ ký,                   |
 tìm mã PP… trong nội dung,             |
 so số tiền (đủ mới xác nhận)           |
        |                               |
        +---------------+---------------+
                        v
         Cùng một hàm confirm() ở backend:
         đơn PENDING -> PAID, cộng thời hạn hội viên,
         báo cho trang đang mở của người mua
```

Điểm quan trọng: **hội viên chỉ được cấp ở backend, qua `confirm()`**. Không bao giờ cấp vì người dùng nói "tôi đã chuyển".

### 2.3. Quy tắc của hàm xác nhận

- Gói 1 tháng cộng 1 tháng, gói 1 năm cộng 12 tháng. Cộng theo lịch (31/01 + 1 tháng = 28/02).
- Đang là hội viên thì cộng **tiếp vào ngày hết hạn hiện tại**. Đã hết hạn hoặc chưa từng là hội viên thì tính từ hôm nay.
- Xác nhận một đơn đã thanh toán lần nữa thì **không đổi gì** (bấm đúp, webhook gửi lặp đều an toàn).
- Đơn đã huỷ thì không xác nhận được.
- Toàn bộ chạy trong một transaction của cơ sở dữ liệu.

### 2.4. Quy tắc khớp giao dịch tự động

Một giao dịch từ Casso chỉ tự xác nhận đơn khi **đủ cả bốn điều kiện**:

1. Chữ ký của Casso hợp lệ.
2. Nội dung chuyển khoản chứa mã đơn (`PP` cộng 8 ký tự, không phân biệt hoa thường, nằm ở đâu trong chuỗi cũng tìm được).
3. Số tiền **lớn hơn hoặc bằng** giá của đơn (chuyển dư vẫn xác nhận, chuyển thiếu thì không).
4. Tiền vào đúng tài khoản của mình (nếu Casso có gửi số tài khoản).

Các trường hợp còn lại không tự xác nhận, đơn vẫn nằm chờ trong Admin để chủ web xử lý tay:

| Kết quả | Nghĩa | Việc cần làm |
|---|---|---|
| `underpaid` | Chuyển thiếu tiền | Nhắn người mua chuyển bù hoặc hoàn tiền, rồi xác nhận tay nếu hợp lý |
| `no_code` | Nội dung không có mã đơn | Đối chiếu tay theo người chuyển và số tiền |
| `no_order` | Có mã nhưng không có đơn này | Kiểm tra lại, có thể người mua gõ sai |
| `not_pending` | Đơn đã thanh toán hoặc đã huỷ, giao dịch khác tới | Kiểm tra xem có chuyển trùng không |
| `duplicate` | Giao dịch này đã xử lý rồi | Không cần làm gì |
| `wrong_account` | Tiền vào tài khoản khác | Bỏ qua |
| `invalid` | Dữ liệu thiếu hoặc sai | Xem log |

Mã đơn dùng bảng chữ cái `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (bỏ `I`, `O`, `0`, `1` để không nhầm khi gõ tay).

---

## 3. Những gì đã làm

### 3.1. Backend (`BE:`)

**Cơ sở dữ liệu** (`prisma/schema.prisma`, 3 migration đã áp dụng):

- `Membership`: mỗi người một dòng, có `expiresAt` và `source` (`ADMIN` hoặc `PAYMENT`). Là hội viên khi `expiresAt` còn ở tương lai.
- `MembershipOrder`: đơn đăng ký, có `plan`, `months`, `amount`, `code` (duy nhất), `status` (`PENDING`, `PAID`, `CANCELLED`), `paidAt`, `paymentRef` (mã giao dịch Casso, duy nhất) và `receivedAmount` (số tiền ngân hàng báo).
- Migration: `20261102100000_add_membership`, `20261102120000_add_membership_orders`, `20261102140000_add_order_payment_ref`.

**Mã nguồn** (`src/modules/membership/`):

| File | Vai trò |
|---|---|
| `membership.service.ts` | Đọc, cấp, thu hồi hội viên |
| `membership-orders.service.ts` | Tạo đơn, huỷ, xác nhận, khớp giao dịch Casso, đọc cấu hình giá và ngân hàng |
| `casso-signature.ts` | Kiểm tra chữ ký webhook Casso V2 |
| `membership-events.service.ts` | Kênh thông báo thời gian thực cho từng người |
| `membership.controller.ts` | Các API bên dưới |

**API** (tiền tố `/api/v1`):

| Phương thức và đường dẫn | Ai gọi được | Việc |
|---|---|---|
| `GET /membership/plans` | Mọi người | Các gói và giá; `isOpen: false` nếu chưa cấu hình |
| `GET /membership/me` | Đã đăng nhập | Trạng thái hội viên của mình |
| `POST /membership/orders` | Đã đăng nhập | Tạo đơn (hoặc trả về đơn đang chờ cùng gói) |
| `GET /membership/orders/me` | Đã đăng nhập | 20 đơn gần nhất |
| `POST /membership/orders/:id/cancel` | Đã đăng nhập | Huỷ đơn đang chờ của mình |
| `GET /membership/events` | Đã đăng nhập | Kênh SSE, báo khi hội viên thay đổi |
| `POST /membership/casso-webhook` | Casso (có chữ ký) | Nhận giao dịch tiền vào |
| `GET /admin/membership-orders?status=` | Admin | Danh sách đơn |
| `POST /admin/membership-orders/:id/confirm` | Admin | Xác nhận đã nhận tiền |
| `POST /admin/membership-orders/:id/cancel` | Admin | Huỷ đơn |
| `PUT` và `DELETE /admin/users/:id/membership` | Admin | Cấp hoặc thu hồi hội viên trực tiếp |

**Phân quyền đọc bài** (`articles.service.ts`): bài có `visibility` là `PUBLIC`, `PREVIEW` (xem trước 30% đầu) hoặc `MEMBERS_ONLY`. Người dùng thường chỉ đọc đủ bài `PUBLIC`. Hội viên, tác giả và admin đọc đủ. Kiểm tra ở server, nội dung bị giới hạn không bao giờ gửi xuống trình duyệt. Khách đăng nhập nhưng chưa là hội viên bị chặn bài `MEMBERS_ONLY` bằng mã 403; khách chưa đăng nhập bằng mã 401.

**Bảo mật đã có:**

- Giá luôn lấy từ server, người dùng không sửa được.
- Webhook xác thực bằng chữ ký HMAC-SHA512 (so sánh hằng thời gian). Không có khóa thì trả 503, chữ ký sai thì 401.
- Mỗi mã giao dịch ngân hàng chỉ trả được một đơn (ràng buộc duy nhất ở cơ sở dữ liệu).
- Kênh SSE cần đăng nhập, mỗi người chỉ nhận sự kiện của chính mình; sự kiện không mang dữ liệu chi tiết.
- Tối đa 5 đơn đang chờ mỗi người.

### 3.2. Frontend (`FE:`)

| Việc | Vị trí |
|---|---|
| Trang chọn gói, mã QR, kiểm tra lại, thông báo kết quả | `src/features/membership/components/MembershipView.tsx`, trang `/membership` |
| Nhận thông báo tiền về ngay (đọc luồng SSE bằng `fetch`, vì `EventSource` không gửi được header đăng nhập) | `src/features/membership/useMembershipEvents.ts` |
| Lịch sử giao dịch | `OrderHistory.tsx`, trang `/membership/orders` |
| Thẻ Membership ở sidebar trang chủ (Free, Hội viên, Hết hạn) | `src/features/home/components/MembershipCard/` |
| Menu avatar: dòng trạng thái, mục Hội viên (huy hiệu Nâng cấp hoặc Gia hạn), Lịch sử giao dịch | `src/features/header/components/AppHeader/`, `src/features/auth/provider/SessionHeader.tsx` |
| Admin: danh sách đơn, nút "Đã nhận tiền" và "Huỷ", hiện số tiền thực nhận | `src/features/admin/components/MembershipOrdersScreen.tsx`, trang `/admin/membership-orders` |
| Admin: cột Hội viên ở bảng Users, ô cấp hoặc thu hồi ở chi tiết user | `UsersScreen.tsx`, `MembershipControl.tsx` |
| Trang bài viết: lớp chặn theo lý do (cần đăng nhập, cần hội viên) | `src/features/articles/components/GatedOverlay.tsx` |

Thẻ Membership và menu avatar chỉ mời bằng quyền lợi, **không hiện giá**. Giá chỉ xuất hiện ở trang `/membership`.

---

## 4. Kiến thức nền

### 4.1. VietQR

- Mã QR được tạo bằng dịch vụ ảnh công khai: `https://img.vietqr.io/image/<BIN>-<SỐ TÀI KHOẢN>-compact2.png?amount=<số tiền>&addInfo=<nội dung>&accountName=<tên>`.
- `BIN` là mã định danh ngân hàng (ví dụ MB `970422`, Vietcombank `970436`, Techcombank `970407`, SHB `970443`). **BIN phải đúng ngân hàng của số tài khoản**, nếu không QR chuyển sai nơi hoặc không quét được.
- Nếu dịch vụ ảnh ngừng hoạt động, trang vẫn hiện số tài khoản, số tiền và nội dung để người mua gõ tay.

### 4.2. Casso Webhook V2 (theo tài liệu chính thức của Casso)

- Cấu hình: casso.vn, **Kết nối, Tích hợp, Thêm tích hợp, Webhook V2**; chọn tài khoản ngân hàng; nhập địa chỉ webhook và Key bảo mật (Casso tạo ra).
- Địa chỉ webhook **phải là đường dẫn công khai trên internet, dùng HTTPS**. `localhost` và mạng nội bộ không dùng được.
- Casso gửi `POST` với JSON `{ "error": 0, "data": { ... } }`. Với V2, `data` là một đối tượng gồm `id`, `reference`, `description`, `amount`, `runningBalance`, `transactionDateTime`, `accountNumber`, `bankName`, ...
- **Chữ ký:** header `X-Casso-Signature: t=<timestamp>,v1=<hex>`. Chuỗi được ký là `t + "." + JSON của dữ liệu đã sắp xếp khoá A đến Z`, thuật toán HMAC-SHA512, khoá là Key bảo mật. Tài liệu chưa nói rõ "dữ liệu" là cả body hay chỉ `data`, nên mã của mình chấp nhận cả hai (kẻ giả mạo vẫn cần khoá).
- **Phản hồi:** phải trả HTTP 200 trong vòng **5 giây**. Nếu bật **Strict mode**, body phải có `success: true` hoặc `success: 1`. Mã của mình luôn trả `{ "success": true }` cho cuộc gọi có chữ ký hợp lệ, kể cả khi không khớp đơn nào (để Casso không gửi lại mãi).
- **Gửi lại khi lỗi:** Casso thử lại trong 24 giờ, lần đầu sau 1 phút, các lần sau theo dãy Fibonacci, tối đa 17 lần rồi đánh dấu FAIL. Nếu mọi cuộc gọi đều lỗi suốt 24 giờ, webhook bị **PAUSED**, giao dịch mới được giữ ở trạng thái HOLDING và bạn có thể **Replay** sau khi sửa. Nếu bị tạm dừng 7 ngày, webhook bị **DISABLE** và các giao dịch trong thời gian đó không replay được.
- **Chống trùng:** Casso khuyến nghị lưu `id` giao dịch đã xử lý và bỏ qua nếu gặp lại. Mã của mình làm việc này bằng cột `paymentRef` duy nhất.
- **Gọi thử:** trong Casso có nút "Gọi thử" gửi một giao dịch thử. Giao dịch thử không có mã đơn nên không khớp đơn nào, nhưng webhook vẫn trả thành công để Casso cho lưu.
- Nếu backend nằm sau Cloudflare hoặc dịch vụ chống DDoS khác, cần cho phép các địa chỉ IP của Casso (Casso công bố ở nơi khác, không nằm trong trang tài liệu webhook).
- Webhook V1 khác V2 ở chỗ: khoá gắn vào một header thay vì ký chữ ký, và `data` là một mảng. Mã hiện tại **chỉ hỗ trợ V2**.

### 4.3. Vì sao hệ thống "nghe" giao dịch theo kiểu bị động

Backend không tự hỏi ngân hàng. Nó chỉ mở cổng và **chờ Casso gọi tới**. Điều kiện để chạy: backend truy cập được từ internet qua HTTPS, đã điền khoá, và đang chạy lúc tiền về. Ở máy local, cần ngrok hoặc cloudflared để có địa chỉ tạm. Khi lên môi trường thật, cần máy chủ có tên miền và HTTPS.

---

## 5. Cấu hình

### 5.1. `.env` của backend

| Biến | Ý nghĩa | Ví dụ |
|---|---|---|
| `MEMBERSHIP_PRICE_MONTH` | Giá gói 1 tháng (VNĐ, số nguyên dương) | `39000` |
| `MEMBERSHIP_PRICE_YEAR` | Giá gói 1 năm | `400000` |
| `VIETQR_BANK_BIN` | Mã BIN ngân hàng | `970422` |
| `VIETQR_ACCOUNT_NO` | Số tài khoản nhận tiền | |
| `VIETQR_ACCOUNT_NAME` | Tên chủ tài khoản, không dấu, in hoa | `NGUYEN VAN A` |
| `CASSO_CHECKSUM_KEY` | Key bảo mật của Webhook V2 | (lấy từ Casso) |

- Thiếu **bất kỳ** biến nào trong năm biến đầu thì `GET /membership/plans` trả `isOpen: false` và `/membership` hiện "Đăng ký hội viên chưa mở".
- Thiếu `CASSO_CHECKSUM_KEY` thì webhook trả 503 và việc xác nhận chỉ làm tay được.
- Backend **chỉ đọc `.env` lúc khởi động**: đổi xong phải khởi động lại.
- Khoá là bí mật: không dán vào chat, không commit. Số tài khoản không phải bí mật.

### 5.2. Frontend

Dùng chung biến có sẵn `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:8000`). Backend phải cho phép nguồn gốc của frontend trong `CORS_ORIGINS`.

---

## 6. Những việc còn lại để hoàn thành

### 6.1. Bạn cần cung cấp hoặc làm

- [ ] **Chốt giá chính thức** của hai gói và điền `MEMBERSHIP_PRICE_*`.
- [ ] **Kiểm tra `VIETQR_BANK_BIN` khớp với ngân hàng của số tài khoản**, rồi điền `VIETQR_ACCOUNT_NO` và `VIETQR_ACCOUNT_NAME`.
- [ ] **Tạo tài khoản Casso**, liên kết tài khoản ngân hàng nhận tiền.
- [ ] **Tạo tích hợp Webhook V2** trên Casso, chọn đúng tài khoản ngân hàng, rồi sao chép Key bảo mật vào `CASSO_CHECKSUM_KEY`.
- [ ] **Có địa chỉ công khai HTTPS cho backend.** Thử ở local: ngrok hoặc cloudflared. Chạy thật: máy chủ có tên miền. Địa chỉ webhook sẽ là `https://<tên miền>/api/v1/membership/casso-webhook`.
- [ ] Khởi động lại backend sau khi điền `.env`.
- [ ] Bấm **Gọi thử** trong Casso và chỉ **Lưu** khi báo thành công.
- [ ] **Thử bằng một đơn nhỏ thật** từ đầu đến cuối (tạo đơn, quét QR, chuyển khoản, xem hội viên tự bật). Nếu báo "Chữ ký không hợp lệ", cần xem lại cách Casso ký (xem mục 4.2) và báo để sửa.
- [ ] Nếu muốn **polling Casso API** (không cần địa chỉ công khai, bù được giao dịch bị lỡ khi backend tắt): tạo API key của Casso và điền vào `.env`, rồi báo để làm phần này.

### 6.2. Khi đưa lên môi trường thật

- [ ] Máy chủ backend có HTTPS và tên miền; đặt `NEXT_PUBLIC_API_URL` của frontend trỏ tới đó.
- [ ] Thêm tên miền frontend vào `CORS_ORIGINS` của backend.
- [ ] Đổi địa chỉ webhook trên Casso sang tên miền thật.
- [ ] Nếu dùng Cloudflare phía trước, cho phép IP của Casso.
- [ ] Giám sát: theo dõi trạng thái webhook trên Casso (PAUSED hoặc HOLDING là dấu hiệu backend đang lỗi hoặc tắt).
- [ ] Commit riêng ở hai repo; áp dụng migration (`npx prisma migrate deploy`) trên cơ sở dữ liệu thật.

### 6.3. Chưa có trong code (có thể bổ sung sau)

- Polling Casso API để đối soát định kỳ (mục 4.3).
- Thanh toán và hoàn tiền: hiện **không có luồng hoàn tiền**; chuyển thiếu hoặc nhầm phải xử lý tay ngoài hệ thống.
- Đơn chờ **không tự hết hạn**; đơn bỏ dở nằm mãi ở trạng thái chờ (giới hạn 5 đơn mỗi người).
- Không có email hoặc thông báo nhắc **sắp hết hạn** hội viên.
- Lịch sử giao dịch chỉ hiện **20 đơn gần nhất**, chưa có phân trang.
- Cổng thanh toán khác (VNPay, MoMo, PayOS): đã cân nhắc và **không chọn**. PayOS bị bỏ theo yêu cầu; VNPay và MoMo cần giấy tờ doanh nghiệp để chạy thật.
- Chưa kiểm tra trên trình duyệt thật: luồng SSE, hiệu ứng chuyển trang, giao diện `/membership/orders`.

---

## 7. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `/membership` báo "chưa mở" | Thiếu một trong năm biến cấu hình, hoặc backend chưa khởi động lại | Điền đủ `.env`, khởi động lại backend |
| Webhook trả 503 | Chưa có `CASSO_CHECKSUM_KEY` | Điền khoá, khởi động lại |
| Webhook trả 401 | Chữ ký sai: khoá không đúng, hoặc Casso ký khác cách mình hiểu | Kiểm tra khoá, thử rotate khoá trên Casso; nếu vẫn sai, báo để sửa cách ghép chuỗi ký |
| "Gọi thử" của Casso lỗi | Backend không truy cập được từ internet, hoặc quá 5 giây | Kiểm tra ngrok hoặc tên miền, HTTPS, backend đang chạy |
| Đã chuyển nhưng hội viên không bật | Casso chưa gửi webhook, hoặc giao dịch bị `underpaid` hoặc `no_code` | Xem trạng thái webhook trên Casso; xem đơn trong Admin; xác nhận tay nếu đúng |
| Trạng thái webhook PAUSED hoặc HOLDING trên Casso | Backend tắt hoặc lỗi suốt 24 giờ | Sửa backend, rồi bấm Replay trên Casso (trước khi bị DISABLE sau 7 ngày) |
| QR không quét được | `VIETQR_BANK_BIN` sai ngân hàng | Sửa BIN |
| Trang không cập nhật ngay khi tiền về | Kênh SSE chưa nối được | Vẫn có kiểm tra tự động mỗi 30 giây và nút "kiểm tra lại" |
| Lỗi 404 hoặc 503 khi mở các API mới | Backend đang chạy bản cũ | Khởi động lại backend |

---

## 8. Quy trình thủ công của chủ web (khi chưa có tự động)

1. Mở app ngân hàng, xem các khoản tiền vào.
2. Vào **Admin, Membership**. Mỗi đơn chờ hiện người mua, gói, số tiền, nội dung `PP…`, thời gian tạo.
3. So khớp **nội dung** và **số tiền thực nhận** (phải bằng hoặc hơn số tiền của đơn).
4. Khớp thì bấm **Đã nhận tiền**. Thiếu hoặc sai thì không bấm, nhắn người mua, hoặc bấm **Huỷ**.
5. Muốn cấp hội viên không qua đơn (tặng, đền bù): vào chi tiết user, mục Hội viên, bấm "Cấp thêm 1 tháng", "Cấp thêm 1 năm" hoặc "Thu hồi".
