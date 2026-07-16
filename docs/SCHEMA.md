# Schema v2.0

Toàn bộ database được khởi tạo từ một nguồn duy nhất tại `supabase/schema.sql`. Chạy trọn file này trong Supabase SQL Editor trên database mới; project không duy trì migration trùng lặp.

## `public.post`

Lưu bài viết MDX.

| Field | Ghi chú |
| --- | --- |
| `id` | Identity primary key |
| `slug` | Unique, lowercase và dấu gạch ngang |
| `title` | Tiêu đề |
| `description` | Mô tả ngắn |
| `content` | Nội dung MDX |
| `image_url` | Ảnh bìa |
| `category` | Slug tham chiếu `category.slug` |
| `level` | `beginner`, `intermediate`, `advanced` |
| `reading_time` | Thời gian đọc do tác giả nhập, từ 1 đến 120 phút |
| `series_id` | Nullable foreign key tới `series.id` |
| `series_order` | Nullable số thứ tự dương trong series |
| `published` | Trạng thái công khai |
| `published_at` | Thời điểm xuất bản |

Constraint đảm bảo slug đúng dạng chữ thường/số phân cách bằng một dấu gạch ngang; title tối đa 120 ký tự, description 300, content 50.000, slug 200, URL ảnh 2.048 ký tự và thời gian đọc là số nguyên trong khoảng 1–120 phút.

Foreign key category dùng `on update cascade` và `on delete restrict`: đổi slug sẽ cập nhật các bài liên quan, còn danh mục đang được dùng không thể bị xoá. `level` là định hướng kiến thức cho người đọc; `reading_time` là ước tính thủ công, không được suy ra tự động từ số từ.

`series_id` và `series_order` luôn cùng null hoặc cùng có giá trị. Order phải dương và unique theo cặp `(series_id, series_order)`. Foreign key series dùng `on delete restrict`; Standalone/Series được suy ra từ `series_id`, không có cột `type`.

## `public.series`

Lưu chuỗi bài viết với `id`, `name`, `slug`, `description` tuỳ chọn và timestamp. Name/slug unique; name tối đa 100 ký tự, slug tối đa 100 và description tối đa 500. Bảng được đọc công khai để metadata bài published hoạt động, nhưng chỉ admin API được ghi.

Category seed `Series` hoàn toàn độc lập: category mô tả nhóm nội dung, còn `public.series` quản lý thứ tự và điều hướng giữa các bài.

## `public.category`

Lưu danh mục do CMS quản lý. Mỗi bản ghi có `name`, `slug`, `description`, `examples`, `display_order`, timestamp và `icon` tuỳ chọn. Danh mục được public read qua RLS để form lọc, badge, trang About và route `/category/[slug]` dùng chung dữ liệu.

Schema seed theo thứ tự: Articles, Projects, Series, Notes, Ideas, Journeys, Snippets, Reviews, Resources, Life, Gallery và Changelog.

| Icon | Name | Slug | Mục đích | Ví dụ |
| --- | --- | --- | --- | --- |
| 📝 | Articles | `articles` | Các bài viết kiến thức chính | Docker, Kubernetes, FastAPI, Linux |
| 🚀 | Projects | `projects` | Giới thiệu các dự án | URL Shortener, Blog CMS, Monitoring Stack |
| 📖 | Series | `series` | Chuỗi bài viết | Learn Kubernetes, Build a SaaS, DevOps Roadmap |
| 📒 | Notes | `notes` | Ghi chú ngắn | Cheat sheet Git, Linux Commands |
| 💡 | Ideas | `ideas` | Ý tưởng | Startup Ideas, App Ideas |
| 🎯 | Journeys | `journeys` | Nhật ký học tập | 100 Days of Code, Internship Journey |
| ⚡ | Snippets | `snippets` | Code ngắn | Regex, SQL, Bash, TypeScript |
| 📚 | Reviews | `reviews` | Review sách, khóa học | Clean Architecture, Designing Data Intensive Applications |
| 🛠 | Resources | `resources` | Công cụ | VSCode Extensions, Docker Images |
| 🌏 | Life | `life` | Cuộc sống cá nhân | Gym, Productivity, Travel |
| 📷 | Gallery | `gallery` | Hình ảnh | Minecraft, Photography |
| 📰 | Changelog | `changelog` | Cập nhật blog | Version blog, thay đổi giao diện |

## `public.tag`

Lưu tên và slug duy nhất của tag. Tên tối đa 80 ký tự, slug tối đa 100 ký tự và dùng cùng định dạng slug của bài viết.

## `public.post_tags`

Quan hệ nhiều-nhiều giữa bài viết và tag. Hai foreign key dùng `on delete cascade`.

## `public.site_settings`

| Field | Ghi chú |
| --- | --- |
| `key` | Primary key dạng snake_case |
| `value` | JSONB |
| `is_public` | Cho phép public read qua RLS |
| `updated_at` | Tự cập nhật bằng trigger |

Khóa được seed ban đầu:

```text
accent_color = "#1f51ff"
```

## RLS

- Anonymous chỉ đọc bài đã xuất bản.
- Danh mục được đọc công khai.
- Series được đọc công khai; post policy vẫn quyết định bài nào xuất hiện public.
- Tag và quan hệ tag của bài đã xuất bản được đọc công khai.
- Chỉ settings có `is_public = true` được đọc công khai.
- Ghi dữ liệu được thực hiện bởi server dùng service key.

## Storage

Media không nằm trong Supabase schema. Ảnh được lưu trong Cloudflare R2 bucket `my-blog`; create folder, upload, list, rename và delete đi qua API admin.

Khi bucket private, route `/api/media/[...key]` stream object công khai với cache header. Có thể cấu hình `R2_PUBLIC_URL` để dùng custom domain của R2 thay cho route proxy.

Bucket production hiện dùng custom domain `https://bucket-blog.helios.id.vn`.
