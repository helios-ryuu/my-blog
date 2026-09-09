# Helios Space

Helios Space v3.0.0-beta.1 là không gian cá nhân kèm CMS hiện đại, hiệu năng cao, được xây dựng bằng Next.js 16, React 19, TypeScript, Supabase Postgres và Cloudflare R2. Dự án tích hợp hệ thống đồ họa WebGL tương tác, animation suite mượt mà, trình soạn thảo MDX phong phú, phân loại nội dung đa chiều (tag, danh mục động, series theo thứ tự) cùng giao diện quản trị 2 cột trực quan.

## Tính năng nổi bật

### Trải nghiệm người dùng & Giao diện (UI/UX)
- **WebGL Backgrounds & Hiệu ứng tương tác**:
  - Trang chủ tích hợp **WebThreads** (công nghệ OGL WebGL) kết hợp hiệu ứng đèn rọi spotlight chuyển động theo con trỏ chuột.
  - Trang danh sách bài viết `/post` tích hợp hiệu ứng hạt phân rã **PixelBlast** (Three.js + Postprocessing).
  - Tự động nhận diện thiết bị cảm ứng / màn hình di động để chuyển sang CSS Ambient Gradient siêu nhẹ, đảm bảo cuộn mượt mà 120Hz và không tiêu tốn tài nguyên phần cứng.
- **Hero Showcase & Typography Animation**:
  - Tiêu đề phụ hiệu ứng đảo chữ ngẫu nhiên (**Shuffle**).
  - Khối trích dẫn mở đầu phân tách ký tự mượt mà (**SplitText**).
  - Nút điều hướng phát sáng viền động (**BorderGlow**) thích ứng màu chủ đề sáng/tối.
- **Header & Navigation Panel**:
  - Navigation Panel thông minh: tự động thu gọn dạng floating trên màn hình lớn để tối ưu không gian hiển thị, tự bung mở khi di chuột lại gần mép trên; trên thiết bị di động giữ hiển thị cố định.
  - Thanh tìm kiếm (Search Bar) căn giữa tuyệt đối trên desktop, tự động chuyển đổi sang Mobile Search Bar ở màn hình nhỏ (< 1024px); nút bộ lọc (Advanced Search) xuất hiện riêng cho trang `/post`.
  - Nút chuyển đổi giao diện Sáng / Tối, đổi ngôn ngữ Việt / Anh, và phím tắt tới trang quản trị.
- **Hệ thống Banner thông báo động**:
  - Cấu hình đa ngôn ngữ trực tiếp từ CMS: nội dung HTML, dải màu gradient 3 màu, nút kêu gọi hành động (CTA button viền 1.5px nổi bật), độ trong suốt, chiều cao và thời gian hồi (cooldown) sau khi đóng.

### Trình đọc & Nội dung bài viết
- **Typography Markdown đồng nhất**:
  - Danh sách không thứ tự (`<ul>`) được chuẩn hoá hiển thị bằng dấu gạch đầu dòng (`- `) thay cho dấu chấm tròn (`•`), tạo phong cách thanh lịch và nhất quán.
  - Tô màu cú pháp code với `rehype-pretty-code` và `Shiki`.
  - Mục lục bài viết (TOC) trên desktop hỗ trợ cuộn con trỏ nhảy nhanh qua từng đề mục (Header jump) với độ phản hồi tức thì và đồng nhất vị trí dừng giữa click và scroll.
  - Hỗ trợ công cụ chia sẻ xã hội, tạo ảnh card QR code sắc nét và tải bài viết dạng Markdown thô.

### Quản trị nội dung & CMS (Admin Workspace)
- **Bố cục 2 cột trực quan**:
  - Cột trái: **Quản lý nội dung (Content Management)** tập trung cho Tạo bài viết, Quản lý bản nháp, Sửa/Xoá nội dung, Quản lý Danh mục và Phân nhóm.
  - Cột phải: **Cài đặt hệ thống (Site Settings)** giúp tùy biến màu Accent Color toàn site và cấu hình Banner thông báo tức thì.
- **Quản lý Danh mục (Categories) hiện đại**:
  - Dòng hiển thị tổng hợp 1 dòng (1-line summary row) với các pill danh mục bo tròn cuộn ngang, hiển thị huy hiệu đếm số bài viết thuộc từng danh mục.
  - Hộp thoại Tìm kiếm nâng cao (Advance Search Dialog) hỗ trợ tìm kiếm thời gian thực theo tên, slug, mục đích, ví dụ; thao tác Sửa modal và Xoá an toàn (chặn xoá danh mục đang có bài viết).
- **Quản lý Series & Standalone**:
  - Series độc lập với danh mục: bài viết có thể là Standalone hoặc nhận `series_id` kèm thứ tự duy nhất trong chuỗi.
  - Form bài viết tự đề xuất thứ tự trống nhỏ nhất tiếp theo.
- **Thư viện Media & Quản lý Storage Cloudflare R2**:
  - Tính toán đệ quy kích thước thư mục và số lượng file thực tế trong từng folder.
  - Thống kê tổng dung lượng lưu trữ (Total Storage) và tổng số file trên bucket R2.
  - Hỗ trợ tạo thư mục, tải file lên, đổi tên, xoá và sao chép URL ổn định.
- **Persistent Flash Toast**:
  - Hệ thống thông báo thông minh lưu qua `sessionStorage`, giữ vững thông báo xác nhận khi lưu nháp hoặc xuất bản qua các lần điều hướng trang client-side.
- **Bảo mật**:
  - Một tài khoản admin duy nhất, hỗ trợ mật khẩu băm SHA-256 qua biến môi trường, bảo vệ bằng phiên làm việc HMAC-SHA256 cookie HTTP-only.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
| --- | --- |
| **Framework & Core** | Next.js 16 (App Router, Turbopack/Webpack), React 19, TypeScript |
| **Styling & Theme** | Tailwind CSS 4, Radix UI, next-themes |
| **Đồ họa & WebGL** | OGL 1.0 (WebThreads), Three.js & Postprocessing (PixelBlast) |
| **Animation Suite** | GSAP 3.15, @gsap/react, Framer Motion 13, Motion |
| **Cơ sở dữ liệu** | Supabase Postgres (Row Level Security) |
| **Lưu trữ Media** | Cloudflare R2 (S3 API via AWS SDK v3) |
| **Nội dung & MDX** | MDX, Shiki, rehype-pretty-code, remark-gfm |
| **Đa ngôn ngữ** | next-intl (Tiếng Việt / English) |
| **Quản lý gói** | pnpm 11 |

---

## Cấu trúc mã nguồn

```text
src/
├── app/
│   ├── admin/             # CMS Workspace, Database Viewer, Media Library
│   ├── api/               # Server API routes (Auth, Admin, Settings, Media)
│   ├── post/              # Danh sách và chi tiết bài viết
│   ├── tag/               # Lọc bài viết theo tag
│   ├── category/          # Lọc bài viết theo danh mục
│   └── page.tsx           # Trang chủ với Hero Showcase
├── components/
│   ├── features/admin/    # Giao diện quản trị, SiteSettings, BucketManager
│   ├── features/home/     # HomeHero section & animation controls
│   ├── features/post/     # Card, list, TOC, meta và QR share popup
│   ├── layout/            # AppShell, Header, NavigationPanel, Banner, Footer
│   └── ui/                # UI primitives, WebThreads, PixelBlast, BorderGlow, TextType
├── contexts/              # UserContext, SiteSettingsContext, PostFilterContext
├── lib/                   # Database client, Storage R2, Auth, Navigation loading
└── types/                 # Kiểu dữ liệu TypeScript dùng chung

supabase/
└── schema.sql             # Toàn bộ schema cơ sở dữ liệu và seed ban đầu
```

---

## Cài đặt & Khởi chạy

### 1. Yêu cầu môi trường
- **Node.js**: phiên bản 24 trở lên
- **pnpm**: phiên bản 11 trở lên

### 2. Cài đặt dependency & biến môi trường

```bash
pnpm install
cp .env.example .env
```

Cấu hình các giá trị cần thiết trong `.env`. Mở **Supabase SQL Editor** và chạy toàn bộ nội dung file [supabase/schema.sql](supabase/schema.sql) để khởi tạo các bảng và dữ liệu mẫu ban đầu.

### 3. Khởi chạy môi trường phát triển

```bash
pnpm dev
```

Mở trình duyệt tại: `http://localhost:3456`.

---

## Cấu hình Biến môi trường (.env)

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Có | Public key truy vấn dữ liệu theo RLS |
| `SUPABASE_SECRET_KEY` | Có (CMS) | Secret key cho quyền ghi server-side |
| `NEXT_PUBLIC_SITE_URL` | Production | URL gốc của website cho metadata & SEO |
| `ADMIN_USERNAME` | Có | Tên đăng nhập admin duy nhất |
| `ADMIN_DISPLAY_NAME` | Không | Tên tác giả hiển thị ở header và footer |
| `ADMIN_PASSWORD` | Môi trường Dev | Mật khẩu dạng plain-text (chỉ dùng local) |
| `ADMIN_PASSWORD_HASH` | Production | Chuỗi băm SHA-256 hex 64 ký tự của mật khẩu |
| `SESSION_SECRET` | Production | Khóa bí mật ký session cookie HMAC-SHA256 |
| `R2_ENDPOINT` | Có | S3 Endpoint của Cloudflare R2 |
| `R2_BUCKET_NAME` | Có | Tên bucket R2 (ví dụ: `my-blog`) |
| `R2_ACCESS_KEY_ID` | Có | Access key ID của R2 API Token |
| `R2_SECRET_ACCESS_KEY` | Có | Secret access key của R2 API Token |
| `R2_PUBLIC_URL` | Không | Custom domain public liên kết tới bucket R2 |

> [!TIP]
> Tạo chuỗi băm mật khẩu SHA-256 cho Production:
> ```bash
> printf '%s' 'your-password' | sha256sum
> ```
> Tạo session secret 32 bytes ngẫu nhiên:
> ```bash
> openssl rand -hex 32
> ```

---

## Cloudflare R2 Storage

Media manager sử dụng AWS SDK tương thích giao thức S3 của Cloudflare R2:
- Khi `R2_PUBLIC_URL` để trống, media được stream gián tiếp qua endpoint `/api/media/<object-key>`.
- Khi gắn custom domain (ví dụ: `https://bucket-space.helios.id.vn`), các tệp media sẽ được phục vụ trực tiếp qua mạng lưới CDN Cloudflare với tốc độ tối ưu và khả năng cache cao.
- Trình quản lý media hiển thị tổng dung lượng sử dụng và số lượng file, hỗ trợ quản lý theo thư mục, tạo folder marker, đổi tên và xoá an toàn.

---

## Scripts thường dùng

| Lệnh | Chức năng |
| --- | --- |
| `pnpm dev` | Chạy dev server tại port 3456 |
| `pnpm build` | Build ứng dụng cho môi trường production |
| `pnpm start` | Chạy production server sau khi build |
| `pnpm lint` | Kiểm tra lỗi cú pháp và quy chuẩn với ESLint |
| `pnpm typecheck` | Kiểm tra kiểu TypeScript toàn bộ dự án (`tsc --noEmit`) |
| `pnpm knip` | Quét mã nguồn tìm tệp, dependency và export không dùng đến |
| `pnpm check` | Chạy toàn bộ quy trình kiểm tra: typecheck, lint và build |

---

## Tài liệu chi tiết

- [Hướng dẫn viết bài MDX](docs/INSTRUCTION.md): Cú pháp bài viết, alert box, code block, hình ảnh và danh sách dấu gạch đầu dòng.
- [Quy trình vận hành CMS (Processes)](docs/PROCESSES.md): Hướng dẫn chi tiết về xuất bản bài viết, quản lý danh mục, series và cài đặt hệ thống.
