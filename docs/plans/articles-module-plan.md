# Kế hoạch triển khai: Articles Module

Frontend: `paper-and-progress` (Next.js App Router, TypeScript strict, Tailwind v4, neo-brutalism).
Backend: `backend-paper-and-progress` (NestJS, Prisma, PostgreSQL, Redis).
Mỗi bước dưới đây tự chạy được và tự kiểm chứng được. Làm theo thứ tự; xong bước nào thì commit bước đó.

## 0. Những chỗ trong bản thiết kế gốc cần chỉnh (đọc trước)

| Ý trong bản gốc | Vấn đề | Cách làm trong plan này |
|---|---|---|
| `@@fulltext([title, content])` | Chỉ có cho MySQL/MongoDB, **không dùng được với PostgreSQL** | Thêm cột `searchVector tsvector` + GIN index bằng migration SQL, query bằng `$queryRaw` (Bước 2, 5) |
| `cache-manager-redis-store` | Gói cũ, không hợp `cache-manager` v5/v6 | Dùng `@nestjs/cache-manager` + `@keyv/redis` + `keyv` (Bước 4) |
| `@tiptap/extension-link`, `-heading`, `-highlight` | TipTap **v3** (đã cài, 3.32) đã gồm Link, Underline, Heading trong `starter-kit`; Highlight đã cài | Chỉ cần thêm `extension-image`, `extension-table`, `extension-code-block-lowlight`, `lowlight` |
| Cài cả `lowlight` **và** `shiki` | Hai bộ highlight cho hai việc trùng nhau | Editor dùng `lowlight`; **reader dùng `lowlight` qua `toHtml`** (cùng token class), bỏ `shiki` (Bước 6) |
| `react-markdown`, `rehype-highlight` | Lưu TipTap thì không cần Markdown | Bỏ. Lưu **JSON** + cột `html` đã sanitize cho reader |
| ISR + nội dung Members Only | Trang ISR dùng chung cho mọi người, không thể chứa nội dung riêng theo user | Trang ISR chỉ chứa phần công khai (public/preview). Phần đầy đủ của Members Only tải **phía client** có token (Bước 4, 6) |
| Scheduled publish | Plan gốc chỉ có date picker | Thêm job nền `@nestjs/schedule` mỗi phút (Bước 3) |
| Upload ảnh | `multer` chỉ cần cho dev | Dev: `multer` ra đĩa; prod: presigned URL S3 (đã có `@aws-sdk/client-s3` trong backend) |

Quyết định cần chốt trước khi code (mặc định đề xuất in đậm):

1. Ai được viết bài: **ADMIN và CREATOR** (enum `Role` đã có `CREATOR`).
2. Lưu nội dung: **JSON (nguồn sự thật) + `html` đã sanitize (để render và SEO)**.
3. Preview cắt ở **30% số block** (không cắt giữa thẻ HTML).
4. Ảnh prod: **S3 + CloudFront** (hợp với việc bạn đang học SAA-C03).

---

## Bước 1. Cài thư viện

Backend:

```bash
cd backend-paper-and-progress
pnpm add @nestjs/cache-manager cache-manager @keyv/redis keyv @nestjs/schedule \
  @aws-sdk/s3-request-presigner sanitize-html slugify
pnpm add -D @types/sanitize-html
# @aws-sdk/client-s3 và multer đã có trong dự án
```

Frontend:

```bash
cd paper-and-progress
npm i @tiptap/extension-image @tiptap/extension-table @tiptap/extension-code-block-lowlight lowlight
# Đã có sẵn: @tiptap/react, starter-kit, highlight, placeholder, canvas-confetti
```

Kiểm tra: `pnpm build` (backend) và `npx tsc --noEmit` (frontend) vẫn xanh.

---

## Bước 2. Prisma schema và migration

Thêm vào `prisma/schema.prisma` (đặt cùng style các model hiện có, id dạng `uuid`):

```prisma
enum ArticleStatus { DRAFT SCHEDULED PUBLISHED ARCHIVED }
enum ArticleVisibility { PUBLIC PREVIEW MEMBERS_ONLY }
enum ReactionType { LIKE LOVE INSIGHTFUL CELEBRATE }

model Article {
  id            String            @id @default(uuid())
  slug          String            @unique
  title         String            @db.VarChar(200)
  excerpt       String?           @db.VarChar(400)
  coverImageUrl String?
  contentJson   Json              // TipTap JSON, nguồn sự thật
  contentHtml   String            @db.Text // đã sanitize, dùng để render
  contentText   String            @db.Text // text thuần, để tính reading time và search
  readingMinutes Int              @default(1)
  status        ArticleStatus     @default(DRAFT)
  visibility    ArticleVisibility @default(PUBLIC)
  publishedAt   DateTime?
  scheduledAt   DateTime?
  authorId      String
  seriesId      String?
  seriesOrder   Int?
  viewCount     Int               @default(0)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  author    User      @relation(fields: [authorId], references: [id])
  series    Series?   @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  tags      ArticleTag[]
  comments  Comment[]
  reactions Reaction[]
  bookmarks Bookmark[]
  revisions ArticleRevision[]
  views     ArticleView[]

  @@index([status, publishedAt])
  @@index([authorId])
  @@index([seriesId, seriesOrder])
}

model Tag        { id String @id @default(uuid()) name String @unique slug String @unique articles ArticleTag[] }
model ArticleTag { articleId String tagId String article Article @relation(fields: [articleId], references: [id], onDelete: Cascade) tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade) @@id([articleId, tagId]) }
model Series     { id String @id @default(uuid()) title String slug String @unique description String? articles Article[] }

model Comment {
  id        String   @id @default(uuid())
  articleId String
  userId    String
  parentId  String?
  body      String   @db.Text
  isDeleted Boolean  @default(false) // xoá mềm để không gãy cây trả lời
  createdAt DateTime @default(now())
  article Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent  Comment? @relation("Replies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("Replies")
  @@index([articleId, createdAt])
}

model Reaction  { articleId String userId String type ReactionType createdAt DateTime @default(now())
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([articleId, userId, type]) }
model Bookmark  { articleId String userId String createdAt DateTime @default(now())
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([articleId, userId]) }

model ArticleRevision {
  id String @id @default(uuid())
  articleId String
  title String
  contentJson Json
  contentHtml String @db.Text
  createdById String
  createdAt DateTime @default(now())
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  @@index([articleId, createdAt])
}

model ArticleView {
  id String @id @default(uuid())
  articleId String
  userId String?
  maxScrollPercent Int @default(0) // 0/25/50/75/100
  createdAt DateTime @default(now())
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  @@index([articleId, createdAt])
}
```

Thêm vào `User`: `articles Article[]`, `comments Comment[]`, `reactions Reaction[]`, `bookmarks Bookmark[]`.

Full-text search (Prisma chưa hỗ trợ tsvector): tạo migration rỗng rồi sửa tay.

```bash
npx prisma migrate dev --name add_articles --create-only
```

Thêm vào cuối file `migration.sql`:

```sql
ALTER TABLE "Article" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("contentText", '')), 'C')
  ) STORED;
CREATE INDEX "Article_searchVector_idx" ON "Article" USING GIN ("searchVector");
```

(Dùng cấu hình `simple` vì nội dung có cả tiếng Việt và tiếng Anh.) Rồi `npx prisma migrate dev`.

Kiểm tra: `npx prisma migrate status` báo "up to date"; `psql` thấy cột `searchVector` và index.

---

## Bước 3. Backend: ArticlesModule

Cấu trúc (theo quy ước `modules/<tên>/{controllers,services,dto}` và import có đuôi `.js`):

```
src/modules/articles/
  articles.module.ts
  controllers/ articles.controller.ts  tags.controller.ts  series.controller.ts
                comments.controller.ts  upload.controller.ts  analytics.controller.ts
  services/    articles.service.ts  content.service.ts  tags.service.ts  series.service.ts
                comments.service.ts  upload.service.ts  analytics.service.ts  revisions.service.ts
  dto/         create-article.dto.ts  update-article.dto.ts  list-articles.dto.ts ...
```

3.1 `ContentService` (thuần, dễ test): từ TipTap JSON ra `html`, `text`, `readingMinutes`, `headings`.

- `sanitize(html)` bằng `sanitize-html`: chỉ cho thẻ/thuộc tính TipTap tạo ra (`p h1-h3 ul ol li blockquote pre code strong em u s a img table...`), `a[href]` chỉ http/https/mailto, `img[src]` chỉ từ domain CDN của mình, ép `rel="noopener noreferrer"` cho link ngoài.
- `readingMinutes = Math.max(1, Math.ceil(words / 200))` (đếm từ trên `text`).
- `previewHtml(html, ratio = 0.3)`: tách `html` thành các block cấp 1, giữ `ceil(n * ratio)` block đầu (tối thiểu 1). Không cắt giữa thẻ.

3.2 Quy tắc truy cập (`ArticlesService.getBySlug(slug, user?)`):

| Điều kiện | Kết quả |
|---|---|
| Không tìm thấy hoặc `DRAFT/SCHEDULED/ARCHIVED` mà người xem không phải tác giả/ADMIN | `404` (không lộ là có tồn tại) |
| `PUBLIC` | đầy đủ |
| `PREVIEW`, đã đăng nhập | đầy đủ |
| `PREVIEW`, chưa đăng nhập | `{ gated: true, previewHtml, fullAvailable: true }` |
| `MEMBERS_ONLY`, chưa đăng nhập | `401` kèm `{ gated: true, title, excerpt }` (đủ cho SEO/preview card, không có nội dung) |

Dùng guard tuỳ chọn `OptionalJwtAuthGuard` (cho phép request không token) để cùng một endpoint phục vụ cả khách và thành viên.

3.3 Endpoint (prefix `api/v1`):

```
GET    /articles                 danh sách đã đăng: ?tag=&series=&q=&cursor=&limit=  (public)
GET    /articles/:slug           chi tiết, áp dụng bảng quy tắc trên           (optional auth)
GET    /articles/mine            bài của tôi, mọi trạng thái                    (CREATOR/ADMIN)
POST   /articles                 tạo (mặc định DRAFT)                           (CREATOR/ADMIN)
PATCH  /articles/:id             sửa, tạo revision                              (tác giả/ADMIN)
POST   /articles/:id/publish     PUBLISHED hoặc SCHEDULED nếu có scheduledAt    (tác giả/ADMIN)
POST   /articles/:id/archive
DELETE /articles/:id
GET    /articles/:id/revisions   ;  POST /articles/:id/revisions/:rid/restore
CRUD   /tags  /series
GET    /articles/:id/comments (cây)  ;  POST ...  ;  DELETE /comments/:id (xoá mềm)
PUT/DELETE /articles/:id/reactions/:type  ;  PUT/DELETE /articles/:id/bookmark
POST   /uploads/presign          { filename, contentType } -> { uploadUrl, publicUrl }
POST   /articles/:id/views       { maxScrollPercent }  (không cần đăng nhập)
```

3.4 Slug: `slugify(title, { lower: true, locale: 'vi', strict: true })`; nếu trùng thì thêm `-2`, `-3`... Slug đã đăng không đổi khi sửa tiêu đề (tránh gãy link), trừ khi tác giả chủ động đổi.

3.5 Revision: mỗi `PATCH` có nội dung đổi và mỗi `publish` tạo một `ArticleRevision` (giữ tối đa 50 bản mới nhất mỗi bài). Auto-save của editor gọi `PATCH` nhưng **gộp**: nếu revision gần nhất của cùng người tạo dưới 2 phút thì ghi đè thay vì tạo mới.

3.6 Đăng theo lịch: `@nestjs/schedule`, `@Cron('* * * * *')` chuyển `SCHEDULED` đến hạn sang `PUBLISHED`, rồi gọi revalidate (Bước 6.4).

3.7 Tìm kiếm (`?q=`):

```ts
this.prisma.$queryRaw`
  SELECT id FROM "Article"
  WHERE status = 'PUBLISHED' AND "searchVector" @@ websearch_to_tsquery('simple', ${q})
  ORDER BY ts_rank("searchVector", websearch_to_tsquery('simple', ${q})) DESC
  LIMIT ${limit}`
```

rồi `findMany({ where: { id: { in: ids } } })` để lấy quan hệ và giữ thứ tự theo rank.

3.8 Phân trang: cursor theo `(publishedAt, id)`, trả `{ items, nextCursor }`.

Test (vitest, mock Prisma như `todos.service.spec.ts`): bảng quy tắc truy cập (7 ca), sanitize (chặn `<script>`, `onerror`, `javascript:`), `previewHtml` không để thẻ mở dở, sinh slug trùng, scheduled -> published, revision gộp trong 2 phút.

---

## Bước 4. Backend: cache, đếm lượt xem, upload

4.1 Cache bằng `@nestjs/cache-manager`:

```ts
CacheModule.registerAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    stores: [new KeyvRedis(`redis://${config.get('REDIS_HOST')}:${config.get('REDIS_PORT')}`)],
    ttl: 60_000,
  }),
})
```

Cache danh sách (key theo bộ lọc, TTL 60s) và "bài nổi bật" (TTL 5 phút). Mọi thao tác ghi (publish/sửa/xoá) xoá các key `articles:list:*` (dùng `SCAN`, không dùng `KEYS`). **Không cache** phản hồi có token (nội dung Members Only).

4.2 Lượt xem: `POST /articles/:id/views` chỉ `INCR article:views:{id}` trong Redis và ghi `ArticleView` khi có `maxScrollPercent`. `@Cron('*/5 * * * *')` đọc các key, cộng dồn vào `Article.viewCount` rồi trừ lại phần đã ghi (dùng `GETDEL`/`DECRBY` để không mất số đếm giữa chừng). Chống đếm lặp: key `viewed:{id}:{ip hoặc userId}` TTL 30 phút. Throttle endpoint này (đã có `@nestjs/throttler`).

4.3 Upload ảnh:

- `POST /uploads/presign` (đăng nhập, CREATOR/ADMIN): kiểm tra `contentType` thuộc `image/jpeg|png|webp|gif`, giới hạn kích thước qua `Conditions` của presigned POST (`content-length-range` 0 đến 5MB). Key: `articles/{userId}/{yyyy}/{uuid}.{ext}`. Trả `{ uploadUrl, fields, publicUrl }`.
- Dev (không có `AWS_S3_BUCKET`): fallback `POST /uploads/local` dùng `multer` ghi vào `uploads/articles/`, serve tĩnh qua `ServeStaticModule`. Frontend không cần biết đang ở chế độ nào: cùng nhận `{ uploadUrl, publicUrl }`.
- Thêm vào `env.schema.ts`: `AWS_S3_BUCKET`, `CDN_BASE_URL`, `REVALIDATE_SECRET`, `FRONTEND_URL` (đã có) đều `optional()`.
- Cấu hình CORS của bucket cho `FRONTEND_URL` (PUT/POST).

Test: giới hạn loại file, throttle, cộng dồn lượt xem không mất số khi có request đồng thời.

---

## Bước 5. Frontend: nền tảng (types, API client)

Theo quy ước dự án: `src/features/articles/` (domain), component dùng `@/design-system`, **không** tự đặt border/shadow riêng, bọc trang bằng `PageContainer size="wide"` (đúng quy tắc "Layout trang" trong `CLAUDE.md`).

```
src/features/articles/
  types.ts  articlesApi.ts  readingTime.ts  toc.ts
  components/ ArticleCard/  ArticleList/  ArticleFilters/  ArticleReader/  ArticleBody/
              ReadingProgress/  TableOfContents/  ReactionBar/  BookmarkButton/  ShareButton/
              GatedOverlay/  CommentThread/  JsonLd/
  editor/     ArticleEditor/  EditorToolbar/  ImageUpload/  TagPicker/  SeriesPicker/
              VisibilitySelect/  SchedulePicker/  RevisionPanel/  useAutosave.ts
  admin/      ArticleStatsTable/
```

- `articlesApi.ts`: có **hai client**: `publicApi` (server components, không token, dùng cho ISR) và `authedApi` (đã có, client components).
- `toc.ts`: `extractToc(html)` trả `{ id, text, level }[]` và `addHeadingIds(html)` thêm `id` vào `h2/h3` (chạy ở server khi render).
- `readingTime.ts` dùng lại công thức ở backend cho phần xem trước trong editor.

Test: `extractToc` (id trùng thì thêm hậu tố), `readingTime`.

---

## Bước 6. Frontend: danh sách và chi tiết

6.1 Route:

```
src/app/(marketing)/articles/page.tsx            danh sách (ISR)
src/app/(marketing)/articles/[slug]/page.tsx     chi tiết (ISR + metadata + JSON-LD)
src/app/sitemap.ts   src/app/robots.ts
src/app/api/revalidate/route.ts
```

Lưu ý dự án đang bật `cacheComponents`, và route có tham số động đã gặp lỗi `usePathname` khi build (header gốc đọc pathname ngoài Suspense). Cho `[slug]`: dùng `generateStaticParams` trả về slug các bài đã đăng, **hoặc** bọc phần đọc `usePathname` trong layout bằng `Suspense`. Kiểm tra bằng `next build` ngay khi tạo route đầu tiên.

6.2 Trang danh sách: bộ lọc tag/series/tìm kiếm đặt trong query string (`?tag=`), `ArticleCard` (ảnh bìa, tiêu đề, excerpt, reading time, tag), nút "Tải thêm" theo `nextCursor` (đơn giản và truy cập được hơn infinite scroll; nâng cấp sau nếu muốn).

6.3 Trang chi tiết:

- `export const revalidate = 3600`.
- `generateMetadata`: `title`, `description` (excerpt), `openGraph` (cover hoặc ảnh động), `alternates.canonical`, `robots: noindex` cho bài không công khai.
- `JsonLd`: component render `<script type="application/ld+json">` với `Article` (headline, datePublished, dateModified, author, image). Với Members Only dùng `isAccessibleForFree: false` và `hasPart` (chuẩn của Google cho paywall).
- `ArticleBody`: render `contentHtml` đã sanitize bằng `dangerouslySetInnerHTML` bên trong container `.rich-text` (đã có CSS trong `globals.css`), thêm style cho `pre code` với token của `lowlight`. Highlight chạy ở server: `toHtml(lowlight.highlightAuto(code))` khi build `contentHtml` ở backend, nên reader không cần JS.
- `ReadingProgress`: client component, một `requestAnimationFrame` đọc `scrollY / (scrollHeight - innerHeight)`, thanh `h-1` cố định dưới header (dùng `--app-header-height`), `motion-reduce` tắt chuyển động.
- `TableOfContents`: danh sách từ `extractToc`, đánh dấu mục đang đọc bằng `IntersectionObserver`; ẩn dưới `lg`, thu gọn thành `<details>`.
- `ReactionBar`, `BookmarkButton`: client, cập nhật lạc quan, cần đăng nhập (chưa đăng nhập thì mở trang login). `canvas-confetti` khi bấm CELEBRATE (đã cài; tôn trọng `prefers-reduced-motion`).
- `GatedOverlay`: với `gated: true` hiện `previewHtml` mờ dần xuống (`mask-image` gradient) và thẻ "Đăng nhập để đọc tiếp". Khi đã đăng nhập, client gọi lại `GET /articles/:slug` kèm token và thay bằng nội dung đầy đủ (vì trang ISR không chứa nội dung riêng).
- `ShareButton`: `navigator.share` nếu có, không thì sao chép liên kết.
- Gửi sự kiện đọc: `useReadTracking(articleId)` gửi `POST /views` khi cuộn qua 25/50/75/100% (mỗi mốc một lần, dùng `sendBeacon`).

6.4 Revalidate theo yêu cầu: backend sau khi publish/sửa/xoá gọi `POST {FRONTEND_URL}/api/revalidate` với header `x-revalidate-secret`. Route handler kiểm tra secret rồi `revalidatePath('/articles')` và `revalidatePath('/articles/' + slug)`; **secret đặt ở header, không đặt trên query string** (query string lộ trong log).

6.5 `sitemap.ts` lấy các bài `PUBLIC/PREVIEW` đã đăng (kèm `lastModified`), `robots.ts` chặn `/articles/new` và `/api`. OG image động: `app/(marketing)/articles/[slug]/opengraph-image.tsx` dùng `ImageResponse`.

Test (RTL + jest-axe theo quy ước): `ArticleCard`, `TableOfContents`, `GatedOverlay` (hiện/ẩn), `ReadingProgress` (mock scroll), `JsonLd` (nội dung JSON hợp lệ).

---

## Bước 7. Frontend: trình soạn thảo

Tái sử dụng `RichTextEditor` đã có trong `features/project-dashboard` bằng cách **chuyển nó sang chỗ dùng chung** (ví dụ `src/design-system/components/forms/RichTextEditor` hoặc `features/rich-text`) rồi mở rộng, không viết lại. Thêm: `Image`, `Table`, `CodeBlockLowlight` (cấu hình `lowlight` với `common`), toolbar có nút ảnh và bảng.

Route: `/articles/new`, `/articles/[id]/edit` (đặt trong `(application)` để đi qua `AuthGate`; kiểm tra role ở `layout.tsx` giống `AdminGate`, cho phép `ADMIN` và `CREATOR`).

- Tiêu đề, slug (tự sinh từ tiêu đề cho đến khi người dùng sửa tay), excerpt, ảnh bìa.
- `ImageUpload`: kéo thả hoặc dán ảnh vào editor -> `POST /uploads/presign` -> `PUT/POST` thẳng lên S3 bằng `fetch` -> chèn `<img src=publicUrl>`. Hiển thị tiến độ, báo lỗi rõ ràng, chặn file quá 5MB ở client trước.
- `TagPicker` (nhập tự do, gợi ý từ `/tags`), `SeriesPicker` + thứ tự trong series.
- `VisibilitySelect` (Public / Preview / Members Only), `SchedulePicker` dùng `DatePicker` của dự án + ô giờ.
- `useAutosave`: debounce 3 giây, gửi `PATCH`, hiển thị "Đã lưu lúc HH:mm" / "Đang lưu..." / "Lỗi, thử lại"; cảnh báo `beforeunload` khi có thay đổi chưa lưu.
- Nút: Lưu nháp, Xem trước (mở bản đọc trong tab mới bằng route tác giả `?preview=1`), Xuất bản / Lên lịch.

Test: tạo bài -> tự lưu -> xuất bản; upload ảnh lỗi (mock); autosave không gửi chồng request.

---

## Bước 8. Lịch sử phiên bản

- `RevisionPanel` (Drawer bên phải): danh sách `GET /articles/:id/revisions`, bấm một bản để xem so sánh.
- Diff: dùng thư viện nhẹ `diff` (jsdiff) trên `contentText` theo dòng/từ, không cần diff cấp cây ProseMirror. Hiển thị thêm/xoá bằng màu + ký hiệu (không chỉ dựa vào màu).
- "Khôi phục bản này" -> `POST .../restore` (tạo revision mới từ bản cũ, **không xoá lịch sử**), xác nhận bằng `AlertDialog`, rồi nạp lại editor.

Test: restore tạo revision mới; diff hiển thị đúng đoạn thay đổi.

---

## Bước 9. Thống kê (admin)

- Trang `/admin/articles` (thêm mục vào `ADMIN_NAV`): bảng bài viết với lượt xem, số reaction, bookmark, tỉ lệ đọc xong, sắp xếp theo cột; dùng lại `Table`, `TablePager`, `useAdminQuery` của feature `admin`.
- Backend `GET /admin/articles/stats`: `viewCount`, `COUNT(reactions)`, `COUNT(bookmarks)`, phân bố `maxScrollPercent` (25/50/75/100) từ `ArticleView`.
- Biểu đồ đọc theo mốc cuộn bằng `recharts` (đã cài).

---

## Bước 10. Bình luận

- `CommentThread`: cây lồng nhau (giới hạn 3 cấp hiển thị, cấp sâu hơn gộp "Xem thêm trả lời"), soạn bằng `Textarea`, xoá mềm hiển thị "[Đã xoá]".
- Chống lạm dụng: throttle theo user, giới hạn 2000 ký tự, **không render HTML** (hiển thị văn bản thuần, tự nhận diện URL), tránh phải sanitize markdown.

---

## Thứ tự làm và cách chia thành các lần commit

| # | Nội dung | Kiểm chứng xong khi |
|---|---|---|
| 1 | Bước 1 + 2 (cài thư viện, schema, migration) | migrate xanh, cột `searchVector` có |
| 2 | Bước 3.1 + 3.4 (`ContentService`, slug) | test sanitize và preview xanh |
| 3 | Bước 3.2, 3.3 (CRUD, truy cập, publish) | test bảng quy tắc truy cập xanh |
| 4 | Bước 3.5 - 3.8 (revision, lịch, search) | gọi thử bằng token thật |
| 5 | Bước 4 (cache, view, upload) | upload thử lên bucket/ổ đĩa |
| 6 | Bước 5 + 6.1 - 6.2 (nền tảng, danh sách) | `next build` xanh, trang `/articles` chạy |
| 7 | Bước 6.3 - 6.5 (chi tiết, SEO, revalidate) | Lighthouse SEO ≥ 95, metadata đúng |
| 8 | Bước 7 (editor) | tạo, lưu, xuất bản một bài từ giao diện |
| 9 | Bước 8, 9, 10 | restore, thống kê, bình luận |

Mỗi lần: `npx tsc --noEmit`, `npx eslint . --max-warnings 0`, `npx vitest run`, `next build` (frontend); `npx tsc --noEmit`, `npx vitest run` (backend).

## Rủi ro cần để ý

- **XSS:** `contentHtml` luôn đi qua `sanitize-html` ở backend trước khi lưu; không bao giờ render `contentJson` thô thành HTML ở client rồi tin nó.
- **Rò nội dung Members Only:** không đưa nội dung đầy đủ vào ISR, cache dùng chung, sitemap, OG image, JSON-LD hay `generateMetadata` (chỉ dùng tiêu đề/excerpt).
- **ISR + cache cũ:** sau khi đổi visibility từ Public sang Members Only phải revalidate ngay, nếu không bản cũ còn công khai tới 1 giờ.
- **Dung lượng bundle:** import `lowlight` bản `common` (không phải `all`); tải editor bằng `next/dynamic` vì chỉ trang soạn thảo cần.
- **Mã nguồn bên ngoài:** nội dung ảnh/embed người dùng nhập có thể tải từ domain lạ; giới hạn `img-src` bằng CSP khi đưa lên production.
