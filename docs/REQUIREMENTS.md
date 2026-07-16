# Requirements v2.0

## Public blog

- Homepage hiển thị tên Helios Blog, mô tả ngắn và các bài gần đây.
- Chỉ bài `published = true` được hiển thị công khai.
- Người đọc có thể lọc theo tag, danh mục, mức độ, kiểu Standalone/Series và sắp xếp bài viết.
- Card, list, QR và trang chi tiết hiển thị ngày, thời gian đọc, mức độ và kiểu bài.
- Bài thuộc series hiển thị Part X of Y và liên kết Previous/Next chỉ từ các bài đã xuất bản; series một bài không hiện navigation.
- Search hỗ trợ tiêu đề, mô tả và cú pháp `#tag`.
- Trang bài viết render MDX, code highlighting, mục lục, bài liên quan, chia sẻ và tải nội dung Markdown.

## CMS

- `/admin` và `/api/admin/*` yêu cầu session admin hợp lệ.
- Admin có thể tạo, sửa, xoá, xuất bản bài viết và quản lý danh mục/tag.
- Danh mục có tên, slug, mục đích, ví dụ và emoji tuỳ chọn; không thể xoá khi vẫn có bài viết tham chiếu.
- Form bài viết yêu cầu chọn danh mục, mức độ và nhập thời gian đọc từ 1 đến 120 phút; hệ thống không tự tính thời gian đọc.
- Form bài viết có chế độ Standalone/Series. Chế độ Series yêu cầu chọn series và order nguyên dương chưa được dùng; có thể tạo series ngay trong field và tự chọn bản ghi mới.
- Admin có thể tạo, sửa, tìm kiếm và xoá series; UI và API chặn xoá khi series còn bài.
- Form sửa/xoá post và sửa/xoá tag dùng combobox tìm nhanh; bộ lọc nâng cao chỉ mở khi admin cần lọc theo nhiều tiêu chí hoặc phân trang.
- Ảnh được upload và quản lý trong Cloudflare R2 bucket `my-blog`.
- Upload chỉ nhận AVIF, GIF, JPEG, PNG hoặc WebP và giới hạn 10 MB mỗi file.
- Database viewer chỉ đọc các bảng thuộc phạm vi blog.

## Auth

- Chỉ có một admin, cấu hình bằng `ADMIN_USERNAME`.
- Mật khẩu dùng `ADMIN_PASSWORD_HASH` hoặc `ADMIN_PASSWORD`.
- Session dùng cookie HTTP-only, SameSite Lax và Secure ở production.
- `SESSION_SECRET` là bắt buộc ở production.
- Không có bảng tài khoản hoặc màn quản lý tài khoản.

## Appearance

- Dark theme là mặc định và có thể chuyển sang light theme.
- Accent mặc định là `#1f51ff`.
- Admin có thể nhập hoặc chọn một mã màu `#RRGGBB`.
- Màu được lưu toàn cục và mọi component nhận qua CSS token.
- Giao diện phải hoạt động tốt trên mobile và desktop.

## Data

- Database mới được khởi tạo bằng `supabase/schema.sql`.
- Các bảng gồm `post`, `category`, `series`, `tag`, `post_tags`, `site_settings`.
- Bài viết tham chiếu category slug động và dùng ba mức `beginner`, `intermediate`, `advanced`.
- `post.series_id` và `post.series_order` phải cùng null hoặc cùng có giá trị; order là số nguyên dương, duy nhất trong từng series và foreign key dùng `on delete restrict`.
- Kiểu bài không được lưu thành cột riêng: Standalone/Series được suy ra từ `series_id`. Category `series` độc lập với bảng series.
- Public read dùng publishable key và Supabase RLS; CMS write dùng secret key ở server.
- API ghi dữ liệu từ chối field lạ, sai kiểu, slug sai định dạng, nội dung vượt giới hạn và quá 5 tag trên một bài.
- Media dùng Cloudflare R2, mặc định là bucket private được phục vụ qua `/api/media/*`.
- Service key không được đưa xuống client.
