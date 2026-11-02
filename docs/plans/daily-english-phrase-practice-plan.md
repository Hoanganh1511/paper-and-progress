# Đề xuất: tích hợp phương pháp 4 bước "Cụm từ chủ động" vào Daily English

Frontend: `src/features/daily-gate/` (modal mở từ nút ở góc). Backend: `backend-paper-and-progress/src/modules/daily-gate/` (NestJS, Prisma, PostgreSQL).
Các quyết định đã chốt nằm ở mục 8. Trạng thái triển khai ở mục 9.

## 1. Hiện trạng Daily English (những gì tận dụng được)

- Mỗi ngày có 1 `DailyLesson` (30 ngày), gồm các `VocabularyUnit`. `VocabularyWord` có `section`, trong đó `PHRASE_COLLOCATION` và `PHRASAL_VERB` **đã là cụm từ**, có `word`, `meaning`, `example`.
- Luồng hiện tại: **Học → Luyện tập → Kiểm tra**, đạt ≥ 70% thì `gateUnlocked`. Modal có thể đóng bất cứ lúc nào, không chặn gì.
- Đã có: `WordReview`, streak của gate, calendar, `StatsView`, `weakWords`, phát âm (Flashcard).
- Chưa có: nhập câu tự do, lịch ôn lặp lại theo từng cụm từ, nói/ghi âm, và **không có SDK AI nào** trong backend.

Daily Gate là **bài học theo lịch cố định, người dùng tiếp nhận và làm trắc nghiệm**. Phương pháp mới là **kho cụm từ cá nhân, người dùng tự tạo câu và nói**. Vì vậy làm thành phần bổ sung, không thay thế gate.

## 2. Tích hợp

**Thêm tab "Sổ cụm từ" trong modal Daily English. Gate 70% giữ nguyên, không bị chặn bởi phần này.**

```
Modal Daily English
├─ Tab "Bài hôm nay"   (hiện có: Học → Luyện tập → Kiểm tra)
│     └─ Ở bước Học, mỗi cụm có nút "Lưu vào sổ" → sau khi lưu đổi thành "Đã lưu"
└─ Tab "Sổ cụm từ"     (mới) = kho cụm từ riêng của người dùng
      ├─ Hôm nay ôn + nhóm "Chưa đặt câu" + thống kê (Màn hình E)
      ├─ Thêm cụm từ (Màn hình A)
      └─ Chi tiết cụm từ → các bước luyện bên trong: đặt câu / nhớ lại / nói (Màn hình B, C, D)
```

| Bước 4-bước | Ánh xạ |
|---|---|
| 1. Học cụm từ | Đã có (Learn). Nút **"Lưu vào sổ"** trên cụm `PHRASE_COLLOCATION` / `PHRASAL_VERB` và form thêm tay cho cụm ngoài giáo trình. Cụm lưu từ bài học mang theo `wordId` và `example` làm câu mẫu. Ô **"Nghĩa / gợi nhớ"** bắt buộc và **để trống**, người dùng tự viết (tiếng Việt hay tiếng Anh đều được); nghĩa tiếng Anh gốc hiện bên cạnh chỉ để tham khảo |
| 2. Tự đặt câu | Mới (Màn hình B) |
| 3. Nhớ lại | Mới (Màn hình C), cũng là cơ chế ôn lặp lại |
| 4. Dùng khi nói | Mới (Màn hình D) |

Không biến thành bước bắt buộc của gate: nói/ghi âm không chạy trên mọi trình duyệt, và bước bắt buộc làm người học A2 bỏ ngang.

## 3. Mô hình dữ liệu (Prisma)

```prisma
enum PhraseStage { WRITE RECALL SPEAK MASTERED }
enum PhraseExampleStep { WRITE RECALL }          // bước 2 và bước 3

model Phrase {
  id               String      @id @default(uuid())
  userId           String
  wordId           Int?                          // cụm lấy từ bài học; null nếu tự thêm
  phrase           String                        // "meet a deadline"
  phraseNormalized String                        // trim + lowercase + gộp khoảng trắng; dùng cho unique
  meaning          String                        // người dùng tự viết: nghĩa / gợi nhớ
  sampleSentence   String?
  stage            PhraseStage @default(WRITE)
  intervalDays     Int         @default(0)
  nextReviewAt     DateTime    @db.Date          // service tự gán, KHÔNG dựa vào default
  easyStreak       Int         @default(0)       // số lần "Dễ" liên tiếp
  speakPassed      Boolean     @default(false)
  ...
  @@unique([userId, phraseNormalized])
  @@index([userId, stage, nextReviewAt])
}
PhraseExample        { text, step: PhraseExampleStep, isCorrect?, feedback?, usedHint }   // isCorrect/feedback để dành cho AI
PhraseSpokenAttempt  { transcript, containsPhrase }
PhraseActivityDay    { userId, day @db.Date }  @@id([userId, day])                         // tính streak của sổ
```

Khác bản gốc:
- Bỏ cột `keyword`: bộ so khớp đã yêu cầu khớp **mọi token** của cụm nên `keyword` thừa. Cảnh báo "chỉ 1 từ đơn" tính ra khi cần.
- `stage` bắt đầu từ `WRITE` (bước 1 xảy ra ngay khi tạo).
- `easyStreak`, `speakPassed` để tính `MASTERED` mà không quét lịch sử.
- `intervalDays` là `Int` (vì "Khó" dùng `ceil`).
- `phraseNormalized` chống trùng "Meet a deadline " với "meet a deadline".
- `PhraseActivityDay` cho streak riêng.

## 4. Múi giờ

"Hôm nay" **bắt buộc** dùng `DailyGateService.today()` (cùng hàm với `DailyLesson.date`); service tự tính `nextReviewAt = hôm nay + intervalDays` và tự gán, không dùng `@default(now())`. Hàm này lấy ngày theo múi giờ của tiến trình server, nên server cần chạy với `TZ=Asia/Ho_Chi_Minh` để người dùng ở Việt Nam ôn lúc 0h–7h không bị tính sang ngày hôm trước.

## 5. Chuyển stage và lịch ôn

Hành động → stage mới:

| Hành động | Điều kiện | Kết quả |
|---|---|---|
| Đặt câu (bước 2) hợp lệ | stage = `WRITE` | `RECALL`, `intervalDays = 1`, `nextReviewAt = hôm nay + 1` |
| Đặt thêm câu (bước 2) | stage khác `WRITE` | Giữ nguyên stage |
| Nhớ lại **Quên** | mọi stage (trừ `WRITE`) | `RECALL`, `intervalDays = 1`, `easyStreak = 0`. **Giữ `speakPassed`** |
| Nhớ lại **Khó / Dễ** | `speakPassed = false` | `SPEAK` |
| Nhớ lại **Khó / Dễ** | `speakPassed = true`, `easyStreak ≥ 3` | `MASTERED` |
| Nhớ lại **Khó / Dễ** | `speakPassed = true`, `easyStreak < 3` | `RECALL` |
| Nói thành công (transcript chứa cụm) | stage khác `WRITE` | `speakPassed = true`; `MASTERED` nếu `easyStreak ≥ 3`, ngược lại `RECALL` |

- Cụm ở `SPEAK` và `MASTERED` **vẫn vào lịch ôn** (nếu không sẽ quên dần). Cụm `WRITE` **không** vào danh sách "đến hạn", mà hiện ở nhóm riêng "Chưa đặt câu".
- **Quên**: `interval = 1`.
- **Khó**: `interval = max(1, ceil(interval × 1.2))` → chuỗi Khó liên tiếp giãn dần 1 → 2 → 3 → 4 → 5… (làm tròn thường sẽ kẹt ở 1). `easyStreak = 0`.
- **Dễ**: `interval ≤ 1` thì `3`, ngược lại `ceil(interval × 2.5)`. `easyStreak += 1`.
- **Mastered** = `speakPassed` và `easyStreak ≥ 3`. Khó/Quên làm `easyStreak = 0` nên cụm tự rời `MASTERED`.
- **Chống ăn gian ở bước 3** (server kiểm): người dùng gõ lại cụm; gõ sai → chỉ chấp nhận **Quên**; gõ đúng nhưng dùng gợi ý → không chấp nhận **Dễ**; chọn Khó/Dễ phải kèm một câu mới hợp lệ và không trùng câu cũ.
- **Streak của sổ**: một ngày tính nếu có ≥ 1 hành động trong sổ (đặt câu, nhớ lại, nói). Streak chạy lùi từ hôm nay, hoặc từ hôm qua nếu hôm nay chưa có.

Các hàm thuần nằm ở `services/phrase-schedule.ts`.

## 6. So khớp "câu có chứa cụm từ" (`services/phrase-matcher.ts`)

Server là nguồn sự thật. Quy tắc:
- Chuẩn hoá: chữ thường, bỏ dấu câu, `’` → `'`; bỏ `to` đứng đầu cụm.
- **Dạng chia**: mỗi token của cụm khớp token câu nếu cùng một dạng (`-s/-es/-ies`, `-ed/-ied`, `-ing`, gấp đôi phụ âm cuối: `running`, `stopped`, bỏ `e`: `making`) hoặc cùng một nhóm bất quy tắc (`be/is/was/been…`, `meet/met`, `take/took/taken`…). Có bảng, không cắt đuôi ngây thơ.
- **Mạo từ / từ hạn định** (`a an the my your his her its our their this that these those some any`) coi là tương đương nhau và **được phép vắng** (`meet deadlines` khớp `meet a deadline`).
- `sb`, `sth`, `someone`, `something`, `somebody`, `one's`, `oneself` là ký tự đại diện (1 đến 3 token).
- Token dạng `a/b` khớp một trong các lựa chọn.
- Các token của cụm phải xuất hiện **đúng thứ tự** và cách nhau **tối đa 3 token** (câu "I meet him… the deadline" không khớp).
- File test dùng chung `phrase-matcher.cases.json` (input + kết quả mong đợi). Bản frontend (để báo ngay khi gõ) chạy cùng file này để hai phía không lệch.

## 7. API (`api/v1/daily-gate/phrases`, controller riêng trong `DailyGateModule`)

| Method | Đường dẫn | Việc |
|---|---|---|
| GET | `/phrases?due=true&stage=` | Danh sách. `due=true` chỉ trả cụm `stage ≠ WRITE` và `nextReviewAt ≤ hôm nay` |
| GET | `/phrases/summary` | Tổng số, mastered, đến hạn, chưa đặt câu, **streak riêng của sổ**. Khai báo **trước** `:id` |
| GET | `/phrases/:id` | Chi tiết kèm `examples` và `spokenAttempts` |
| POST | `/phrases` | Thêm (`wordId?`); trùng (theo `phraseNormalized`) → 409 |
| PATCH / DELETE | `/phrases/:id` | Sửa / xoá |
| POST | `/phrases/:id/examples` | Bước 2: câu phải chứa cụm; lưu, `WRITE → RECALL` |
| POST | `/phrases/:id/review` | Bước 3: `{ answer, usedHint, grade, sentence? }`, server kiểm theo mục 5 |
| POST | `/phrases/:id/spoken` | Bước 4: chỉ nhận `{ transcript }`, server tự tính `containsPhrase`, `speakPassed` |

Nhận dạng giọng nói chạy trên trình duyệt. Server của ta không nhận âm thanh, nhưng **Chrome gửi âm thanh lên dịch vụ của Google** để nhận dạng; UI cần ghi rõ một dòng này ở Màn hình D.

## 8. Quyết định đã chốt

1. **Sổ cụm từ là tab độc lập**, không bắt buộc với gate. Tên tab: **"Sổ cụm từ"** (là kho cụm từ riêng của người dùng; việc luyện là các bước bên trong). Nút ở bước Học: **"Lưu vào sổ"**, sau khi lưu đổi thành **"Đã lưu"**.
2. **Chưa làm AI.** Chỉ kiểm tra "câu có chứa cụm". Giữ sẵn `isCorrect`, `feedback` để cắm AI sau mà không cần migrate.
3. **Streak riêng** cho sổ; chỉ hiện trong tab Sổ cụm từ, không đưa vào `StatsView`.
4. **Người dùng tự nhập nghĩa** ("Nghĩa / gợi nhớ", bắt buộc, không điền sẵn); không thêm cột cho giáo trình.
5. **"Khó" làm tròn lên bằng `ceil`, `intervalDays` kiểu `Int`.**

## 9. Kế hoạch và trạng thái

1. ✅ Bộ so khớp cụm từ và logic lịch ôn (thuần TypeScript, có test)
2. ✅ Backend: migration, service, controller, test
3. ✅ Frontend: tab + Sổ cụm từ + Màn hình A và E, nút "Lưu vào sổ" / "Đã lưu" ở bước Học
4. ✅ Màn hình B (tự đặt câu)
5. ✅ Màn hình C (nhớ lại)
6. ✅ Màn hình D (nói; fallback gõ chữ nếu trình duyệt không hỗ trợ)
7. ⬜ Chấm ngữ pháp bằng AI (sau cùng, tuỳ chọn)

Tuân thủ CLAUDE.md ở frontend: neo-brutalism, cva, jest-axe, chạm ≥ 44px, `aria-label` cho nút icon, chạy ở 375px và bằng bàn phím.

## 10. Ngoài phạm vi

Gợi ý collocation bằng AI, chấm phát âm, tình huống hội thoại do AI tạo (bước 4 dùng kho tình huống soạn sẵn theo `section`), đồng bộ ngoại tuyến.
