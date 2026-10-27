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
- **Trang Tài liệu Hệ thống (`Docs` - `/docs`)**: Trung tâm tài liệu trực tuyến tích hợp trên thanh điều hướng (Navbar), tổng hợp chuẩn cú pháp Markdown & MDX của hệ thống kèm ví dụ hiển thị thực tế và nút tải file mẫu `.mdx`.
- **Mục lục bài viết (Table of Contents)**: Tự động tổng hợp đề mục từ nội dung bài viết và đồng bộ vị trí đọc theo thời gian thực khi cuộn trang.
- **Phân loại bài viết linh hoạt**: Tổ chức nội dung theo Danh mục (Categories), Thẻ (Tags) và Chuỗi bài viết (Series) có thứ tự rõ ràng.
- **Chia sẻ & Tải về**: Tạo ảnh card kèm mã QR để chia sẻ bài viết lên mạng xã hội hoặc tải về bản Markdown thô nhanh chóng.
- **Chỉnh sửa nhanh**: Quản trị viên khi đăng nhập có thể truy cập nhanh vào trình biên tập của từng bài viết ngay từ giao diện đọc.

### Hệ thống Quản trị (CMS & Admin Workspace)
- **Trình soạn thảo chuyên dụng**: Giao diện viết bài dạng 2 cột toàn màn hình độc lập, tích hợp khung soạn thảo Markdown và panel xem trước kết quả tức thì (Live Preview).
- **Upload Post (`.mdx`) & Tải Template**: Hỗ trợ tải lên file `.mdx` (hoặc `.md`) chuẩn bị sẵn, tự động bóc tách YAML Frontmatter (hoặc trích xuất từ nội dung) để chuyển thành **Bản nháp (Draft)** cùng nút tải file mẫu `post-template.mdx`.
- **Trình chỉnh sửa Tài liệu (`Docs Editor`)**: Cho phép chỉnh sửa trực tiếp nội dung trang `/docs` ngay trong Admin với giao diện 2 cột Live Preview và chèn ảnh Cloudflare R2 tương tự trình sửa bài viết.
- **Quản lý nội dung chuẩn hóa**: Giao diện quản trị được gom nhóm trực quan theo thực thể (Bài viết & Bản nháp, Danh mục, Chuỗi bài Series, Thẻ Tags và Tài liệu hệ thống).
- **Sơ đồ quan hệ CSDL (ER Diagram)**: Công cụ trực quan hóa cấu trúc cơ sở dữ liệu tương tác bằng React Flow, hỗ trợ kéo thả và xem chi tiết liên kết giữa các bảng.
- **Quản lý Media Cloudflare R2**: Tích hợp lưu trữ đám mây chuẩn S3, cho phép tạo thư mục, tải tệp lên, xem trước, thống kê dung lượng và phân phối nhanh qua CDN.
- **Cài đặt hệ thống**: Tùy chỉnh màu chủ đạo (Accent Color), cấu hình Banner thông báo toàn trang với nội dung đa ngôn ngữ và thanh trượt điều chỉnh trực quan.

### Bảo mật & Vận hành (Security & Reliability)
- **Quản lý phiên an toàn**: Xác thực admin theo thời gian cố định (constant-time) với mật khẩu băm SHA-256 và cookie phiên HTTP-only được ký bảo mật bằng HMAC-SHA256.
- **Bộ nhớ đệm điều hướng & Mốc thời gian dữ liệu**: Giữ dữ liệu đã tải trong phiên làm việc khi chuyển đổi giữa các trang trên thanh Navbar (không tải lại cho đến khi reload trang hoặc nhấn Làm mới), đồng thời hiển thị mốc thời gian tải dữ liệu (`HH:mm:ss`) ngay trên nút **Làm mới**.
- **Đa ngôn ngữ (i18n)**: Hỗ trợ chuyển đổi song ngữ Tiếng Việt và English xuyên suốt giao diện người dùng và nội dung hệ thống.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
| --- | --- |
| **Framework & Core** | Next.js 16 (App Router, Turbopack/Webpack), React 19, TypeScript |
| **Styling & Theme** | Tailwind CSS 4, Radix UI, next-themes |
| **Đồ họa & WebGL** | OGL 1.0 (WebThreads), Three.js & Postprocessing (PixelBlast) |
| **Animation Suite** | GSAP 3.15, @gsap/react, Framer Motion 14, Motion 14 |
| **Cơ sở dữ liệu & Sơ đồ** | Supabase Postgres (Row Level Security), React Flow (@xyflow/react) |
| **Lưu trữ Media** | Cloudflare R2 (S3 API via AWS SDK v3) |
| **Nội dung & MDX** | MDX, Shiki, rehype-pretty-code, remark-gfm |
| **Đa ngôn ngữ** | next-intl (Tiếng Việt / English) |
| **Quản lý gói** | pnpm 12 |

---

## Cấu trúc mã nguồn

```text
src/
├── app/
│   ├── admin/             # CMS Workspace, Database Viewer, Media Library
│   ├── api/               # Server API routes (Auth, Admin, Settings, Media, Posts, Docs)
│   ├── docs/              # Trang tài liệu hệ thống (Documentation Hub)
│   ├── post/              # Danh sách và chi tiết bài viết
│   ├── profile/           # Trang hồ sơ cá nhân
│   ├── tag/               # Lọc bài viết theo tag
│   ├── category/          # Lọc bài viết theo danh mục
│   └── page.tsx           # Trang chủ với Hero Showcase
├── components/
│   ├── features/admin/    # Giao diện quản trị, UploadPostModal, DocsEditorModal, BucketManager
│   ├── features/docs/     # Giao diện Documentation Hub (/docs)
│   ├── features/home/     # HomeHero section & animation controls
│   ├── features/post/     # Card, list, TOC, meta và QR share popup
│   ├── layout/            # AppShell, Header, NavigationPanel, Banner, Footer
│   └── ui/                # UI primitives, WebThreads, PixelBlast, BorderGlow, TextType
├── contexts/              # UserContext, SiteSettingsContext, PostFilterContext, AdminCacheContext
├── data/                  # Dữ liệu mặc định hệ thống (docs-content.ts)
├── lib/                   # Database client, Storage R2, Auth, MDX Frontmatter parser
└── types/                 # Kiểu dữ liệu TypeScript dùng chung

supabase/
└── schema.sql             # Toàn bộ schema cơ sở dữ liệu và seed ban đầu
```

---

## Cài đặt & Khởi chạy

Dự án hỗ trợ chạy hoàn toàn bằng **Podman (Containerized)**, không yêu cầu cài đặt bất kỳ phiên bản Node.js hay package manager nào lên máy host.

### 1. Khởi chạy bằng Podman (Khuyên dùng - Không cần cài Node)

Yêu cầu máy host đã cài đặt `podman` và `podman-compose`.

```bash
# Khởi chạy dev server ở chế độ nền
podman compose up -d

# Xem log hoạt động
podman compose logs -f web

# Chạy toàn bộ quy trình kiểm tra (typecheck, lint, build)
podman compose exec web pnpm check

# Dừng môi trường container
podman compose down
```

Truy cập website tại: `http://localhost:3456`.

### 2. Khởi chạy trực tiếp (Native / Local)

Nếu máy host có sẵn Node.js và pnpm:
- **Node.js**: phiên bản 24 trở lên
- **pnpm**: phiên bản 12 trở lên

```bash
pnpm install
cp .env.example .env # nếu chưa có .env
pnpm dev
```

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

## Quy trình sau khi code xong từ nhánh `develop` (Release Workflow)

Sau khi hoàn tất phát triển tính năng hoặc chỉnh sửa trên nhánh `develop`, thực hiện theo 4 bước chuẩn dưới đây để kiểm định chất lượng và phát hành lên Production (`main`):

### Bước 1: Kiểm tra chất lượng mã nguồn (`pnpm check`)
Đảm bảo toàn bộ kiểm tra kiểu dữ liệu (`typecheck`), quy chuẩn (`lint`) và đóng gói (`build`) đều vượt qua không lỗi:

```bash
# Nếu đang chạy môi trường container Podman / Docker:
podman compose exec web pnpm check

# Hoặc chạy trực tiếp trên máy host:
pnpm check
```

### Bước 2: Cập nhật phiên bản & Đẩy code lên `develop`
1. Mở `package.json` và nâng số phiên bản tại trường `"version"` theo chuẩn Semantic Versioning (ví dụ: `"2.2.1"` → `"2.3.0"` cho tính năng mới, hoặc `"2.2.2"` cho bản vá lỗi).
2. Commit thay đổi và push lên nhánh `develop`:

```bash
git add -A
git commit -m "chore(release): bump version to v2.3.0"
git push origin develop
```

### Bước 3: Hợp nhất sang nhánh `release` (`develop` → `release`)
Đồng bộ nhánh `develop` sang nhánh `release` để chạy CI Quality Gate (`ci.yml`) trước khi đưa lên Production:

```bash
git checkout release
git pull origin release
git merge --no-ff develop -m "chore(release): prepare release v2.3.0"
git push origin release
```
*(Hoặc tạo Pull Request từ `develop` → `release` trên giao diện GitHub).*

### Bước 4: Phát hành lên Production (`release` → `main`)
1. Tạo **Pull Request** từ nhánh `release` vào nhánh `main` trên GitHub:
   - **Tiêu đề PR**: `Release v2.3.0` (hoặc tên tóm tắt bản phát hành).
   - **Nội dung mô tả PR**: Danh sách các thay đổi chính (sẽ được dùng làm Release Notes).
2. Chờ GitHub Actions **CI (`ci.yml`)** báo xanh, sau đó nhấn **Merge Pull Request** vào `main`.
3. Ngay khi `release` được merge vào `main`:
   - GitHub Actions **Automated Release (`release.yml`)** sẽ tự động đọc `"version"` trong `package.json`, tạo Git Tag `vX.Y.Z` và xuất bản **GitHub Release** chính thức kèm `Full Changelog`.
   - Nền tảng hosting (Vercel) tự động lấy bản build mới nhất từ `main` để triển khai lên Production.
4. Quay lại nhánh `develop` để tiếp tục chu kỳ phát triển tiếp theo:

```bash
git checkout develop
git merge main
git push origin develop
```

---

## Tài liệu chi tiết

- [Hướng dẫn viết bài MDX](docs/INSTRUCTION.md): Cú pháp bài viết, alert box, code block, hình ảnh và danh sách dấu gạch đầu dòng.
- [Quy trình vận hành CMS (Processes)](docs/PROCESSES.md): Hướng dẫn chi tiết về xuất bản bài viết, quản lý danh mục, series và cài đặt hệ thống.
