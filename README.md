# Helios Space

Helios Space là không gian blog cá nhân kết hợp hệ quản trị nội dung (CMS) gọn nhẹ, hiện đại và hiệu năng cao. Dự án được xây dựng trên nền tảng **Next.js 16**, **React 19**, **TypeScript**, **Supabase Postgres** và **Cloudflare R2**, chú trọng trải nghiệm thị giác ấn tượng với đồ họa tương tác WebGL, hoạt ảnh mượt mà cùng giao diện quản trị trực quan, tiện lợi.

---

## Tính năng chính

### Trải nghiệm người dùng & Giao diện (UI/UX)
- **Thiết kế hiện đại & Tương tác phong phú**: Giao diện tối ưu theo phong cách hiện đại với hiệu ứng đồ họa WebGL (OGL, Three.js), đèn rọi (spotlight) và chuyển động viền sáng (glow effects) tương tác theo chuột.
- **Bố cục Bento Grid**: Trình bày danh sách bài viết nổi bật dạng lưới Bento trực quan, hiển thị đầy đủ thông tin danh mục, thời gian đọc, ảnh bìa và tóm tắt.
- **Thanh điều hướng nổi (Floating Dock)**: Menu điều hướng thông minh hỗ trợ chuyển đổi nhanh trang, tìm kiếm bài viết, đổi ngôn ngữ (i18n), chuyển đổi chủ đề (Dark/Light mode) và liên kết mạng xã hội.
- **Trang Hồ sơ cá nhân (Profile)**: Tích hợp thẻ nhận diện 3D tương tác Holographic cùng khung hiển thị Markdown đồng bộ trực tiếp từ GitHub Profile.
- **Tối ưu hóa đa thiết bị**: Tự động tinh chỉnh chất lượng hiển thị và hoạt ảnh phù hợp với cả màn hình lớn lẫn thiết bị di động, đảm bảo tốc độ khung hình mượt mà và tiết kiệm pin.

### Đọc & Xuất bản nội dung (Content & Reading)
- **Hỗ trợ định dạng MDX**: Soạn thảo và hiển thị bài viết với định dạng Markdown mở rộng, tô màu cú pháp code với Shiki, hỗ trợ các khối thông báo (callouts/alerts) và bảng dữ liệu.
- **Mục lục bài viết (Table of Contents)**: Tự động tổng hợp đề mục từ nội dung bài viết và đồng bộ vị trí đọc theo thời gian thực khi cuộn trang.
- **Phân loại bài viết linh hoạt**: Tổ chức nội dung theo Danh mục (Categories), Thẻ (Tags) và Chuỗi bài viết (Series) có thứ tự rõ ràng.
- **Chia sẻ & Tải về**: Tạo ảnh card kèm mã QR để chia sẻ bài viết lên mạng xã hội hoặc tải về bản Markdown thô nhanh chóng.
- **Chỉnh sửa nhanh**: Quản trị viên khi đăng nhập có thể truy cập nhanh vào trình biên tập của từng bài viết ngay từ giao diện đọc.

### Hệ thống Quản trị (CMS & Admin Workspace)
- **Trình soạn thảo chuyên dụng**: Giao diện viết bài dạng 2 cột toàn màn hình độc lập, tích hợp khung soạn thảo Markdown và panel xem trước kết quả tức thì (Live Preview).
- **Quản lý nội dung toàn diện**: Quản lý bài viết xuất bản và bản nháp, phân loại theo series, quản lý danh mục và hệ thống tags với các thao tác nhanh.
- **Sơ đồ quan hệ CSDL (ER Diagram)**: Công cụ trực quan hóa cấu trúc cơ sở dữ liệu tương tác bằng React Flow, hỗ trợ kéo thả và xem chi tiết liên kết giữa các bảng.
- **Quản lý Media Cloudflare R2**: Tích hợp lưu trữ đám mây chuẩn S3, cho phép tạo thư mục, tải tệp lên, xem trước, thống kê dung lượng và phân phối nhanh qua CDN.
- **Cài đặt hệ thống**: Tùy chỉnh màu chủ đạo (Accent Color), cấu hình Banner thông báo toàn trang với nội dung đa ngôn ngữ và thanh trượt điều chỉnh trực quan.

### Bảo mật & Vận hành (Security & Reliability)
- **Bảo mật đăng nhập đa tầng**: Kiểm soát tần suất đăng nhập (Rate Limiting) theo địa chỉ IP thực tế, tự động khóa tạm thời theo cấp độ khi phát hiện tấn công brute-force.
- **Bảng theo dõi an ninh**: Quản trị viên có thể theo dõi danh sách IP bị hạn chế và mở khóa ngay trên giao diện quản trị.
- **Quản lý phiên an toàn**: Xác thực admin với mật khẩu băm SHA-256 và cookie phiên HTTP-only được ký bảo mật bằng HMAC-SHA256.
- **Đa ngôn ngữ (i18n)**: Hỗ trợ chuyển đổi song ngữ Tiếng Việt và English xuyên suốt giao diện người dùng và nội dung hệ thống.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
| --- | --- |
| **Framework & Core** | Next.js 16 (App Router, Turbopack/Webpack), React 19, TypeScript |
| **Styling & Theme** | Tailwind CSS 4, Radix UI, next-themes |
| **Đồ họa & WebGL** | OGL 1.0 (WebThreads), Three.js & Postprocessing (PixelBlast) |
| **Animation Suite** | GSAP 3.15, @gsap/react, Framer Motion 13, Motion |
| **Cơ sở dữ liệu & Sơ đồ** | Supabase Postgres (Row Level Security), React Flow (@xyflow/react) |
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
│   ├── api/               # Server API routes (Auth, Admin, Settings, Media, Posts)
│   ├── post/              # Danh sách và chi tiết bài viết
│   ├── profile/           # Trang hồ sơ cá nhân
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
