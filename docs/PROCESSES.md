# Processes v2.0

## Khởi tạo

1. Tạo Supabase project mới.
2. Chạy `supabase/schema.sql` trong SQL Editor.
3. Tạo Cloudflare R2 API token có quyền Object Read & Write cho bucket `my-blog`.
4. Tạo `.env` từ `.env.example`.
5. Cấu hình Supabase keys, R2 credentials, admin credential và session secret.
6. Chạy `pnpm dev`.

## Đăng nhập admin

1. Admin mở `/auth`.
2. Server xác nhận đúng một nguồn mật khẩu được cấu hình: plaintext hoặc SHA-256 hash 64 ký tự hex.
3. API so sánh username và SHA-256 của mật khẩu theo thời gian cố định.
4. Server ký session bằng HMAC-SHA256.
5. Cookie HTTP-only được dùng để bảo vệ trang và API quản trị.

Production nên chỉ dùng `ADMIN_PASSWORD_HASH`. Sau khi đặt lại env trên Vercel, xóa `ADMIN_PASSWORD` và redeploy để deployment mới nhận credential.

## Viết và xuất bản

1. Admin mở `/admin` và tạo bài mới.
2. Nhập title, slug, description, category, level, thời gian đọc, kiểu bài, image, tag và nội dung MDX.
3. Kiểm tra preview trước khi lưu.
4. Lưu nháp để tiếp tục chỉnh sửa hoặc bật xuất bản ngay.
5. Bài được revalidate trên homepage, danh sách và trang chi tiết.

Category chọn từ danh sách do CMS quản lý. Level chọn cơ bản, trung cấp hoặc nâng cao. Thời gian đọc là số phút do tác giả ước tính thủ công trong khoảng 1–120.

Với bài độc lập, giữ chế độ Standalone. Với bài theo chuỗi, chọn Series, tìm series theo ID/tên/slug rồi dùng order được đề xuất hoặc nhập order khác chưa được dùng. Nút `+` trong field mở modal tạo series và tự chọn series mới. Chuyển lại Standalone sẽ xoá cả series và order khi lưu.

Khi sửa hoặc xoá, nhập trực tiếp vào field để tìm nhanh. Nút bộ lọc trong field mở selector nâng cao: post có thể lọc theo từ khoá, category, level, type, trạng thái và tag; post/tag/series đều có phân trang để không phụ thuộc một dropdown dài.

## Quản lý series

1. Tạo series tại section Tạo mới hoặc từ field Series trong form bài viết.
2. Nhập name, slug và description tuỳ chọn; slug tự sinh nhưng có thể chỉnh.
3. Sửa hoặc xoá qua quick search hay advanced selector theo ID, name và slug.
4. Trước khi xoá, gỡ toàn bộ bài khỏi series bằng cách chuyển chúng sang Standalone hoặc sang series khác.
5. API trả `409` nếu order bị trùng hoặc series vẫn còn bài.

## Quản lý danh mục

1. Admin mở section Danh mục tại `/admin`.
2. Tạo hoặc sửa tên, slug, mục đích, ví dụ và emoji tuỳ chọn.
3. Khi đổi slug, foreign key tự cập nhật category của các bài đang dùng.
4. Chỉ xoá danh mục có số bài bằng 0; UI và API đều chặn xoá khi còn tham chiếu.

## Quản lý ảnh

1. Admin mở `/admin/bucket`.
2. Nhập tên và nhấn Tạo thư mục; danh sách và bộ lọc được làm mới để folder mới xuất hiện ngay, sau đó mở folder và upload ảnh.
3. Server ghi object qua S3 API của Cloudflare R2.
4. Chọn ảnh trực tiếp trong form bài viết hoặc sao chép URL `/api/media/*`.
5. Custom domain hiện tại là `https://bucket-blog.helios.id.vn`, được cấu hình qua `R2_PUBLIC_URL` để URL mới dùng Cloudflare trực tiếp.
6. Khi đổi tên hoặc xoá file, kiểm tra các bài đang tham chiếu URL cũ.

## Chỉnh màu accent

1. Admin mở `/admin`.
2. Chọn màu hoặc nhập mã hex sáu chữ số.
3. API lưu `accent_color` vào `site_settings`.
4. Cache settings được revalidate.
5. Context phía client cập nhật CSS token ngay sau khi lưu.

## Kiểm tra trước release

```bash
pnpm check
```

Sau đó kiểm tra homepage, search, bài showcase MDX, đăng nhập, series CRUD/order/navigation, CMS, selector nâng cao, database viewer, tạo folder/upload R2, banner cooldown, theme và accent trên desktop/mobile.
