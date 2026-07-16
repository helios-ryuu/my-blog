# Helios Blog

Helios Blog v2.0 là blog cá nhân kèm CMS gọn nhẹ, xây dựng bằng Next.js, React, TypeScript, Supabase Postgres và Cloudflare R2. Nội dung hỗ trợ MDX, tag, danh mục, series có thứ tự, mức độ, thời gian đọc, ảnh bìa, bản nháp, tìm kiếm và giao diện sáng/tối.

## Tính năng

- Trang chủ tập trung vào bài viết mới.
- Danh sách bài viết có lọc tag, danh mục, mức độ, kiểu Standalone/Series, sắp xếp và hai chế độ hiển thị.
- Trang chi tiết MDX có syntax highlighting, mục lục, bài liên quan, điều hướng phần trước/sau trong series, công cụ chia sẻ và tải Markdown.
- CMS quản lý bài viết, danh mục, tag, series, trạng thái xuất bản và thư viện ảnh.
- Danh mục là dữ liệu động có thể thêm, sửa, xoá; schema seed 12 nhóm cá nhân từ Articles đến Changelog.
- Mỗi bài có một danh mục, ba mức độ và thời gian đọc do tác giả nhập thủ công.
- Series độc lập với danh mục: bài có thể là Standalone hoặc nhận `series_id` cùng thứ tự dương duy nhất trong series. Series đang có bài không thể bị xoá.
- Field chọn post/tag hỗ trợ tìm nhanh; nút bộ lọc nâng cao mở tìm kiếm nhiều tiêu chí và phân trang khi dữ liệu lớn.
- Một tài khoản admin duy nhất, cấu hình bằng biến môi trường.
- Màu accent toàn site được lưu trong Supabase và chỉnh bằng color selector.
- API ghi dữ liệu kiểm tra field, kiểu, độ dài, slug, URL, category, level, thời gian đọc và giới hạn tag trước khi chạm database.
- Card, list, preview và ảnh QR dùng cùng badge Type; trang chi tiết chỉ điều hướng qua các bài đã xuất bản trong series.
- Giao diện tiếng Việt/Anh, sáng/tối và responsive.

## Công nghệ

| Phần | Công nghệ |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI, next-themes |
| Data | Supabase Postgres, Cloudflare R2 |
| Content | MDX, Shiki, rehype-pretty-code, remark-gfm |
| UI | Lucide React, Framer Motion, Three.js |
| Package manager | pnpm 11 |

## Cấu trúc chính

```text
src/
├── app/
│   ├── admin/             # CMS, database viewer, media library
│   ├── api/               # Public, auth và admin APIs
│   ├── post/              # Danh sách và chi tiết bài viết
│   ├── tag/               # Bài viết theo tag
│   ├── category/          # Bài viết theo danh mục
│   └── page.tsx           # Trang chủ
├── components/
│   ├── features/admin/    # Form và công cụ CMS
│   ├── features/post/     # Card, list, detail và share
│   └── layout/            # Header, navigation, footer, shell
├── contexts/              # User và site settings
├── lib/                   # Data access, auth, storage
└── types/                 # Kiểu dữ liệu dùng chung

supabase/
└── schema.sql             # Toàn bộ database initialization
```

## Cài đặt

Yêu cầu Node.js 24 trở lên và Corepack.

```bash
corepack enable
pnpm install
cp .env.example .env
```

Điền các biến còn thiếu trong `.env`, sau đó mở Supabase SQL Editor và chạy [supabase/schema.sql](supabase/schema.sql) trên một database mới.

Chạy môi trường phát triển:

```bash
pnpm dev
```

Ứng dụng mở tại `http://localhost:3456`.

## Biến môi trường

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL Supabase project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Có | Public read theo Supabase RLS |
| `SUPABASE_SECRET_KEY` | CMS | Server-side database write |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL cho metadata |
| `ADMIN_USERNAME` | Có | Username admin duy nhất |
| `ADMIN_DISPLAY_NAME` | Không | Tên hiển thị trong header |
| `ADMIN_PASSWORD` | Local | Mật khẩu dạng text trong env |
| `ADMIN_PASSWORD_HASH` | Production | SHA-256 hex của mật khẩu |
| `SESSION_SECRET` | Production | Khoá ký session cookie |
| `R2_ENDPOINT` | Có | Cloudflare R2 S3 endpoint |
| `R2_BUCKET_NAME` | Có | Tên bucket R2 |
| `R2_ACCESS_KEY_ID` | Có | R2 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | Có | R2 API token secret access key |
| `R2_PUBLIC_URL` | Không | Custom domain public của bucket |

Chỉ cấu hình một trong `ADMIN_PASSWORD` và `ADMIN_PASSWORD_HASH`. Khi cả hai tồn tại, hash được ưu tiên.

File `.env` đã nằm trong `.gitignore`. Trên máy Linux/macOS, nên giới hạn quyền đọc bằng `chmod 600 .env` vì file chứa credential server và khoá session.

Tạo password hash:

```bash
printf '%s' 'your-password' | sha256sum
```

Tạo session secret:

```bash
openssl rand -hex 32
```

## Cloudflare R2

Media manager dùng AWS SDK với S3 API của R2. Tạo R2 API token có quyền Object Read & Write cho bucket, rồi điền `R2_ACCESS_KEY_ID` và `R2_SECRET_ACCESS_KEY`.

Bucket có thể giữ private. Khi `R2_PUBLIC_URL` trống, ứng dụng tạo URL `/api/media/<object-key>` và stream object qua server. Khi đã gắn custom domain production, đặt domain đó vào `R2_PUBLIC_URL` để media được phục vụ trực tiếp qua Cloudflare cache. `r2.dev` chỉ phù hợp cho development.

Cấu hình hiện tại dùng `https://bucket-blog.helios.id.vn` làm custom domain của bucket `my-blog`.

Media manager hỗ trợ tạo folder marker, upload, đổi tên và xoá. Folder vừa tạo được làm mới ngay trong danh sách; tên trống bị từ chối ở UI và API.

## Series

Admin có thể tạo series từ `/admin` hoặc ngay trong field Series của form bài viết. Form tự đề xuất order trống nhỏ nhất, vẫn cho nhập thủ công và hiển thị các order đang dùng. Chuyển bài về Standalone sẽ xoá cả `series_id` và `series_order`.

Không có route public `/series`: badge và điều hướng nằm trực tiếp trên card, list, QR và trang bài viết. Danh mục seed tên `Series` chỉ là một category nội dung, không liên kết với bảng `public.series`.

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `pnpm dev` | Chạy dev server tại port 3456 |
| `pnpm build` | Build production bằng webpack |
| `pnpm start` | Chạy production server |
| `pnpm lint` | Kiểm tra ESLint |
| `pnpm knip` | Kiểm tra file, export và dependency không được sử dụng |
| `pnpm typecheck` | Kiểm tra TypeScript |
| `pnpm check` | Chạy typecheck, lint và production build |

## Accent color

Admin chỉnh màu tại `/admin`. API `PATCH /api/admin/settings` validate mã `#RRGGBB`, lưu vào `public.site_settings`, revalidate cache và cập nhật CSS token toàn site. Giá trị mặc định là `#1f51ff`.

## Tài liệu

- [Hướng dẫn viết MDX](docs/INSTRUCTION.md)
- [Project Charter](docs/PROJECT_CHARTER.md)
- [Requirements](docs/REQUIREMENTS.md)
- [Processes](docs/PROCESSES.md)
- [Schema](docs/SCHEMA.md)
- [Release Report](docs/REPORT.md)
