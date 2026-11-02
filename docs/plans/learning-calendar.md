# Daily Learning Calendar (trang `/goals/english`)

Thiết kế: `Downloads/Baolingo_Daily_Learning_Calendar_Spec.md` và bộ UI trong `Baolingo_Daily_Learning_Calendar_UI_Pack`.
Section nằm sau tiêu đề trang, trước các tab mục tiêu (các tab và thẻ bên dưới không đổi).

## Các quyết định nghiệp vụ (mục 12 của đặc tả)

Đặc tả để ngỏ 10 câu hỏi. Đây là cách đã chốt trong code, mỗi cái đổi được ở một chỗ.

| # | Câu hỏi | Quyết định | Ở đâu |
|---|---|---|---|
| 1 | Learning Day tính khi nào | Có ít nhất một hoạt động đã được server lưu (sáu loại dưới đây). Mở trang hay bấm vào ngày không tính | `activity-aggregator.ts`, `learning-activity.repository.ts` |
| 2 | Daily Lesson tính khi mở hay hoàn thành | Khi `learnCompleted`. Bài học chỉ làm được vào đúng ngày của nó, nên tính vào `DailyLesson.date` | `activity-aggregator.ts` |
| 3 | Practice / Test | `practiceCompleted` và `testCompleted`, mỗi loại một mục trong ngày. Test ghi điểm và qua cổng hay chưa | như trên |
| 4 | Learning days theo tháng hay toàn lịch sử | Cả hai trong API (`learningDaysInMonth`, `learningDaysTotal`). Giao diện hiện số của tháng đang xem, nhãn ghi rõ "Ngày học trong tháng N" | `LearningOverview.tsx` |
| 5 | Streak lấy module nào | Daily Gate và Sổ cụm từ (sáu loại hoạt động). Chuỗi này **không** thay streak riêng của Sổ cụm từ (`PhraseActivityDay`), vẫn nguyên | `learning-streak.ts` |
| 6 | Longest streak từ khi nào | Toàn bộ lịch sử | `learning-streak.ts` |
| 7 | Có tracking thời gian học chưa | Chưa. Không hiện "phút học"; API trả `durationMinutes: null`. Thẻ thứ hai trong thiết kế (25 phút) bị bỏ | `learning-activity.service.ts` |
| 8 | Deep link | Chưa module nào có màn hình cho hoạt động đã qua, nên `targetUrl: null` và các mục chỉ đọc. UI đã sẵn để mở link khi có | `DailyActivityPanel.tsx` |
| 9 | Cường độ | Số loại hoạt động trong ngày: 1, 2, 3, 4 trở lên (đúng bằng số mục trong danh sách). Không phải phần trăm | `intensityOf` |
| 10 | Ngày tương lai | Hiện trong lưới nhưng không chọn được, API trả rỗng. Nút "Tháng sau" bị khoá ở tháng hiện tại | `MonthlyCalendar.tsx` |

Sáu loại hoạt động và nguồn:

| Loại | Nguồn |
|---|---|
| `DAILY_LESSON`, `DAILY_PRACTICE`, `DAILY_TEST` | `UserDailyProgress` (theo ngày của `DailyLesson`) |
| `PHRASE_WRITE` | `PhraseExample` với `step = WRITE` |
| `PHRASE_RECALL` | `PhraseReview` (bảng mới, xem dưới) |
| `PHRASE_SPEAK` | `PhraseSpokenAttempt` |

## Thay đổi ngoài module mới

- **Bảng `PhraseReview`** (migration `20261101120000_add_phrase_review_log`): mỗi lần nhớ lại được server chấp nhận ghi một dòng (`grade`, `usedHint`). Trước đó lần "Quên" không để lại dấu vết nào nên calendar không thấy được. `PhraseService.review` ghi trong cùng transaction. Lịch ôn, streak và `PhraseActivityDay` của Sổ cụm từ **không đổi**. Các lần nhớ lại trước migration không có bản ghi, nên không hiện trên calendar.
- `DailyGateModule` export `DailyGateService`, để calendar dùng đúng `today()` của Daily Gate.

## Ngày và múi giờ

Ngày của người học là ngày theo `Asia/Ho_Chi_Minh` (UTC+7, không có giờ mùa hè). Mốc thời gian được đổi sang ngày bằng cách cộng 7 giờ; ngày đi lại giữa backend và frontend dạng chữ `YYYY-MM-DD`, không bao giờ qua `Date` cục bộ. "Hôm nay" của calendar là `DailyGateService.today()` (cần chạy server với `TZ=Asia/Ho_Chi_Minh` như tài liệu Sổ cụm từ đã nêu), và frontend dùng đúng ngày đó từ API.

## API

```
GET /api/v1/learning-activity/calendar?year=2026&month=11   (bỏ cả hai: tháng hiện tại)
GET /api/v1/learning-activity/days/2026-11-14
```

## Chưa làm

- Màn hình chi tiết từng hoạt động (State 04 và các ảnh 04 đến 07): cần deep link từ các module, chưa có.
- Thu gọn/mở rộng section, thống kê theo tuần, tổng thời gian học (P2 trong đặc tả).
- Ảnh gấu trúc biến thể "đang ngủ" cho ngày trống: dùng chung ảnh gấu ngồi laptop.

## Trang `/goals/english` hiện chỉ có box này

Đã bỏ breadcrumb, tiêu đề, mô tả, các tab mục tiêu và các thẻ bên dưới. Box có tiêu đề riêng (h1 "Mục tiêu học tiếng Anh"); cùng hàng, bên phải, là icon và chữ "Mục tiêu B2" (chữ thường, không viền, không badge).
Layout được nén cho màn laptop: hộp cao khoảng 534px, vừa một màn hình từ chiều cao viewport 620px trở lên; ảnh gấu trúc tự ẩn khi viewport thấp hơn 760px.
Cấp độ chưa lưu theo từng user: nó nằm trong `learning-goal.ts` (backend), API trả `goal`. Khi cho người dùng chọn mục tiêu, đó là chỗ sẽ trở thành dữ liệu.
`features/english` (các tab và thẻ cũ) vẫn còn trong mã nhưng không còn được trang nào dùng.
